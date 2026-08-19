import { useMemo } from 'react'
import type { Participant } from '../components/Participant'
import type { Round } from '../storage'
import { calculateStandings } from '../tournament'
import { sortStats } from '../tournamentStats'

export function useTournamentDerivedState(
  players: Participant[],
  rounds: Round[],
  sort: string,
  desc: boolean,
) {
  const standings = useMemo(() => calculateStandings(players, rounds), [players, rounds])
  const standingsBeforeRounds = useMemo(
    () => rounds.map((_, index) => calculateStandings(players, rounds.slice(0, index))),
    [players, rounds],
  )
  const stats = useMemo(
    () =>
      standings.map((player) => ({
        ...player,
        played: player.wins + player.losses,
        diff: player.scored - player.conceded,
        points: player.scored,
      })),
    [standings],
  )
  const positions = useMemo(
    () =>
      new Map(sortStats(stats, 'position', true).map((player, index) => [player.id, index + 1])),
    [stats],
  )
  const sorted = useMemo(
    () =>
      sortStats(stats, sort, desc).map((player) => ({
        ...player,
        position: positions.get(player.id) ?? 0,
      })),
    [positions, sort, desc, stats],
  )

  return { standingsBeforeRounds, sorted }
}
