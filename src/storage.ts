import type { Participant } from './components/Players'

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
  bye?: string | null
  winningGames: number
  matches: Match[]
  standings?: RoundStanding[]
}

const read = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

export const loadParticipants = () => read<Participant[]>('players', [])
export const saveParticipants = (value: Participant[]) =>
  localStorage.setItem('players', JSON.stringify(value))
export const loadRounds = () => read<Round[]>('rounds', [])
export const saveRounds = (value: Round[]) => localStorage.setItem('rounds', JSON.stringify(value))
export const loadParticipantType = (): 'players' | 'teams' =>
  localStorage.getItem('participantType') === 'teams' ? 'teams' : 'players'
export const saveParticipantType = (value: 'players' | 'teams') =>
  localStorage.setItem('participantType', value)
