import type { Participant, Round, TournamentSnapshot } from './tournamentTypes'
import { parseTournamentSnapshot } from './tournamentSnapshot'
import { startReadyRounds } from './tournament'

export type StateRevision = {
  updatedAt: number
  source: string
}

export type PersistedTournamentState = {
  storageVersion: 1
  snapshot: TournamentSnapshot
  revision: StateRevision
}

const legacyStorageKeys = [
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
] as const

const tabId = Math.random().toString(36).slice(2)
const storagePrefix = `${import.meta.env.BASE_URL}:`
const snapshotStorageKey = `${storagePrefix}tournament`
const channel =
  typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(`tourny-storage:${import.meta.env.BASE_URL}`)
    : null

const readJson = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

const readLegacy = <T>(key: (typeof legacyStorageKeys)[number], fallback: T): T => {
  const prefixedKey = `${storagePrefix}${key}`
  const prefixedValue = localStorage.getItem(prefixedKey)
  if (prefixedValue !== null) return readJson(prefixedKey, fallback)

  if (import.meta.env.BASE_URL.includes('/previews/')) return fallback
  const legacyValue = localStorage.getItem(key)
  if (legacyValue === null) return fallback

  if (localStorage.getItem(prefixedKey) === null) localStorage.setItem(prefixedKey, legacyValue)
  localStorage.removeItem(key)
  return readJson(prefixedKey, fallback)
}

const loadLegacyParticipants = () => readLegacy<Participant[]>('players', [])
const loadLegacyRounds = () => readLegacy<Round[]>('rounds', [])
const loadLegacyCourtCount = () => {
  const value = readLegacy<number>('courtCount', 1)
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}
const loadLegacyWinningGames = () => {
  const value = readLegacy<number>('defaultWinningGames', 1)
  return Number.isFinite(value) ? Math.min(99, Math.max(1, Math.floor(value))) : 1
}
const loadLegacySetPoints = () => {
  const value = readLegacy<number>('defaultSetPoints', 21)
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 21
}
const loadLegacyTournamentName = () => {
  const value = readLegacy<unknown>('tournamentName', 'Tourny')
  return typeof value === 'string' && value.trim() ? value.trim() : 'Tourny'
}
const loadLegacyParticipantType = (): 'players' | 'teams' =>
  readLegacy<unknown>('participantType', 'players') === 'teams' ? 'teams' : 'players'
const loadLegacyExpectedDuration = () => {
  const value = readLegacy<number>('expectedDurationMinutes', 25)
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 25
}
const loadLegacyBreak = () => {
  const value = readLegacy<number>('breakBetweenMatchesMinutes', 5)
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 5
}
const loadLegacyScheduledStart = () => {
  const value = readLegacy<unknown>('scheduledStart', '')
  return typeof value === 'string' ? value : ''
}

const getDefaultScheduledStart = () => {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`
}

const createLegacySnapshot = (): TournamentSnapshot => {
  const rounds = loadLegacyRounds()
  const scheduledStart = loadLegacyScheduledStart()
  return {
    version: 1,
    tournamentName: loadLegacyTournamentName(),
    players: loadLegacyParticipants(),
    rounds,
    participantType: loadLegacyParticipantType(),
    courtCount: loadLegacyCourtCount(),
    defaultWinningGames: loadLegacyWinningGames(),
    defaultSetPoints: loadLegacySetPoints(),
    expectedDurationMinutes: loadLegacyExpectedDuration(),
    breakBetweenMatchesMinutes: loadLegacyBreak(),
    scheduledStart:
      scheduledStart || rounds.some((round) => round.startedAt)
        ? scheduledStart
        : getDefaultScheduledStart(),
  }
}

export const createEmptyTournamentSnapshot = (isViewer = false): TournamentSnapshot => ({
  version: 1,
  tournamentName: 'Tourny',
  players: [],
  rounds: [],
  participantType: 'players',
  courtCount: 1,
  defaultWinningGames: 1,
  defaultSetPoints: 21,
  expectedDurationMinutes: 25,
  breakBetweenMatchesMinutes: 5,
  scheduledStart: isViewer ? '' : getDefaultScheduledStart(),
})

const parseEnvelope = (value: unknown): PersistedTournamentState | null => {
  if (!value || typeof value !== 'object') return null
  const envelope = value as Partial<PersistedTournamentState>
  const snapshot = parseTournamentSnapshot(envelope.snapshot)
  const revision = envelope.revision
  if (
    envelope.storageVersion !== 1 ||
    !snapshot ||
    !revision ||
    !Number.isFinite(revision.updatedAt) ||
    typeof revision.source !== 'string'
  )
    return null
  return {
    storageVersion: 1,
    snapshot: { ...snapshot, rounds: startReadyRounds(snapshot.rounds, snapshot.courtCount) },
    revision,
  }
}

const readPersistedState = (): PersistedTournamentState | null =>
  parseEnvelope(readJson<unknown>(snapshotStorageKey, null))

const removeLegacyKeys = () => {
  for (const key of legacyStorageKeys) {
    localStorage.removeItem(`${storagePrefix}${key}`)
    if (!import.meta.env.BASE_URL.includes('/previews/')) localStorage.removeItem(key)
  }
}

const writeEnvelope = (value: PersistedTournamentState, broadcast: boolean) => {
  try {
    localStorage.setItem(snapshotStorageKey, JSON.stringify(value))
  } catch {
    return
  }
  if (broadcast) channel?.postMessage(value)
}

export const loadTournamentState = (isViewer = false): PersistedTournamentState => {
  if (isViewer) {
    return {
      storageVersion: 1,
      snapshot: createEmptyTournamentSnapshot(true),
      revision: { updatedAt: 0, source: '' },
    }
  }

  const persisted = readPersistedState()
  if (persisted) return persisted

  const parsedLegacy = parseTournamentSnapshot(createLegacySnapshot())
  const migrated = {
    storageVersion: 1 as const,
    snapshot: parsedLegacy
      ? { ...parsedLegacy, rounds: startReadyRounds(parsedLegacy.rounds, parsedLegacy.courtCount) }
      : createEmptyTournamentSnapshot(),
    revision: { updatedAt: Date.now(), source: 'migration' },
  }
  writeEnvelope(migrated, false)
  removeLegacyKeys()
  return migrated
}

export const persistTournamentState = (
  snapshot: TournamentSnapshot,
  revision: StateRevision,
  broadcast = true,
) => writeEnvelope({ storageVersion: 1, snapshot, revision }, broadcast)

export const createNextRevision = (previous: StateRevision): StateRevision => ({
  updatedAt: Math.max(Date.now(), previous.updatedAt + 1),
  source: tabId,
})

export const isNewerRevision = (candidate: StateRevision, current: StateRevision) =>
  candidate.updatedAt > current.updatedAt ||
  (candidate.updatedAt === current.updatedAt && candidate.source > current.source)

export const subscribeToTournamentState = (listener: (state: PersistedTournamentState) => void) => {
  const handleMessage = (event: MessageEvent<unknown>) => {
    const state = parseEnvelope(event.data)
    if (state && state.revision.source !== tabId) listener(state)
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== snapshotStorageKey || !event.newValue) return
    try {
      const state = parseEnvelope(JSON.parse(event.newValue))
      if (state) listener(state)
    } catch {
      // Invalid external storage values are ignored.
    }
  }

  if (channel) channel.addEventListener('message', handleMessage)
  else window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage)
    else window.removeEventListener('storage', handleStorage)
  }
}
