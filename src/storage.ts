import { createEvaluationContext } from './domain/evaluation'
import { startReadyRounds } from './domain/schedule/courts'
import {
  createEmptyTournamentSnapshot,
  getDefaultScheduledStart,
  parseTournamentSnapshot,
} from './domain/snapshot'
import type { V1Participant, V1Round } from './domain/snapshot/v1'
import { createId } from './domain/ids'
import type { TournamentSnapshot } from './domain/types'

export { createEmptyTournamentSnapshot }

export type StateRevision = {
  updatedAt: number
  source: string
}

export type PersistedTournamentState = {
  storageVersion: 2
  snapshot: TournamentSnapshot
  revision: StateRevision
}

/** The library index: one entry per stored tournament, one of them active. */
export type TournamentIndex = {
  storageVersion: 2
  activeId: string
  items: Array<{ id: string; name: string; updatedAt: number }>
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
// v1 key: kept untouched as a backup after the migration (an old cached app still reads it).
const legacySnapshotStorageKey = `${storagePrefix}tournament`
const indexStorageKey = `${storagePrefix}tournaments`
const snapshotStorageKey = (id: string) => `${storagePrefix}tournament:${id}`
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

const loadLegacyParticipants = () => readLegacy<V1Participant[]>('players', [])
const loadLegacyRounds = () => readLegacy<V1Round[]>('rounds', [])
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

const createLegacySnapshot = () => {
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

const withStartedRounds = (snapshot: TournamentSnapshot): TournamentSnapshot => ({
  ...snapshot,
  rounds: startReadyRounds(
    createEvaluationContext(snapshot).rules,
    snapshot.rounds,
    snapshot.courtCount,
  ),
})

/** Accepts v2 envelopes and (for the backup key) v1 envelopes; the snapshot is migrated. */
const parseEnvelope = (value: unknown, version: 1 | 2): PersistedTournamentState | null => {
  if (!value || typeof value !== 'object') return null
  const envelope = value as Partial<PersistedTournamentState> & { storageVersion?: number }
  const snapshot = parseTournamentSnapshot(envelope.snapshot)
  const revision = envelope.revision
  if (
    envelope.storageVersion !== version ||
    !snapshot ||
    !revision ||
    !Number.isFinite(revision.updatedAt) ||
    typeof revision.source !== 'string'
  )
    return null
  return { storageVersion: 2, snapshot: withStartedRounds(snapshot), revision }
}

const readIndex = (): TournamentIndex | null => {
  const value = readJson<Partial<TournamentIndex> | null>(indexStorageKey, null)
  if (!value || value.storageVersion !== 2 || typeof value.activeId !== 'string') return null
  if (!Array.isArray(value.items)) return null
  // Drop malformed entries instead of failing later when the index is updated.
  const items = value.items.filter(
    (item): item is TournamentIndex['items'][number] =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.updatedAt === 'number',
  )
  return { storageVersion: 2, activeId: value.activeId, items }
}

/** Returns whether the index was actually written. */
const writeIndex = (index: TournamentIndex) => {
  try {
    localStorage.setItem(indexStorageKey, JSON.stringify(index))
    return true
  } catch {
    // Storage may be full or unavailable; the in-memory state keeps working.
    return false
  }
}

const upsertIndexItem = (
  index: TournamentIndex | null,
  snapshot: TournamentSnapshot,
): TournamentIndex => {
  const item = { id: snapshot.id, name: snapshot.tournamentName, updatedAt: Date.now() }
  const items = index?.items ?? []
  return {
    storageVersion: 2,
    activeId: index?.activeId ?? snapshot.id,
    items: items.some((entry) => entry.id === snapshot.id)
      ? items.map((entry) => (entry.id === snapshot.id ? item : entry))
      : [...items, item],
  }
}

const removeLegacyKeys = () => {
  for (const key of legacyStorageKeys) {
    localStorage.removeItem(`${storagePrefix}${key}`)
    if (!import.meta.env.BASE_URL.includes('/previews/')) localStorage.removeItem(key)
  }
}

/** Returns whether the snapshot itself was stored; the index is only updated after that. */
const writeEnvelope = (value: PersistedTournamentState, broadcast: boolean) => {
  try {
    localStorage.setItem(snapshotStorageKey(value.snapshot.id), JSON.stringify(value))
  } catch {
    return false
  }
  writeIndex(upsertIndexItem(readIndex(), value.snapshot))
  if (broadcast) channel?.postMessage({ tournamentId: value.snapshot.id, ...value })
  return true
}

const activate = (state: PersistedTournamentState) => {
  const index = upsertIndexItem(readIndex(), state.snapshot)
  return writeIndex({ ...index, activeId: state.snapshot.id })
}

const readStoredState = (id: string) =>
  parseEnvelope(readJson<unknown>(snapshotStorageKey(id), null), 2)

/** Small stable hash, so every tab derives the same id from the same v1 data. */
const stableId = (text: string) => {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193) >>> 0
  }
  return `m${hash.toString(36)}`
}

