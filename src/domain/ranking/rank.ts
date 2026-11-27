import type { EvaluationContext } from '../evaluation'
import { calculateStandings, collectResults } from '../standings/standings'
import type { Participant, Round } from '../types'
import { getLastLossRounds } from './defaultTieBreakers'
import { tieBreakers } from './registry'
import type { RankingInput, RankingParticipant } from './types'

export const getMatchPoints = (
  standing: { wins: number; draws?: number },
  ctx: Pick<EvaluationContext, 'scoring'>,
) =>
  standing.wins * ctx.scoring.matchPoints.win + (standing.draws ?? 0) * ctx.scoring.matchPoints.draw

export const getRankingParticipants = (
  players: Participant[],
  rounds: Round[],
  ctx: EvaluationContext,
): RankingParticipant[] => {
  const standings = calculateStandings(players, rounds, ctx)
  const ids = players.map((player) => player.id)
  const results = collectResults(new Set(ids), rounds, ctx)
  const input: RankingInput = {
    participants: players,
    rounds,
    standings: new Map(
      standings.map((item) => [
        item.id,
        { ...item, participantId: item.id, matchPoints: getMatchPoints(item, ctx) },
      ]),
    ),
    results,
    ctx,
  }
  const values = ctx.tieBreakers
    .map((id) => tieBreakers[id]?.compute(input))
    .filter((map): map is NonNullable<typeof map> => Boolean(map))
  const lastLossRounds = getLastLossRounds(ids, results)
  return standings.map((player) => ({
    ...player,
    draws: player.draws ?? 0,
    setsWon: player.setsWon ?? 0,
    setsLost: player.setsLost ?? 0,
    matchPoints: getMatchPoints(player, ctx),
    lastLossRound: lastLossRounds.get(player.id) ?? 0,
    tieBreakValues: values.map((map) => map.get(player.id) ?? 0),
  }))
}

/** Match points first, then the tie-breakers in order, finally the name. */
export const compareRankingParticipants = (
  first: RankingParticipant,
  second: RankingParticipant,
) => {
  if (first.matchPoints !== second.matchPoints)
    return first.matchPoints > second.matchPoints ? -1 : 1
  for (let index = 0; index < first.tieBreakValues.length; index += 1) {
    const a = first.tieBreakValues[index]
    const b = second.tieBreakValues[index]
    if (a !== b) return a > b ? -1 : 1
  }
  return first.name.localeCompare(second.name)
}

export const rankParticipants = (players: Participant[], rounds: Round[], ctx: EvaluationContext) =>
  getRankingParticipants(players, rounds, ctx).sort(compareRankingParticipants)
