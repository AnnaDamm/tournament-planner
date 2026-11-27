import type { EvaluationContext } from '../evaluation'
import { getMatchFormat } from '../format'
import { isUnknownParticipantId } from '../ids'
import { getMatchSideIds, hasValidBye, isByeCounted } from '../participants'
import type { CountedResult } from '../ranking/types'
import type { Participant, ParticipantId, Round, RoundStanding } from '../types'

const newStanding = (player: Participant): RoundStanding => ({
  participantId: player.id,
  wins: 0,
  draws: 0,
  losses: 0,
  scored: 0,
  conceded: 0,
  setsWon: 0,
  setsLost: 0,
})

const applyRoundToStandings = (
  standings: Map<string, RoundStanding>,
  round: Round,
  nextRound: Round | undefined,
  ctx: EvaluationContext,
) => {
  if (isByeCounted(round, nextRound)) {
    const byeStanding = standings.get(round.bye!)
    if (byeStanding) {
      const credit = ctx.rules.getByeCredit(round.format, ctx.defaultFormat)
      byeStanding.wins += 1
      byeStanding.setsWon += credit.gamesWon
      byeStanding.scored += credit.points
    }
  }

  round.matches.forEach((match) => {
    const sideA = getMatchSideIds(match, 'a')
    const sideB = getMatchSideIds(match, 'b')
    if ([...sideA, ...sideB].some((id) => isUnknownParticipantId(id) || !standings.has(id))) return

    const result = ctx.rules.getResult(match, getMatchFormat(round, match))
    if (!result) return
    const credit = (ids: string[], own: 'a' | 'b') => {
      const isA = own === 'a'
      ids.forEach((id) => {
        const standing = standings.get(id)!
        standing.wins += result.outcome === own ? 1 : 0
        standing.draws = (standing.draws ?? 0) + (result.outcome === 'draw' ? 1 : 0)
        standing.losses += result.outcome === 'draw' || result.outcome === own ? 0 : 1
        standing.scored += isA ? result.pointsA : result.pointsB
        standing.conceded += isA ? result.pointsB : result.pointsA
        standing.setsWon += isA ? result.gamesA : result.gamesB
        standing.setsLost += isA ? result.gamesB : result.gamesA
      })
    }
    credit(sideA, 'a')
    credit(sideB, 'b')
  })
}

const standingsSnapshot = (players: Participant[], standings: Map<string, RoundStanding>) =>
  players.map((player) => ({
    ...player,
    ...(standings.get(player.id) ?? newStanding(player)),
  }))

export const calculateStandings = (
  players: Participant[],
  rounds: Round[],
  ctx: EvaluationContext,
) => {
  const standings = new Map(players.map((player) => [player.id, newStanding(player)]))
  rounds.forEach((round, index) => applyRoundToStandings(standings, round, rounds[index + 1], ctx))
  return standingsSnapshot(players, standings)
}

export const calculateStandingsBeforeRounds = (
  players: Participant[],
  rounds: Round[],
  ctx: EvaluationContext,
) => {
  const standings = new Map(players.map((player) => [player.id, newStanding(player)]))
  return rounds.map((round, index) => {
    const snapshot = standingsSnapshot(players, standings)
    applyRoundToStandings(standings, round, rounds[index + 1], ctx)
    return snapshot
  })
}

/** Every finished match and counted bye of the rounds, in order. */
export const collectResults = (
  participantIds: Set<ParticipantId>,
  rounds: Round[],
  ctx: EvaluationContext,
): CountedResult[] =>
  rounds.flatMap((round, index) => {
    const results: CountedResult[] = []
    if (
      isByeCounted(round, rounds[index + 1]) &&
      hasValidBye(round) &&
      participantIds.has(round.bye!)
    ) {
      results.push({ roundNumber: round.number, kind: 'bye', participantId: round.bye! })
    }
    round.matches.forEach((match) => {
      const ids = [...getMatchSideIds(match, 'a'), ...getMatchSideIds(match, 'b')]
      if (ids.some((id) => !participantIds.has(id))) return
      const result = ctx.rules.getResult(match, getMatchFormat(round, match))
      if (result) results.push({ roundNumber: round.number, kind: 'match', match, result })
    })
    return results
  })
