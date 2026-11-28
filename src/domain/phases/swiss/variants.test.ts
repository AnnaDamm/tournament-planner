import { describe, expect, it } from 'vitest'
import { createDefaultPhase, createDefaultScoring } from '../../defaults'
import { createEvaluationContext } from '../../evaluation'
import { DEFAULT_TIE_BREAKERS } from '../../ranking/registry'
import type { Round } from '../../types'
import { makePlayers } from '../../../test/fixtures'
import { withSeed } from '../../../test/seededRandom'
import { parseSwissConfig } from './config'
import { fillDanishUnknown } from './danish'
import { getSwissPlanner } from './variants'

const ctx = createEvaluationContext({
  scoring: createDefaultScoring({ winningGames: 1, gamePoints: 21 }),
  tieBreakers: [...DEFAULT_TIE_BREAKERS],
  phases: [createDefaultPhase()],
})
const finishedRound = (number: number, pairs: Array<[string, string]>): Round => ({
  number,
  phaseId: 'phase-1',
  format: { winningGames: 1 },
  matches: pairs.map(([a, b], index) => ({
    id: `r${number}-${index}`,
    a,
    b,
    scoreA: '',
    scoreB: '',
    sets: [{ a: '21', b: '10' }],
  })),
})
const ids = (plan: { matches: Array<{ a: string; b: string }> }) =>
  plan.matches.map((match) => [match.a, match.b].sort().join('-')).sort()

describe('Danish swiss', () => {
  const plan = getSwissPlanner({ variant: 'danish' })
  const players = makePlayers(6)

  it('pairs 1-2, 3-4 and 5-6 by the table, allowing rematches', () => {
    // Round 1 (seed order) already paired p1-p2, p3-p4, p5-p6; winners are p1, p3, p5.
    const rounds = [
      finishedRound(1, [
        ['p1', 'p2'],
        ['p3', 'p4'],
        ['p5', 'p6'],
      ]),
    ]
    const result = withSeed(1, () =>
      plan(players, rounds, { roundNumber: 2, isFirstRound: false }, undefined, ctx),
    )
    expect(ids(result)).toEqual(['p1-p3', 'p2-p5', 'p4-p6'])
    const again = withSeed(2, () =>
      plan(
        players,
        [
          ...rounds,
          finishedRound(2, [
            ['p1', 'p3'],
            ['p2', 'p4'],
            ['p5', 'p6'],
          ]),
        ],
        {
          roundNumber: 3,
          isFirstRound: false,
        },
        undefined,
        ctx,
      ),
    )
    expect(ids(again)).toEqual(
      ['p1-p5', 'p3-p2', 'p4-p6'].map((v) => v.split('-').sort().join('-')).sort(),
    )
  })

  it('gives the bye to the lowest ranked participant without a bye', () => {
    const five = makePlayers(5)
    const first = withSeed(3, () =>
      plan(five, [], { roundNumber: 1, isFirstRound: true }, undefined, ctx),
    )
    expect(first.bye).toBe('p5')
    const rounds: Round[] = [
      {
        ...finishedRound(1, [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ]),
        bye: 'p5',
      },
    ]
    const second = withSeed(3, () =>
      plan(five, rounds, { roundNumber: 2, isFirstRound: false }, undefined, ctx),
    )
    expect(second.bye).toBe('p4')
  })

  it('fills unknown placeholders with the best ranked available participants', () => {
    const rounds = [
      finishedRound(1, [
        ['p1', 'p2'],
        ['p3', 'p4'],
        ['p5', 'p6'],
      ]),
    ]
    const draft: Round = {
      number: 2,
      phaseId: 'phase-1',
      format: { winningGames: 1 },
      bye: null,
      matches: [
        { id: 'a', a: 'p1', b: '__unknown__:2:0', scoreA: '', scoreB: '' },
        { id: 'b', a: '__unknown__:2:1', b: '__unknown__:2:2', scoreA: '', scoreB: '' },
      ],
    }
    const filled = fillDanishUnknown(draft, players, rounds, ctx)
    expect(
      filled.matches.flatMap((match) => [match.a, match.b]).every((id) => !id.startsWith('__')),
    ).toBe(true)
    expect(new Set(filled.matches.flatMap((match) => [match.a, match.b])).size).toBe(4)
  })
})

describe('accelerated swiss', () => {
  const plan = getSwissPlanner({ variant: 'accelerated' })
  const players = makePlayers(8)

  it('pairs the first round inside the upper and the lower half', () => {
    const result = withSeed(5, () =>
      plan(players, [], { roundNumber: 1, isFirstRound: true }, undefined, ctx),
    )
    expect(ids(result)).toEqual(['p1-p3', 'p2-p4', 'p5-p7', 'p6-p8'])
  })

  it('pairs round 2 by virtual points and ignores them afterwards', () => {
    // Upper half won against the lower half would be natural; here p1, p2 win and p5, p6 win.
    const rounds = [
      finishedRound(1, [
        ['p1', 'p3'],
        ['p2', 'p4'],
        ['p5', 'p7'],
        ['p6', 'p8'],
      ]),
    ]
    const second = withSeed(5, () =>
      plan(players, rounds, { roundNumber: 2, isFirstRound: false }, undefined, ctx),
    )
    // Effective: p1,p2 = 2; p3,p4 = 1; p5,p6 = 1; p7,p8 = 0.
    expect(ids(second)).toEqual(['p1-p2', 'p3-p4', 'p5-p6', 'p7-p8'].sort())
    const rounds3 = [
      ...rounds,
      finishedRound(2, [
        ['p1', 'p2'],
        ['p5', 'p3'],
        ['p6', 'p4'],
        ['p7', 'p8'],
      ]),
    ]
    const third = withSeed(5, () =>
      plan(players, rounds3, { roundNumber: 3, isFirstRound: false }, undefined, ctx),
    )
    // acceleratedRounds = 2: no bonus any more; p1, p5, p6, p7 have 2 / 2 / 2 / 1 real wins.
    expect(third.matches).toHaveLength(4)
    const standard = withSeed(5, () =>
      getSwissPlanner({ variant: 'standard' })(
        players,
        rounds3,
        { roundNumber: 3, isFirstRound: false },
        undefined,
        ctx,
      ),
    )
    expect(ids(third)).toEqual(ids(standard))
  })

  it('parses and defaults the config', () => {
    expect(parseSwissConfig({ variant: 'accelerated', acceleratedRounds: 3 })).toEqual({
      variant: 'accelerated',
      acceleratedRounds: 3,
    })
    expect(parseSwissConfig({ variant: 'bogus' })).toBeNull()
  })
})
