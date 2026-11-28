import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { stubLocalStorage } from './test/localStorageStub'
import { createEmptyTournamentSnapshot } from './domain/snapshot'
import {
  addTournament,
  createNextRevision,
  createTournament,
  deleteTournament,
  getStoredSnapshot,
  listTournaments,
  loadTournamentState,
  persistTournamentState,
  renameTournament,
  subscribeToLibrary,
  switchTournament,
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
    const second = {
      ...createEmptyTournamentSnapshot(),
      id: addTournament(createEmptyTournamentSnapshot())!,
    }
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

  it('does not activate a migrated tournament whose snapshot could not be stored', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const original = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key: string, value: string) => {
      if (key.startsWith(`${prefix}tournament:`)) throw new Error('quota')
      original(key, value)
    }
    const first = loadTournamentState()
    expect(first.snapshot.tournamentName).toBe('Small Cup')
    expect(data.has(`${prefix}tournaments`)).toBe(false)

    localStorage.setItem = original
    const second = loadTournamentState()
    expect(second.snapshot.tournamentName).toBe('Small Cup')
    expect(data.has(`${prefix}tournament:${second.snapshot.id}`)).toBe(true)
    expect(JSON.parse(data.get(`${prefix}tournaments`)!).activeId).toBe(second.snapshot.id)
  })

  it('keeps the legacy per-field keys when the snapshot could not be stored and migrates them later', () => {
    const data = stubLocalStorage({
      [`${prefix}players`]: JSON.stringify([
        { id: 'p1', name: 'Legacy Anna', wins: 0, losses: 0, scored: 0, conceded: 0 },
      ]),
    })
    const original = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key: string, value: string) => {
      if (key.startsWith(`${prefix}tournament:`)) throw new Error('quota')
      original(key, value)
    }
    loadTournamentState()
    expect(data.has(`${prefix}players`)).toBe(true)
    expect(data.has(`${prefix}tournaments`)).toBe(false)

    localStorage.setItem = original
    const second = loadTournamentState()
    expect(second.snapshot.players.map((player) => player.name)).toEqual(['Legacy Anna'])
    expect(data.has(`${prefix}tournament:${second.snapshot.id}`)).toBe(true)
  })

  it('ignores malformed index entries instead of throwing on the next save', () => {
    const data = stubLocalStorage({ [`${prefix}tournament`]: v1Envelope() })
    const state = loadTournamentState()
    const index = JSON.parse(data.get(`${prefix}tournaments`)!)
    data.set(
      `${prefix}tournaments`,
      JSON.stringify({ ...index, items: [null, 42, { id: 1 }, ...index.items] }),
    )
    expect(() =>
      persistTournamentState(state.snapshot, createNextRevision(state.revision), false),
    ).not.toThrow()
    const repaired = JSON.parse(data.get(`${prefix}tournaments`)!)
    expect(repaired.items.map((item: { id: string }) => item.id)).toEqual([state.snapshot.id])
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

describe('tournament library', () => {
  const key = (id: string) => prefix + 'tournament:' + id
  const index = (data: Map<string, string>) => JSON.parse(data.get(prefix + 'tournaments')!)

  it('creates tournaments, makes the new one active and stores it under its own key', () => {
    const data = stubLocalStorage()
    const first = loadTournamentState().snapshot.id
    const id = createTournament('  Cup A ')!
    expect(id).not.toBe(first)
    expect(index(data).activeId).toBe(id)
    expect(listTournaments().items.map((item) => item.name)).toEqual(['Tourny', 'Cup A'])
    expect(data.has(key(id))).toBe(true)
    expect(loadTournamentState().snapshot.tournamentName).toBe('Cup A')
  })

  it('switches between tournaments and keeps their content apart', () => {
    stubLocalStorage()
    const a = loadTournamentState()
    persistTournamentState(
      { ...a.snapshot, players: [{ id: 'p1', name: 'Ann' }] },
      createNextRevision(a.revision),
    )
    const b = createTournament('B')!
    expect(loadTournamentState().snapshot.players).toEqual([])
    expect(switchTournament(a.snapshot.id)).toBe(true)
    expect(loadTournamentState().snapshot.players).toHaveLength(1)
    expect(switchTournament('missing')).toBe(false)
    expect(listTournaments().activeId).toBe(a.snapshot.id)
    expect(getStoredSnapshot(b)?.tournamentName).toBe('B')
  })

  it('renames a stored tournament in the snapshot and the index', () => {
    stubLocalStorage()
    loadTournamentState()
    const id = createTournament('B')!
    expect(renameTournament(id, ' Renamed ')).toBe(true)
    expect(getStoredSnapshot(id)?.tournamentName).toBe('Renamed')
    expect(listTournaments().items.find((item) => item.id === id)?.name).toBe('Renamed')
    expect(renameTournament(id, '   ')).toBe(false)
  })

  it('deletes an inactive tournament and removes its key', () => {
    const data = stubLocalStorage()
    const a = loadTournamentState().snapshot.id
    const b = createTournament('B')!
    switchTournament(a)
    expect(deleteTournament(b)).toBe(true)
    expect(data.has(key(b))).toBe(false)
    expect(listTournaments().activeId).toBe(a)
    expect(listTournaments().items).toHaveLength(1)
  })

  it('falls back to another tournament when the active one is deleted', () => {
    const data = stubLocalStorage()
    const a = loadTournamentState().snapshot.id
    const b = createTournament('B')!
    expect(deleteTournament(b)).toBe(true)
    expect(listTournaments().activeId).toBe(a)
    expect(data.has(key(b))).toBe(false)
  })

  it('creates a new empty tournament when the last one is deleted', () => {
    const data = stubLocalStorage()
    const a = loadTournamentState().snapshot.id
    expect(deleteTournament(a)).toBe(true)
    const { activeId, items } = listTournaments()
    expect(items).toHaveLength(1)
    expect(activeId).not.toBe(a)
    expect(items[0].id).toBe(activeId)
    expect(data.has(key(a))).toBe(false)
    expect(loadTournamentState().snapshot.players).toEqual([])
  })

  it('does not resurrect a deleted tournament through a late write of a stale tab', () => {
    const data = stubLocalStorage()
    const a = loadTournamentState()
    createTournament('B')
    deleteTournament(a.snapshot.id)
    expect(persistTournamentState(a.snapshot, createNextRevision(a.revision))).toBe(false)
    expect(data.has(key(a.snapshot.id))).toBe(false)
    expect(listTournaments().items.some((item) => item.id === a.snapshot.id)).toBe(false)
  })

  it('imports a snapshot as a new inactive tournament', () => {
    stubLocalStorage()
    const a = loadTournamentState()
    const id = addTournament({ ...a.snapshot, tournamentName: 'Imported' })!
    expect(id).not.toBe(a.snapshot.id)
    expect(listTournaments().activeId).toBe(a.snapshot.id)
    expect(getStoredSnapshot(id)?.tournamentName).toBe('Imported')
  })

  it('notifies library subscribers with the active id', () => {
    stubLocalStorage()
    const a = loadTournamentState().snapshot.id
    const seen: string[] = []
    const stop = subscribeToLibrary((activeId) => seen.push(activeId))
    const b = createTournament('B')!
    switchTournament(a)
    stop()
    switchTournament(b)
    expect(seen).toEqual([b, a])
  })

  it('does not keep an imported snapshot whose index entry could not be stored', () => {
    const data = stubLocalStorage()
    const a = loadTournamentState()
    const setItem = localStorage.setItem
    vi.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
      if (key === prefix + 'tournaments') throw new Error('quota')
      setItem.call(localStorage, key, value)
    })
    expect(addTournament({ ...a.snapshot, tournamentName: 'Imported' })).toBeNull()
    expect(createTournament('B')).toBeNull()
    expect([...data.keys()].filter((key) => key.startsWith(prefix + 'tournament:'))).toEqual([
      prefix + 'tournament:' + a.snapshot.id,
    ])
  })
})
