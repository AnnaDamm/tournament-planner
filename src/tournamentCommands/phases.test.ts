import { describe, expect, it } from 'vitest'
import { getMatchFormat } from '../domain/format'
import { createTournamentStore } from '../store'
import { twoPhaseSnapshot } from '../test/phases'
import {
  selectSortedParticipants,
  selectStandingsBeforeRounds,
  selectParticipantOrderByRound,
} from '../tournamentSelectors'
import {
  createRound,
  saveTournamentSettings,
  setMatchFormat,
  setRoundFormat,
  startNextPhase,
} from '.'

describe('startNextPhase command', () => {
  it('starts the next phase with the top N and lets the phase create rounds', () => {
    const store = createTournamentStore(twoPhaseSnapshot())
    store.dispatch(startNextPhase())
    const { phases, rounds } = store.getState().tournament
    expect(phases[1].entrants).toHaveLength(2)
    expect(phases[1].entrants).toEqual(expect.arrayContaining(['p1', 'p3']))
    expect(phases[1].startedAt).toBeTruthy()
    expect(rounds).toHaveLength(1)

    store.dispatch(createRound())
    const created = store.getState().tournament.rounds
    expect(created.map((round) => [round.number, round.phaseId])).toEqual([
      [1, 'phase-1'],
      [2, 'phase-2'],
    ])
  })

  it('does nothing while the phase is not complete or already started', () => {
    const snapshot = twoPhaseSnapshot()
    const unfinished = {
      ...snapshot,
      rounds: [
        { ...snapshot.rounds[0], matches: [{ ...snapshot.rounds[0].matches[0], sets: [] }] },
      ],
    }
    const store = createTournamentStore(unfinished)
    store.dispatch(startNextPhase())
    expect(store.getState().tournament).toBe(unfinished)
    const done = createTournamentStore(snapshot)
    done.dispatch(startNextPhase())
    const once = done.getState().tournament
    done.dispatch(startNextPhase())
    expect(done.getState().tournament).toBe(once)
  })
})

describe('phase-scoped selectors', () => {
  it('ranks each phase with its own entrants and rounds', () => {
    const store = createTournamentStore(twoPhaseSnapshot())
    expect(selectSortedParticipants(store.getState(), 'phase-1', 'position', true)).toHaveLength(4)
    expect(selectSortedParticipants(store.getState(), 'phase-2', 'position', true)).toEqual([])
    store.dispatch(startNextPhase())
    const second = selectSortedParticipants(store.getState(), 'phase-2', 'position', true)
    expect(second.map((player) => player.id).sort()).toEqual(['p1', 'p3'])
    expect(second.every((player) => player.wins === 0 && player.played === 0)).toBe(true)
    const first = selectSortedParticipants(store.getState(), 'phase-1', 'position', true)
    expect(first.map((player) => player.id).slice(0, 2)).toEqual(['p1', 'p3'])
  })

  it('keeps one entry per round in the flat round order', () => {
    const store = createTournamentStore(twoPhaseSnapshot())
    store.dispatch(startNextPhase())
    store.dispatch(createRound())
    const state = store.getState()
    expect(selectStandingsBeforeRounds(state)).toHaveLength(2)
    expect(selectParticipantOrderByRound(state)[1].sort()).toEqual(['p1', 'p3'])
  })
})

describe('rounds of an unknown phase', () => {
  it('are evaluated like the first phase instead of being undefined', () => {
    const snapshot = twoPhaseSnapshot()
    const orphan = { ...snapshot, rounds: [{ ...snapshot.rounds[0], phaseId: 'gone' }] }
    const store = createTournamentStore(orphan)
    const [before] = selectStandingsBeforeRounds(store.getState())
    expect(before).toBeDefined()
    expect(selectParticipantOrderByRound(store.getState())[0]).toBeDefined()
  })
})

describe('match formats', () => {
  it('prefers the match override over the round format', () => {
    const [round] = twoPhaseSnapshot().rounds
    const withFormat = { ...round, format: { winningGames: 2, gamePoints: 21 } }
    expect(getMatchFormat(withFormat)).toEqual({ winningGames: 2, gamePoints: 21 })
    expect(
      getMatchFormat(withFormat, { ...round.matches[0], format: { winningGames: 3 } }),
    ).toEqual({ winningGames: 3, gamePoints: 21 })
  })

  it('stores only the differences to the round format and clears them again', () => {
    const snapshot = twoPhaseSnapshot()
    const open = {
      ...snapshot,
      rounds: [
        {
          ...snapshot.rounds[0],
          format: { winningGames: 2 },
          matches: snapshot.rounds[0].matches.map((match) => ({ ...match, sets: [] })),
        },
      ],
    }
    const store = createTournamentStore(open)
    const matchFormat = () => store.getState().tournament.rounds[0].matches[0].format
    store.dispatch(setMatchFormat(1, 'm1', { winningGames: 3 }))
    expect(matchFormat()).toEqual({ winningGames: 3 })
    store.dispatch(setMatchFormat(1, 'm1', { winningGames: 2 }))
    expect(matchFormat()).toBeUndefined()
    store.dispatch(setMatchFormat(1, 'm1', { winningGames: 3 }))
    store.dispatch(setMatchFormat(1, 'm1', undefined))
    expect(matchFormat()).toBeUndefined()
    expect(store.getState().tournament.rounds[0].matches[1].format).toBeUndefined()
  })

  it('does not change the format of a match that has a score', () => {
    const store = createTournamentStore(twoPhaseSnapshot())
    store.dispatch(setMatchFormat(1, 'm1', { winningGames: 3 }))
    expect(store.getState().tournament.rounds[0].matches[0].format).toBeUndefined()
  })

  it('sets the round format together with the court count', () => {
    const store = createTournamentStore(twoPhaseSnapshot())
    store.dispatch(setRoundFormat(1, { winningGames: 3, gamePoints: 25 }, 2))
    const [round] = store.getState().tournament.rounds
    expect(round.format).toEqual({ winningGames: 3, gamePoints: 25 })
    expect(round.courtCount).toBe(2)
  })
})

describe('saveTournamentSettings', () => {
  it('keeps the stored entrants and start time of started phases', () => {
    const store = createTournamentStore(twoPhaseSnapshot())
    store.dispatch(startNextPhase())
    const state = store.getState().tournament
    const edited = {
      ...state,
      phases: state.phases.map((phase) => ({ ...phase, name: 'Edited', entrants: undefined })),
    }
    store.dispatch(saveTournamentSettings(edited))
    const { phases } = store.getState().tournament
    expect(phases[1].entrants).toEqual(state.phases[1].entrants)
    expect(phases[1].startedAt).toBe(state.phases[1].startedAt)
    expect(phases[1].name).toBe('Final Swiss')
  })
})
