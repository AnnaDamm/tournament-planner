import type { Participant } from './components/Players'

export type StorageKey =
  'players' | 'rounds' | 'participantType' | 'courtCount' | 'defaultWinningGames' | 'tournamentName'

type StorageMessage = { key: StorageKey; source: string }

const tabId = Math.random().toString(36).slice(2)
const channel =
  typeof BroadcastChannel === 'function' ? new BroadcastChannel('tourny-storage') : null

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
export const loadCourtCount = () => {
  const value = read<number>('courtCount', 1)
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}
export const saveCourtCount = (value: number) => write('courtCount', value)
export const loadDefaultWinningGames = () => {
  const value = read<number>('defaultWinningGames', 1)
  return Number.isFinite(value) ? Math.min(9, Math.max(1, Math.floor(value))) : 1
}
export const saveDefaultWinningGames = (value: number) => write('defaultWinningGames', value)
export const loadTournamentName = () => {
  const value = read<unknown>('tournamentName', 'Tourny')
  return typeof value === 'string' && value.trim() ? value.trim() : 'Tourny'
}
export const saveTournamentName = (value: string) =>
  write('tournamentName', value.trim() || 'Tourny')
export const loadParticipantType = (): 'players' | 'teams' =>
  localStorage.getItem('participantType') === 'teams' ? 'teams' : 'players'
export const saveParticipantType = (value: 'players' | 'teams') => write('participantType', value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isParticipant = (value: unknown): value is Participant =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isFiniteNumber(value.wins) &&
  isFiniteNumber(value.losses) &&
  isFiniteNumber(value.scored) &&
  isFiniteNumber(value.conceded)

const isMatch = (value: unknown): value is Match =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.a === 'string' &&
  typeof value.b === 'string' &&
  typeof value.scoreA === 'string' &&
  typeof value.scoreB === 'string' &&
  (value.sets === undefined ||
    (Array.isArray(value.sets) &&
      value.sets.every(
        (set) => isRecord(set) && typeof set.a === 'string' && typeof set.b === 'string',
      )))

const isRound = (value: unknown): value is Round =>
  isRecord(value) &&
  isFiniteNumber(value.number) &&
  isFiniteNumber(value.winningGames) &&
  Array.isArray(value.matches) &&
  value.matches.every(isMatch) &&
  (value.courtCount === undefined || isFiniteNumber(value.courtCount))

export const parseTournamentSnapshot = (value: unknown): TournamentSnapshot | null => {
  if (!isRecord(value)) return null
  if (value.version !== undefined && value.version !== 1) return null
  if (!Array.isArray(value.players) || !value.players.every(isParticipant)) return null
  if (!Array.isArray(value.rounds) || !value.rounds.every(isRound)) return null
  if (value.participantType !== 'players' && value.participantType !== 'teams') return null
  if (!isFiniteNumber(value.courtCount) || !isFiniteNumber(value.defaultWinningGames)) return null

  const tournamentName = typeof value.tournamentName === 'string' ? value.tournamentName.trim() : ''
  if (!tournamentName) return null

  return {
    version: 1,
    tournamentName,
    players: value.players,
    rounds: value.rounds,
    participantType: value.participantType,
    courtCount: Math.max(1, Math.floor(value.courtCount)),
    defaultWinningGames: Math.min(9, Math.max(1, Math.floor(value.defaultWinningGames))),
  }
}

export const subscribeToStorage = (listener: (key: StorageKey) => void) => {
  const handleMessage = (event: MessageEvent<StorageMessage>) => {
    if (event.data?.source !== tabId) listener(event.data.key)
  }
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === 'players' ||
      event.key === 'rounds' ||
      event.key === 'participantType' ||
      event.key === 'courtCount' ||
      event.key === 'defaultWinningGames' ||
      event.key === 'tournamentName'
    ) {
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
