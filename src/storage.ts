import type { Participant, Round } from './tournamentTypes'

export type StorageKey =
  | 'players'
  | 'rounds'
  | 'participantType'
  | 'courtCount'
  | 'defaultWinningGames'
  | 'defaultSetPoints'
  | 'tournamentName'
  | 'expectedDurationMinutes'
  | 'breakBetweenMatchesMinutes'
  | 'scheduledStart'

type StorageMessage = { key: StorageKey; source: string }

const storageKeys: StorageKey[] = [
  'players',
  'rounds',
  'participantType',
  'courtCount',
  'defaultWinningGames',
  'defaultSetPoints',
  'tournamentName',
  'expectedDurationMinutes',
  'breakBetweenMatchesMinutes',
  'scheduledStart',
]
const tabId = Math.random().toString(36).slice(2)
const storagePrefix = `${import.meta.env.BASE_URL}:`
const storageKey = (key: StorageKey) => `${storagePrefix}${key}`
const channel =
  typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(`tourny-storage:${import.meta.env.BASE_URL}`)
    : null

if (!import.meta.env.BASE_URL.includes('/previews/')) {
  for (const key of storageKeys) {
    const legacyValue = localStorage.getItem(key)
    if (legacyValue === null) continue
    if (localStorage.getItem(storageKey(key)) === null)
      localStorage.setItem(storageKey(key), legacyValue)
    localStorage.removeItem(key)
  }
}

const read = <T>(key: StorageKey, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(key)) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

export const loadParticipants = () => read<Participant[]>('players', [])
const write = (key: StorageKey, value: unknown) => {
  localStorage.setItem(storageKey(key), JSON.stringify(value))
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
  return Number.isFinite(value) ? Math.min(99, Math.max(1, Math.floor(value))) : 1
}
export const saveDefaultWinningGames = (value: number) => write('defaultWinningGames', value)
export const loadDefaultSetPoints = () => {
  const value = read<number>('defaultSetPoints', 21)
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 21
}
export const saveDefaultSetPoints = (value: number) => write('defaultSetPoints', value)
export const loadTournamentName = () => {
  const value = read<unknown>('tournamentName', 'Tourny')
  return typeof value === 'string' && value.trim() ? value.trim() : 'Tourny'
}
export const saveTournamentName = (value: string) =>
  write('tournamentName', value.trim() || 'Tourny')
export const loadExpectedDurationMinutes = () => {
  const value = read<number>('expectedDurationMinutes', 25)
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 25
}
export const saveExpectedDurationMinutes = (value: number) =>
  write('expectedDurationMinutes', value)
export const loadBreakBetweenMatchesMinutes = () => {
  const value = read<number>('breakBetweenMatchesMinutes', 5)
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 5
}
export const saveBreakBetweenMatchesMinutes = (value: number) =>
  write('breakBetweenMatchesMinutes', value)
export const loadScheduledStart = () => {
  const value = read<unknown>('scheduledStart', '')
  return typeof value === 'string' ? value : ''
}
export const saveScheduledStart = (value: string) => write('scheduledStart', value)
export const getDefaultScheduledStart = () => {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`
}
export const loadParticipantType = (): 'players' | 'teams' =>
  localStorage.getItem(storageKey('participantType')) === 'teams' ? 'teams' : 'players'
export const saveParticipantType = (value: 'players' | 'teams') => write('participantType', value)

export const subscribeToStorage = (listener: (key: StorageKey) => void) => {
  const handleMessage = (event: MessageEvent<StorageMessage>) => {
    if (event.data?.source !== tabId) listener(event.data.key)
  }
  const handleStorage = (event: StorageEvent) => {
    if (!event.key?.startsWith(storagePrefix)) return
    const key = event.key.slice(storagePrefix.length)
    if (storageKeys.includes(key as StorageKey)) listener(key as StorageKey)
  }

  if (channel) channel.addEventListener('message', handleMessage)
  else window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage)
    else window.removeEventListener('storage', handleStorage)
  }
}