const createFreshState = (snapshot: TournamentSnapshot, source: string) => {
  const state: PersistedTournamentState = {
    storageVersion: 2,
    snapshot: withStartedRounds(snapshot),
    revision: { updatedAt: Date.now(), source },
  }
  // Only point the index at the tournament once its snapshot is stored; otherwise the next load
  // would find a dangling active id instead of retrying the preserved v1 backup.
  const stored = writeEnvelope(state, false)
  return { state, indexWritten: stored && activate(state) }
}

/** Rebuilds a lost or unreadable index from the per-tournament keys; the newest valid one is active. */
const rebuildIndex = (): PersistedTournamentState | null => {
  const ids: string[] = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(`${storagePrefix}tournament:`)) {
      ids.push(key.slice(`${storagePrefix}tournament:`.length))
    }
  }
  const states = ids.flatMap((id) => {
    const state = readStoredState(id)
    return state && state.snapshot.id === id ? [state] : []
  })
  if (states.length === 0) return null
  const newest = states.reduce((best, state) =>
    state.revision.updatedAt > best.revision.updatedAt ? state : best,
  )
  writeIndex({
    storageVersion: 2,
    activeId: newest.snapshot.id,
    items: states.map(({ snapshot, revision }) => ({
      id: snapshot.id,
      name: snapshot.tournamentName,
      updatedAt: revision.updatedAt,
    })),
  })
  return newest
}

const migrateFromV1 = (): PersistedTournamentState => {
  const rawV1 = localStorage.getItem(legacySnapshotStorageKey)
  const v1State =
    rawV1 === null ? null : parseEnvelope(readJson<unknown>(legacySnapshotStorageKey, null), 1)
  if (rawV1 !== null && !v1State) {
    // The key exists but cannot be read: never overwrite it, continue with a new tournament.
    console.error('The stored tournament could not be read; starting a new tournament.')
    return createFreshState(createEmptyTournamentSnapshot(), 'recovery').state
  }

  const legacy = v1State ? null : parseTournamentSnapshot(createLegacySnapshot())
  const snapshot = v1State?.snapshot ?? legacy ?? createEmptyTournamentSnapshot()
  // A stable id lets concurrent first loads in several tabs converge on one migrated tournament.
  const id =
    v1State || legacy ? stableId(rawV1 ?? JSON.stringify(createLegacySnapshot())) : snapshot.id
  const existing = readIndex() ? readStoredState(id) : (readStoredState(id) ?? rebuildIndex())
  if (existing) return existing

  const { state, indexWritten } = createFreshState({ ...snapshot, id }, 'migration')
  if (indexWritten && !v1State) removeLegacyKeys()
  return state
}

export const loadTournamentState = (isViewer = false): PersistedTournamentState => {
  if (isViewer) {
    return {
      storageVersion: 2,
      snapshot: createEmptyTournamentSnapshot(true),
      revision: { updatedAt: 0, source: '' },
    }
  }

  const index = readIndex()
  if (!index) return rebuildIndex() ?? migrateFromV1()
  const persisted = readStoredState(index.activeId)
  if (persisted) return persisted
  const rebuilt = rebuildIndex()
  if (rebuilt) return rebuilt
  if (localStorage.getItem(snapshotStorageKey(index.activeId)) !== null) {
    console.error('The stored tournament could not be read; starting a new tournament.')
  }
  return createFreshState(createEmptyTournamentSnapshot(), 'recovery').state
}

export const persistTournamentState = (
  snapshot: TournamentSnapshot,
  revision: StateRevision,
  broadcast = true,
) => {
  // A tournament deleted from the library must not be resurrected by a late write of a stale tab.
  const index = readIndex()
  if (index && !index.items.some((item) => item.id === snapshot.id)) return false
  return writeEnvelope({ storageVersion: 2, snapshot, revision }, broadcast)
}

// --- Tournament library: a local list of independent tournaments (one of them active). ---

const libraryListeners = new Set<(activeId: string) => void>()

const notifyLibraryChanged = () => {
  const activeId = readIndex()?.activeId
  if (activeId) for (const listener of [...libraryListeners]) listener(activeId)
}

export const listTournaments = (): TournamentIndex =>
  readIndex() ?? { storageVersion: 2, activeId: '', items: [] }

