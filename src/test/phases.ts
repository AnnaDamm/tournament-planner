import { createDefaultSettingsParts } from '../domain/defaults'
import { createEmptyTournamentSnapshot } from '../domain/snapshot'
import type { Phase, Round, TournamentSnapshot } from '../domain/types'
import { makePlayers } from './fixtures'

export const STARTED_AT = '2026-01-01T10:00:00.000Z'

/** A finished first round of four players: p1 and p3 win (21:10 and 21:12). */
export const finishedRound = (phaseId: string): Round => ({
  number: 1,
  phaseId,
  format: { winningGames: 1 },
  startedAt: STARTED_AT,
  matches: [
    { id: 'm1', a: 'p1', b: 'p2', scoreA: '', scoreB: '', sets: [{ a: '21', b: '10' }] },
    { id: 'm2', a: 'p3', b: 'p4', scoreA: '', scoreB: '', sets: [{ a: '21', b: '12' }] },
  ],
})

/** Four players, two Swiss phases (the second takes the best two) and one finished round. */
export const twoPhaseSnapshot = (): TournamentSnapshot => {
  const base = createEmptyTournamentSnapshot()
  const second: Phase = {
    ...createDefaultSettingsParts().phases[0],
    id: 'phase-2',
    name: 'Final Swiss',
    entry: { kind: 'topN', count: 2 },
  }
  return {
    ...base,
    players: makePlayers(4).map(({ id, name }) => ({ id, name })),
    phases: [base.phases[0], second],
    rounds: [finishedRound(base.phases[0].id)],
  }
}
