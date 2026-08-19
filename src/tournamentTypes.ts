export type Participant = {
  id: string
  name: string
  wins: number
  losses: number
  scored: number
  conceded: number
  setsWon?: number
  setsLost?: number
  withdrawn?: boolean
}

export type SetScore = { a: string; b: string }

export type Match = {
  id: string
  a: string
  b: string
  scoreA: string
  scoreB: string
  sets?: SetScore[]
}

export type RoundStanding = {
  participantId: string
  wins: number
  losses: number
  scored: number
  conceded: number
  setsWon: number
  setsLost: number
}

export type Round = {
  number: number
  startedAt?: string
  bye?: string | null
  winningGames: number
  courtCount?: number
  matches: Match[]
  standings?: RoundStanding[]
}

export type TournamentSnapshot = {
  version: 1
  tournamentName: string
  players: Participant[]
  rounds: Round[]
  participantType: 'players' | 'teams'
  courtCount: number
  defaultWinningGames: number
}
