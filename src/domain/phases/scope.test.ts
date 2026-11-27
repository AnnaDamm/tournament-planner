import { describe, expect, it } from 'vitest'
import { twoPhaseSnapshot } from '../../test/phases'
import { getStartablePhase } from './phaseState'
import { getPhaseEntrants, getPhaseScope, isPhaseLocked, mergePhasesOnSave } from './scope'

describe('phase scope', () => {
  it('covers everybody in the first phase and the frozen entrants afterwards', () => {
    const snapshot = twoPhaseSnapshot()
    expect(getPhaseEntrants(snapshot, 'phase-1')).toBe(snapshot.players)
    expect(getPhaseEntrants(snapshot, 'phase-2')).toEqual([])
    const started = {
      ...snapshot,
      phases: [snapshot.phases[0], { ...snapshot.phases[1], entrants: ['p3', 'p1'] }],
    }
    expect(getPhaseEntrants(started, 'phase-2').map((player) => player.id)).toEqual(['p3', 'p1'])
    expect(getPhaseScope(snapshot, 'phase-1').rounds).toHaveLength(1)
    expect(getPhaseScope(snapshot, 'phase-2').rounds).toHaveLength(0)
  })

  it('offers the next phase once the active phase is complete', () => {
    const snapshot = twoPhaseSnapshot()
    expect(getStartablePhase(snapshot)?.id).toBe('phase-2')
    const unfinished = {
      ...snapshot,
      rounds: [
        { ...snapshot.rounds[0], matches: [{ ...snapshot.rounds[0].matches[0], sets: [] }] },
      ],
    }
    expect(getStartablePhase(unfinished)).toBeUndefined()
    const started = {
      ...snapshot,
      phases: [snapshot.phases[0], { ...snapshot.phases[1], startedAt: 'x', entrants: [] }],
    }
    expect(getStartablePhase(started)).toBeUndefined()
  })
})

describe('mergePhasesOnSave', () => {
  const snapshot = twoPhaseSnapshot()
  const stored = [
    snapshot.phases[0],
    { ...snapshot.phases[1], entrants: ['p1', 'p3'], startedAt: '2026-01-01T11:00:00.000Z' },
  ]

  it('lets phases that did not start follow the draft', () => {
    const open = [snapshot.phases[0], { ...snapshot.phases[1], name: 'Old' }]
    const merged = mergePhasesOnSave(open, [open[0], { ...open[1], name: 'New' }], [])
    expect(merged[1].name).toBe('New')
  })

  it('keeps started phases as stored, also when the draft changed or dropped them', () => {
    expect(isPhaseLocked(stored[1], [])).toBe(true)
    expect(isPhaseLocked(stored[0], snapshot.rounds)).toBe(true)
    const draft = [
      { ...stored[0], name: 'Changed' },
      { ...stored[1], name: 'Changed' },
    ]
    const merged = mergePhasesOnSave(stored, draft, snapshot.rounds)
    expect(merged).toEqual(stored)
    expect(mergePhasesOnSave(stored, [stored[0]], snapshot.rounds)).toEqual(stored)
  })

  it('adds new phases and lets unstarted phases follow the draft', () => {
    const added = { ...snapshot.phases[1], id: 'phase-3', name: 'Third' }
    const open = [snapshot.phases[0], snapshot.phases[1]]
    const merged = mergePhasesOnSave(open, [open[0], added], [])
    expect(merged.map((phase) => phase.id)).toEqual(['phase-1', 'phase-3'])
  })
})
