import { describe, expect, it } from 'vitest'
import { createEvaluationContext } from '../evaluation'
import { createRoundPlan } from '../phases/swiss/pairing'
import { createEmptyTournamentSnapshot } from '../snapshot'
import type { Match, Participant, Round } from '../types'
import { DEFAULT_TIE_BREAKERS } from './registry'
import { getRankingParticipants, rankParticipants } from './rank'
import type { TieBreakerId } from './types'
import { trimExtremes } from './medianBuchholz'

const names = ['A', 'B', 'C', 'D', 'E', 'F']
const players: Participant[] = names.map((name) => ({ id: name, name }))
const base = createEmptyTournamentSnapshot()
const phaseId = base.phases[0].id

const ctxFor = (tieBreakers: TieBreakerId[]) => createEvaluationContext({ ...base, tieBreakers })

/** The first side wins 2:0. */
const win = (id: string, a: string, b: string): Match => ({
  id,
  a,
  b,
  scoreA: '',
  scoreB: '',
  sets: [
    { a: '21', b: '10' },
    { a: '21', b: '12' },
  ],
})

const round = (
  number: number,
  pairs: Array<[string, string]>,
  extra: Partial<Round> = {},
): Round => ({
  number,
  phaseId,
  format: { winningGames: 2 },
  startedAt: '2026-01-01T10:00:00.000Z',
  matches: pairs.map(([a, b], index) => win(`r${number}-${index}`, a, b)),
  ...extra,
})

// Hand-computed: match points A3 B1 C2 D1 E2 F0.
const rounds = [
  round(1, [
    ['A', 'B'],
    ['C', 'D'],
    ['E', 'F'],
  ]),
  round(2, [
    ['A', 'C'],
    ['E', 'B'],
    ['D', 'F'],
  ]),
  round(3, [
    ['A', 'E'],
    ['C', 'F'],
    ['B', 'D'],
  ]),
]

const values = (id: TieBreakerId, list: Round[] = rounds, players_ = players) =>
  Object.fromEntries(
    getRankingParticipants(players_, list, ctxFor([id])).map((item) => [
      item.id,
      item.tieBreakValues[0],
    ]),
  )

describe('tie-breakers', () => {
  it('computes the Buchholz as the sum of the opponents match points', () => {
    expect(values('buchholz')).toEqual({ A: 5, B: 6, C: 4, D: 3, E: 4, F: 5 })
  })

  it('computes the median Buchholz without the best and the worst opponent', () => {
    expect(values('medianBuchholz')).toEqual({ A: 2, B: 2, C: 1, D: 1, E: 1, F: 2 })
    expect(trimExtremes([1, 5])).toEqual([1, 5])
    expect(trimExtremes([4, 1, 3, 2])).toEqual([2, 3])
  })

  it("computes the opponents' performance with a 33 % floor", () => {
    const result = values('opponentPerformance')
    const expected = { A: 5 / 9, B: 2 / 3, C: 5 / 9, D: 4 / 9, E: 5 / 9, F: 5 / 9 }
    Object.entries(expected).forEach(([id, value]) => expect(result[id]).toBeCloseTo(value, 5))
  })

  it('counts a bye as an opponent with 0 points for Buchholz and ignores it for OMW%', () => {
    const three = players.slice(0, 3)
    const list = [
      round(1, [['A', 'B']], { bye: 'C' }),
      round(2, [['A', 'C']], { bye: 'B' }),
      round(3, []),
    ]
    // A has 2 points, C has the bye win (1 point) and lost to A.
    expect(values('buchholz', list, three)).toMatchObject({ A: 1 + 1, C: 0 + 2 })
    expect(values('opponentPerformance', list, three).C).toBeCloseTo(1, 5)
  })

  it('has no opponents before the first result', () => {
    expect(values('buchholz', [])).toEqual({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 })
    expect(values('opponentPerformance', [])).toEqual({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 })
  })

  it('ranks like before with the default list and re-sorts with a configured one', () => {
    const order = (list: TieBreakerId[]) =>
      rankParticipants(players, rounds, ctxFor(list)).map((item) => item.id)
    expect(order(DEFAULT_TIE_BREAKERS)).toEqual(['A', 'E', 'C', 'D', 'B', 'F'])
    expect(order(['buchholz', ...DEFAULT_TIE_BREAKERS])).toEqual(['A', 'E', 'C', 'B', 'D', 'F'])
    expect(order(['opponentPerformance', 'buchholz'])).toEqual(['A', 'C', 'E', 'B', 'D', 'F'])
  })

  it('lets the swiss pairing follow the configured tie-breakers', () => {
    const plan = (list: TieBreakerId[]) =>
      createRoundPlan(
        players,
        rounds,
        { roundNumber: 4, isFirstRound: false },
        undefined,
        ctxFor(list),
      )
    // The planned matches are listed in ranking order, which the tie-breakers decide.
    const order = (list: TieBreakerId[]) => plan(list).matches.map((item) => item.a)
    expect(order(DEFAULT_TIE_BREAKERS)).toEqual(['A', 'E', 'B'])
    expect(order(['buchholz'])).toEqual(['A', 'C', 'B'])
  })
})
