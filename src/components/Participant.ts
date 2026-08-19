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
