import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultSettingsParts } from './defaults'
import { createEvaluationContext } from './evaluation'
import { getPhaseMode } from './phases/registry'
import { buildPhaseContext, rerollRoundInSnapshot, startNextPhase } from './phases/phaseState'
import { createRoundPlan, rerollRound } from './phases/swiss/pairing'
import { DEFAULT_TIE_BREAKERS, tieBreakers } from './ranking/registry'
import { getScoringRules } from './scoring/registry'
import { getSport } from './sports/registry'
import { createEmptyTournamentSnapshot } from './snapshot'
import type { Match, Round, TournamentSnapshot } from './types'
import { makePlayers } from '../test/fixtures'
import { withSeed } from '../test/seededRandom'
import { playRound } from '../test/simulate'

describe('registries', () => {
  it('provides swiss, sets rules, the "other" sport and the legacy tie-breakers', () => {
    expect(getPhaseMode('swiss')?.id).toBe('swiss')
    expect(getPhaseMode('singleElimination')).toBeUndefined()
    expect(getScoringRules('sets').id).toBe('sets')
    expect(getScoringRules('countdown').id).toBe('countdown')
    expect(getSport('other').rules).toBe('sets')
    expect(getSport('darts').rules).toBe('countdown')
    expect(getSport('football').rules).toBe('singleScore')
    expect(DEFAULT_TIE_BREAKERS).toEqual([
      'lastLoss',
      'gamesWon',
      'gamesLost',
      'pointsScored',
      'pointsConceded',
    ])
    DEFAULT_TIE_BREAKERS.forEach((id) => expect(tieBreakers[id]?.id).toBe(id))
  })
})

const snapshotWith = (count: number): TournamentSnapshot => ({
  ...createEmptyTournamentSnapshot(),
  players: makePlayers(count).map(({ id, name }) => ({ id, name })),
})

describe('swiss phase mode', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('plans like the pairing code it wraps', () => {
    const snapshot = snapshotWith(8)
    const p = buildPhaseContext(snapshot, snapshot.phases[0].id)!
    const mode = getPhaseMode('swiss')!
    const round: Round = {
      number: 1,
      phaseId: snapshot.phases[0].id,
      format: { winningGames: 2 },
      matches: [],
    }
    const planned = withSeed(3, () => mode.planRound(p, round))
    const direct = withSeed(3, () =>
      createRoundPlan(
        snapshot.players,
        [],
        { roundNumber: 1, isFirstRound: true },
        undefined,
        createEvaluationContext(snapshot),
      ),
    )
    expect(planned.matches.map((item: Match) => [item.a, item.b])).toEqual(
      direct.matches.map((item) => [item.a, item.b]),
    )
  })

  it('rerolls a round through the phase mode exactly like rerollRound', () => {
    const base = snapshotWith(9)
    const mode = getPhaseMode('swiss')!
    const phaseId = base.phases[0].id
    const ctx = createEvaluationContext(base)
    const rounds: Round[] = []
    withSeed(5, () => {
      for (let number = 1; number <= 2; number += 1) {
        const p = buildPhaseContext({ ...base, rounds }, phaseId)!
        const shell: Round = { number, phaseId, format: { winningGames: 2 }, matches: [] }
        const plan = mode.planRound(p, shell)
        const planned = {
          ...shell,
          bye: plan.bye,
          matches: plan.matches,
          startedAt: '2026-01-01T10:00:00.000Z',
        }
        rounds.push(
          number === 1
            ? (playRound({ ...planned, winningGames: 2 } as never) as unknown as Round)
            : planned,
        )
      }
    })
    const snapshot = { ...base, rounds }
    const viaMode = withSeed(11, () => rerollRoundInSnapshot(snapshot, 2))
    const direct = withSeed(11, () => rerollRound(base.players, rounds, 2, ctx))
    expect(viaMode[1].matches.map((item) => [item.a, item.b])).toEqual(
      direct[1].matches.map((item) => [item.a, item.b]),
    )
    expect(viaMode[1].bye).toBe(direct[1].bye)
  })

  it('starts the next phase with the top N of a finished phase', () => {
    const base = snapshotWith(4)
    const second = { ...base.phases[0], id: 'phase-2', entry: { kind: 'topN' as const, count: 2 } }
    const phaseId = base.phases[0].id
    const finished: Round = {
      number: 1,
      phaseId,
      format: { winningGames: 1 },
      startedAt: '2026-01-01T10:00:00.000Z',
      matches: [
        { id: 'm1', a: 'p1', b: 'p2', scoreA: '', scoreB: '', sets: [{ a: '21', b: '10' }] },
        { id: 'm2', a: 'p3', b: 'p4', scoreA: '', scoreB: '', sets: [{ a: '21', b: '12' }] },
      ],
    }
    const snapshot = { ...base, phases: [base.phases[0], second], rounds: [finished] }
    const next = startNextPhase(snapshot)
    expect(next.phases[1].entrants).toHaveLength(2)
    expect(next.phases[1].entrants).toEqual(expect.arrayContaining(['p1']))
    expect(next.phases[1].startedAt).toBeTruthy()
    // an unfinished phase does not advance
    expect(
      startNextPhase({
        ...snapshot,
        rounds: [
          { ...finished, matches: [finished.matches[0]!, { ...finished.matches[1]!, sets: [] }] },
        ],
      }).phases[1].entrants,
    ).toBeUndefined()
    expect(createDefaultSettingsParts().phases).toHaveLength(1)
  })
})
