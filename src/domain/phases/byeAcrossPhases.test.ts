import { describe, expect, it } from 'vitest'
import { createTournamentStore } from '../../store'
import { selectRankingStats } from '../../tournamentSelectors'
import { startNextPhase } from '../../tournamentCommands'
import { twoPhaseSnapshot, STARTED_AT } from '../../test/phases'
import { getPhaseScope } from './scope'
import { calculateStandings } from '../standings/standings'
import { createEmptyTournamentSnapshot } from '../snapshot'
import type { Round, TournamentSnapshot } from '../types'

const match = (id: string, a: string, b: string, x: number, y: number) => ({
  id,
  a,
  b,
  scoreA: '',
  scoreB: '',
  sets: [{ a: String(x), b: String(y) }],
})

// Five players: p5 has a bye in the only round of phase 1; p1 and p3 win their matches.
const withBye = (): TournamentSnapshot => {
  const base = twoPhaseSnapshot()
  const round: Round = {
    number: 1,
    phaseId: base.phases[0].id,
    format: { winningGames: 1 },
    startedAt: STARTED_AT,
    bye: 'p5',
    matches: [match('m1', 'p1', 'p2', 21, 10), match('m2', 'p3', 'p4', 21, 12)],
  }
  return {
    ...base,
    players: [...base.players, { id: 'p5', name: 'Player E' }],
    phases: [base.phases[0], { ...base.phases[1], entry: { kind: 'topN', count: 3 } }],
    rounds: [round],
  }
}

describe('a bye in the last round of a phase', () => {
  it('is not counted before the next phase starts', () => {
    const snapshot = withBye()
    const { entrants, rounds, ctx } = getPhaseScope(snapshot, 'phase-1')
    expect(calculateStandings(entrants, rounds, ctx).find((p) => p.id === 'p5')?.wins).toBe(0)
  })

  it('counts for the transition and in the standings once the next phase started', () => {
    const store = createTournamentStore(withBye())
    store.dispatch(startNextPhase())
    const state = store.getState().tournament
    // p1, p3 and the bye winner p5 have one win each; the top 3 enter phase 2.
    expect(state.phases[1].entrants).toHaveLength(3)
    expect(state.phases[1].entrants).toEqual(expect.arrayContaining(['p1', 'p3', 'p5']))
    const first = selectRankingStats(store.getState(), 'phase-1')
    expect(first.find((player) => player.id === 'p5')?.wins).toBe(1)
  })
})

describe('single phase behaviour', () => {
  it('still credits the last bye only when a later round started', () => {
    const base = createEmptyTournamentSnapshot()
    const snapshot = { ...withBye(), phases: [base.phases[0]] }
    const { entrants, rounds, ctx } = getPhaseScope(snapshot, snapshot.phases[0].id)
    expect(ctx.countedByeRound).toBeUndefined()
    expect(calculateStandings(entrants, rounds, ctx).find((p) => p.id === 'p5')?.wins).toBe(0)
  })
})
