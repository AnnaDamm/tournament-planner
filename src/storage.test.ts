import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { stubLocalStorage } from './test/localStorageStub'
import {
  createNextRevision,
  loadTournamentState,
  persistTournamentState,
  subscribeToTournamentState,
} from './storage'

const prefix = `${import.meta.env.BASE_URL}:`
const v1Text = readFileSync(
  new URL('./test/fixtures/v1-small-finished.json', import.meta.url),
  'utf8',
)
const v1Envelope = () =>
  JSON.stringify({
    storageVersion: 1,
    snapshot: JSON.parse(v1Text),
    revision: { updatedAt: 5, source: 'old' },
  })

afterEach(() => vi.unstubAllGlobals())

describe('storage migration', () => {
  it('migrates the v1 envelope, writes index and per-id key and keeps the v1 key', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const state = loadTournamentState()
    expect(state.storageVersion).toBe(2)
    expect(state.snapshot.version).toBe(2)
    expect(state.snapshot.tournamentName).toBe('Small Cup')
    const index = JSON.parse(data.get(`${prefix}tournaments`)!)
    expect(index.activeId).toBe(state.snapshot.id)
    expect(index.items).toHaveLength(1)
    expect(data.has(`${prefix}tournament:${state.snapshot.id}`)).toBe(true)
    expect(data.get(`${prefix}tournament`)).toBe(v1Envelope())
  })

  it('loads the active tournament from the index on later starts', () => {
    stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const first = loadTournamentState()
    const again = loadTournamentState()
    expect(again.snapshot.id).toBe(first.snapshot.id)
    expect(again.snapshot.players).toEqual(first.snapshot.players)
  })

  it('creates an empty tournament when nothing is stored', () => {
    const data = stubLocalStorage()
    const state = loadTournamentState()
    expect(state.snapshot.players).toEqual([])
    expect(data.has(`${prefix}tournaments`)).toBe(true)
  })

  it('never overwrites an unreadable v1 key', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: '{broken' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = loadTournamentState()
    expect(state.snapshot.players).toEqual([])
    expect(data.get(`${prefix}tournament`)).toBe('{broken')
  })

  it('does not replace an unreadable active tournament but starts a new one', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const first = loadTournamentState()
    const key = `${prefix}tournament:${first.snapshot.id}`
    data.set(key, 'garbage')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const next = loadTournamentState()
    expect(next.snapshot.id).not.toBe(first.snapshot.id)
    expect(data.get(key)).toBe('garbage')
  })

  it('persists snapshots and keeps the index in sync', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const state = loadTournamentState()
    persistTournamentState(
      { ...state.snapshot, tournamentName: 'Renamed' },
      createNextRevision(state.revision),
      false,
    )
    const index = JSON.parse(data.get(`${prefix}tournaments`)!)
    expect(index.items[0].name).toBe('Renamed')
  })

  it('ignores storage events of other tournaments', () => {
    stubLocalStorage()
    const listeners: Array<(event: StorageEvent) => void> = []
    vi.stubGlobal('window', {
      addEventListener: (_type: string, listener: (event: StorageEvent) => void) =>
        listeners.push(listener),
      removeEventListener: () => {},
    })
    const state = loadTournamentState()
    const received: string[] = []
    const stop = subscribeToTournamentState(state.snapshot.id, (incoming) =>
      received.push(incoming.snapshot.id),
    )
    const value = JSON.stringify({ ...state, revision: { updatedAt: 99, source: 'other' } })
    if (listeners.length === 0) {
      stop()
      return // BroadcastChannel is available: the storage fallback is not used
    }
    listeners.forEach((listener) => {
      listener({ key: `${prefix}tournament:other`, newValue: value } as StorageEvent)
      listener({ key: `${prefix}tournament:${state.snapshot.id}`, newValue: value } as StorageEvent)
    })
    expect(received).toEqual([state.snapshot.id])
    stop()
  })
})
