import { useMemo } from 'react'
import type { Participant, Round } from '../tournamentTypes'
import type { EvaluationContext } from '../tournament'
import {
  calculateStandingsBeforeRounds,
  compareRankingParticipants,
  getRankingParticipants,
} from '../tournament'
import { sortStats } from '../tournamentStats'

export function useTournamentDerivedState(
  players: Participant[],
  rounds: Round[],
  ctx: EvaluationContext,
  sort: string,
  desc: boolean,
) {
  const standingsBeforeRounds = useMemo(
    () => calculateStandingsBeforeRounds(players, rounds, ctx),
    [ctx, players, rounds],
  )
  const stats = useMemo(
    () =>
      getRankingParticipants(players, rounds, ctx).map((player) => ({
        ...player,
        played: player.wins + player.draws + player.losses,
        diff: player.scored - player.conceded,
        points: player.scored,
      })),
    [ctx, players, rounds],
  )
  const participantOrderByRound = useMemo(
    () =>
      rounds.map((_, roundIndex) => {
        const ranking = getRankingParticipants(players, rounds.slice(0, roundIndex), ctx)
        if (roundIndex > 0) ranking.sort(compareRankingParticipants)
        return ranking.map((player) => player.id)
      }),
    [ctx, players, rounds],
  )
  const positions = useMemo(
    () =>
      new Map(
        (rounds.some((round) => round.startedAt) ? sortStats(stats, 'position', true) : stats).map(
          (player, index) => [player.id, index + 1],
        ),
      ),
    [rounds, stats],
  )
  const sorted = useMemo(
    () =>
      (rounds.some((round) => round.startedAt) ? sortStats(stats, sort, desc) : stats).map(
        (player) => ({
          ...player,
          position: positions.get(player.id) ?? 0,
        }),
      ),
    [positions, sort, desc, stats, rounds],
  )

  return { standingsBeforeRounds, participantOrderByRound, sorted }
}
