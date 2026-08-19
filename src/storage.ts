import type { Participant } from './components/Players'

export type StorageKey = 'players' | 'rounds' | 'participantType'

type StorageMessage = { key: StorageKey; source: string }

const tabId = Math.random().toString(36).slice(2)
const channel =
  typeof BroadcastChannel === 'function' ? new BroadcastChannel('courtly-storage') : null

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
const write = (key: StorageKey, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
  channel?.postMessage({ key, source: tabId } satisfies StorageMessage)
}

export const saveParticipants = (value: Participant[]) => write('players', value)
export const loadRounds = () => read<Round[]>('rounds', [])
export const saveRounds = (value: Round[]) => write('rounds', value)
export const loadParticipantType = (): 'players' | 'teams' =>
  localStorage.getItem('participantType') === 'teams' ? 'teams' : 'players'
export const saveParticipantType = (value: 'players' | 'teams') => write('participantType', value)

export const subscribeToStorage = (listener: (key: StorageKey) => void) => {
  const handleMessage = (event: MessageEvent<StorageMessage>) => {
    if (event.data?.source !== tabId) listener(event.data.key)
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'players' || event.key === 'rounds' || event.key === 'participantType') {
      listener(event.key)
    }
  }

  if (channel) channel.addEventListener('message', handleMessage)
  else window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage)
    else window.removeEventListener('storage', handleStorage)
  }
}
