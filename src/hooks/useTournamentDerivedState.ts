import { useMemo } from 'react'
import type { Participant, Round } from '../tournamentTypes'
import {
  calculateStandingsBeforeRounds,
  compareRankingParticipants,
  getRankingParticipants,
} from '../tournament'
import { sortStats } from '../tournamentStats'

export function useTournamentDerivedState(
  players: Participant[],
  rounds: Round[],
  sort: string,
  desc: boolean,
) {
  const standingsBeforeRounds = useMemo(
    () => calculateStandingsBeforeRounds(players, rounds),
    [players, rounds],
  )
  const stats = useMemo(
    () =>
      getRankingParticipants(players, rounds).map((player) => ({
        ...player,
        played: player.wins + player.losses,
        diff: player.scored - player.conceded,
        points: player.scored,
      })),
    [players, rounds],
  )
  const participantOrderByRound = useMemo(
    () =>
      rounds.map((_, roundIndex) => {
        const ranking = getRankingParticipants(players, rounds.slice(0, roundIndex))
        if (roundIndex > 0) ranking.sort(compareRankingParticipants)
        return ranking.map((player) => player.id)
      }),
    [players, rounds],
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