/** Creates an empty tournament and makes it the active one; returns its id. */
export const createTournament = (name: string) => {
  const tournamentName = name.trim() || createEmptyTournamentSnapshot().tournamentName
  const { state, indexWritten } = createFreshState(
    { ...createEmptyTournamentSnapshot(), tournamentName },
    'library',
  )
  if (!indexWritten) {
    // Never leave a snapshot behind that the library does not know about.
    localStorage.removeItem(snapshotStorageKey(state.snapshot.id))
    const index = readIndex()
    if (index) {
      // Adding the entry may have worked although activating it did not: drop the entry again.
      writeIndex({ ...index, items: index.items.filter((item) => item.id !== state.snapshot.id) })
    }
    return null
  }
  notifyLibraryChanged()
  return state.snapshot.id
}

/** Stores a snapshot as a new, inactive tournament (import); returns its id. */
export const addTournament = (snapshot: TournamentSnapshot) => {
  const state: PersistedTournamentState = {
    storageVersion: 2,
    snapshot: withStartedRounds({ ...snapshot, id: createId() }),
    revision: { updatedAt: Date.now(), source: tabId },
  }
  const id = state.snapshot.id
  const stored = writeEnvelope(state, false)
  // The import only counts once the index entry is persisted too; otherwise remove the orphan.
  if (!stored || !readIndex()?.items.some((item) => item.id === id)) {
    localStorage.removeItem(snapshotStorageKey(id))
    return null
  }
  notifyLibraryChanged()
  return id
}

/** Makes a stored tournament the active one in every tab. */
export const switchTournament = (id: string) => {
  const index = readIndex()
  if (!index || !index.items.some((item) => item.id === id) || !readStoredState(id)) return false
  if (index.activeId !== id && !writeIndex({ ...index, activeId: id })) return false
  notifyLibraryChanged()
  return true
}

/** Renames a stored tournament. The active tournament is renamed through the store instead. */
export const renameTournament = (id: string, name: string) => {
  const tournamentName = name.trim()
  const stored = readStoredState(id)
  if (!tournamentName || !stored) return false
  const renamed = writeEnvelope(
    {
      ...stored,
      snapshot: { ...stored.snapshot, tournamentName },
      revision: createNextRevision(stored.revision),
    },
    true,
  )
  if (renamed) notifyLibraryChanged()
  return renamed
}

/** Deletes a tournament; deleting the active one activates another or a new empty tournament. */
export const deleteTournament = (id: string) => {
  const index = readIndex()
  if (!index || !index.items.some((item) => item.id === id)) return false
  const items = index.items.filter((item) => item.id !== id)
  const next = [...items].sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const activeId = index.activeId === id ? (next?.id ?? '') : index.activeId
  if (!writeIndex({ storageVersion: 2, activeId, items })) return false
  localStorage.removeItem(snapshotStorageKey(id))
  if (!activeId) createFreshState(createEmptyTournamentSnapshot(), 'library')
  notifyLibraryChanged()
  return true
}

export const getStoredSnapshot = (id: string) => readStoredState(id)?.snapshot ?? null

/** Notifies with the active id after every library change, in this and in other tabs. */
export const subscribeToLibrary = (listener: (activeId: string) => void) => {
  libraryListeners.add(listener)
  const handleStorage = (event: StorageEvent) => {
    // Another tab changed the index: only this subscriber needs to hear about it.
    if (event.key !== indexStorageKey) return
    const activeId = readIndex()?.activeId
    if (activeId) listener(activeId)
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', handleStorage)
  return () => {
    libraryListeners.delete(listener)
    if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorage)
  }
}

export const createNextRevision = (previous: StateRevision): StateRevision => ({
  updatedAt: Math.max(Date.now(), previous.updatedAt + 1),
  source: tabId,
})

export const isNewerRevision = (candidate: StateRevision, current: StateRevision) =>
  candidate.updatedAt > current.updatedAt ||
  (candidate.updatedAt === current.updatedAt && candidate.source > current.source)

/** Notifies about changes of one stored tournament; other tournaments are ignored. */
export const subscribeToTournamentState = (
  tournamentId: string,
  listener: (state: PersistedTournamentState) => void,
) => {
  const handleMessage = (event: MessageEvent<unknown>) => {
    const data = event.data as { tournamentId?: string } | null
    if (data?.tournamentId !== tournamentId) return
    const state = parseEnvelope(event.data, 2)
    if (state && state.revision.source !== tabId) listener(state)
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== snapshotStorageKey(tournamentId) || !event.newValue) return
    try {
      const state = parseEnvelope(JSON.parse(event.newValue), 2)
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
