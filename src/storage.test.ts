import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { stubLocalStorage } from './test/localStorageStub'
import { createEmptyTournamentSnapshot } from './domain/snapshot'
import { createNextRevision, loadTournamentState, persistTournamentState } from './storage'

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

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

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

  it('rebuilds a missing index from the per-tournament keys, newest tournament active', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const first = loadTournamentState()
    const second = createEmptyTournamentSnapshot()
    persistTournamentState(
      { ...second, tournamentName: 'Newer' },
      { updatedAt: first.revision.updatedAt + 1000, source: 'x' },
      false,
    )
    data.delete(`${prefix}tournaments`)
    const loaded = loadTournamentState()
    expect(loaded.snapshot.id).toBe(second.id)
    const index = JSON.parse(data.get(`${prefix}tournaments`)!)
    expect(index.activeId).toBe(second.id)
    expect(index.items.map((item: { id: string }) => item.id).sort()).toEqual(
      [first.snapshot.id, second.id].sort(),
    )
  })

  it('rebuilds an unreadable index instead of migrating the v1 backup again', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const first = loadTournamentState()
    data.set(`${prefix}tournaments`, '{broken')
    const loaded = loadTournamentState()
    expect(loaded.snapshot.id).toBe(first.snapshot.id)
    expect([...data.keys()].filter((key) => key.startsWith(`${prefix}tournament:`))).toHaveLength(1)
  })

  it('derives a stable id so concurrent first loads converge', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const first = loadTournamentState()
    data.delete(`${prefix}tournaments`)
    data.delete(`${prefix}tournament:${first.snapshot.id}`)
    const second = loadTournamentState()
    expect(second.snapshot.id).toBe(first.snapshot.id)
  })

  it('keeps the legacy per-field keys when the index could not be written', () => {
    const data = stubLocalStorage({ [`${prefix}players`]: JSON.stringify([]) })
    const original = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key: string, value: string) => {
      if (key === `${prefix}tournaments`) throw new Error('quota')
      original(key, value)
    }
    loadTournamentState()
    expect(data.has(`${prefix}players`)).toBe(true)
  })
})

type Listener = (event: unknown) => void

const envelopeFor = (id: string, source = 'other') => {
  const snapshot = { ...createEmptyTournamentSnapshot(), id }
  return { storageVersion: 2, snapshot, revision: { updatedAt: 99, source } }
}

describe('tab synchronisation', () => {
  it('uses BroadcastChannel messages and ignores other tournaments', async () => {
    stubLocalStorage()
    const listeners: Listener[] = []
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        addEventListener(_type: string, listener: Listener) {
          listeners.push(listener)
        }
        removeEventListener() {}
        postMessage() {}
      },
    )
    vi.resetModules()
    const storage = await import('./storage')
    const received: string[] = []
    const stop = storage.subscribeToTournamentState('mine', (state) =>
      received.push(state.snapshot.id),
    )
    expect(listeners).toHaveLength(1)
    listeners[0]({ data: { tournamentId: 'other', ...envelopeFor('other') } })
    listeners[0]({ data: { tournamentId: 'mine', ...envelopeFor('mine') } })
    expect(received).toEqual(['mine'])
    stop()
  })

  it('falls back to storage events without BroadcastChannel', async () => {
    stubLocalStorage()
    const listeners: Listener[] = []
    vi.stubGlobal('BroadcastChannel', undefined)
    vi.stubGlobal('window', {
      addEventListener: (_type: string, listener: Listener) => listeners.push(listener),
      removeEventListener: () => {},
    })
    vi.resetModules()
    const storage = await import('./storage')
    const received: string[] = []
    const stop = storage.subscribeToTournamentState('mine', (state) =>
      received.push(state.snapshot.id),
    )
    expect(listeners).toHaveLength(1)
    const event = (id: string) => ({
      key: `${prefix}tournament:${id}`,
      newValue: JSON.stringify(envelopeFor(id)),
    })
    listeners[0](event('other'))
    listeners[0](event('mine'))
    expect(received).toEqual(['mine'])
    stop()
  })
})
