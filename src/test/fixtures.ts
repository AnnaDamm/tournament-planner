import type { Match, Participant, Round, SetScore } from '../tournamentTypes'

export const player = (id: string, name = id, extra: Partial<Participant> = {}): Participant => ({
  id,
  name,
  wins: 0,
  losses: 0,
  scored: 0,
  conceded: 0,
  ...extra,
})

export const makePlayers = (count: number): Participant[] =>
  Array.from({ length: count }, (_, index) =>
    player(`p${index + 1}`, `Player ${String.fromCharCode(65 + index)}`),
  )

export const set = (a: number | string, b: number | string): SetScore => ({
  a: String(a),
  b: String(b),
})

export const match = (
  id: string,
  a: string,
  b: string,
  sets: Array<[number | string, number | string]> = [],
  extra: Partial<Match> = {},
): Match => ({
  id,
  a,
  b,
  scoreA: '',
  scoreB: '',
  ...(sets.length ? { sets: sets.map(([x, y]) => set(x, y)) } : {}),
  ...extra,
})

export const round = (number: number, matches: Match[], extra: Partial<Round> = {}): Round => ({
  number,
  winningGames: 2,
  matches,
  ...extra,
})
