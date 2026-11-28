import { describe, expect, it } from 'vitest'
import { withoutDraws } from '../format'
import { resolveScoringRules } from '../sports/registry'
import type { Match, MatchFormat } from '../types'
import { getScoringRules } from './registry'

const match = (
  sets: Array<[number | string, number | string]>,
  extra: Partial<Match> = {},
): Match => ({
  id: 'm',
  a: 'A',
  b: 'B',
  scoreA: '',
  scoreB: '',
  sets: sets.map(([a, b]) => ({ a: String(a), b: String(b) })),
  ...extra,
})

describe('sets rules', () => {
  const rules = getScoringRules('sets')

  it('plays best of N and ignores unfinished or tied games', () => {
    const format: MatchFormat = { winningGames: 2 }
    expect(rules.getResult(match([[21, 10]]), format)).toBeNull()
    expect(
      rules.getResult(
        match([
          [21, 10],
          [5, 5],
        ]),
        format,
      ),
    ).toBeNull()
    const result = rules.getResult(
      match([
        [21, 10],
        [10, 21],
        [21, 19],
      ]),
      format,
    )!
    expect(result).toMatchObject({ outcome: 'a', winner: 'A', gamesA: 2, gamesB: 1 })
    expect(rules.getMaxGameCount(format)).toBe(3)
    expect(rules.allowsDraw(format)).toBe(false)
  })

  it('shows one more game once the target number of games is played', () => {
    const format: MatchFormat = { winningGames: 2 }
    expect(
      rules.getVisibleGameCount(
        match([
          [21, 10],
          [10, 21],
        ]),
        format,
      ),
    ).toBe(3)
    expect(
      rules.getVisibleGameCount(
        match([
          [21, 10],
          [21, 10],
        ]),
        format,
      ),
    ).toBe(2)
  })

  it('plays a fixed number of games and draws when the wins are level', () => {
    const format: MatchFormat = { winningGames: 1, fixedGames: 2 }
    expect(rules.allowsDraw(format)).toBe(true)
    expect(rules.getResult(match([[21, 10]]), format)).toBeNull()
    expect(
      rules.getResult(
        match([
          [21, 10],
          [10, 21],
        ]),
        format,
      ),
    ).toMatchObject({
      outcome: 'draw',
      winner: null,
      gamesA: 1,
      gamesB: 1,
    })
    expect(
      rules.getResult(
        match([
          [21, 10],
          [21, 3],
        ]),
        format,
      ),
    ).toMatchObject({ outcome: 'a' })
    expect(rules.getMaxGameCount(format)).toBe(2)
    expect(rules.getVisibleGameCount(match([]), format)).toBe(2)
  })

  it('needs a winner without draws', () => {
    const format = withoutDraws({ winningGames: 1, fixedGames: 2 })
    expect(format.fixedGames).toBeUndefined()
    expect(format.noDraws).toBe(true)
    expect(rules.allowsDraw(format)).toBe(false)
    expect(rules.allowsDraw({ winningGames: 1, fixedGames: 2, noDraws: true })).toBe(false)
    expect(
      rules.getResult(
        match([
          [21, 10],
          [10, 21],
        ]),
        { winningGames: 1, fixedGames: 2, noDraws: true },
      ),
    ).toBeNull()
  })
})

describe('gamesOnly rules', () => {
  const rules = getScoringRules('gamesOnly')
  const format: MatchFormat = { winningGames: 2 }

  it('counts won games without points', () => {
    expect(rules.getResult(match([[1, 0]]), format)).toBeNull()
    expect(
      rules.getResult(
        match([
          [1, 0],
          [0, 1],
          [0, 1],
        ]),
        format,
      ),
    ).toMatchObject({
      outcome: 'b',
      gamesA: 1,
      gamesB: 2,
      pointsA: 0,
      pointsB: 0,
    })
    expect(
      rules.getResult(
        match([
          [1, 0],
          [1, 0],
        ]),
        format,
      )?.winner,
    ).toBe('A')
    expect(rules.isGameComplete({ a: '5', b: '3' }, format)).toBe(false)
    expect(rules.getByeCredit(format, format)).toEqual({ gamesWon: 2, points: 0 })
  })
})

describe('singleScore rules', () => {
  const rules = getScoringRules('singleScore')
  const format: MatchFormat = { winningGames: 1 }

  it('allows draws and counts the goals', () => {
    expect(rules.getResult(match([[2, 2]]), format)).toMatchObject({
      outcome: 'draw',
      gamesA: 2,
      gamesB: 2,
      pointsA: 2,
    })
    expect(rules.getResult(match([[0, 1]]), format)).toMatchObject({ outcome: 'b', winner: 'B' })
    expect(rules.getResult(match([[1, '']]), format)).toBeNull()
  })

  it('requires a winner when draws are forbidden', () => {
    expect(rules.getResult(match([[2, 2]]), withoutDraws(format))).toBeNull()
    expect(rules.getResult(match([[3, 2]]), withoutDraws(format))?.outcome).toBe('a')
  })
})

describe('outcomeOnly rules', () => {
  const rules = getScoringRules('outcomeOnly')
  const format: MatchFormat = { winningGames: 1 }

  it('uses the stored outcome', () => {
    expect(rules.getResult(match([]), format)).toBeNull()
    expect(rules.getResult(match([], { outcome: 'a' }), format)).toMatchObject({
      winner: 'A',
      loser: 'B',
      gamesA: 1,
    })
    expect(rules.getResult(match([], { outcome: 'draw' }), format)?.outcome).toBe('draw')
    expect(rules.getResult(match([], { outcome: 'draw' }), withoutDraws(format))).toBeNull()
  })

  it('is selectable for the sport other only', () => {
    expect(resolveScoringRules({ sport: 'other', rules: 'outcomeOnly' }).id).toBe('outcomeOnly')
    expect(resolveScoringRules({ sport: 'other' }).id).toBe('sets')
    expect(resolveScoringRules({ sport: 'darts', rules: 'outcomeOnly' }).id).toBe('countdown')
  })
})

describe('countdown rules', () => {
  const rules = getScoringRules('countdown')
  const format: MatchFormat = { winningGames: 2, gamePoints: 501 }

  it('awards the leg to the side at exactly 0', () => {
    expect(rules.isGameComplete({ a: '0', b: '120' }, format)).toBe(true)
    expect(rules.isGameComplete({ a: '120', b: '0' }, format)).toBe(true)
    const result = rules.getResult(
      match([
        [0, 120],
        [60, 0],
        [0, 301],
      ]),
      format,
    )!
    expect(result).toMatchObject({ outcome: 'a', gamesA: 2, gamesB: 1 })
    expect(result.pointsA).toBe(501 + 441 + 501)
    expect(result.pointsB).toBe(381 + 501 + 200)
  })

  it('rejects legs without exactly one side at 0 or above the start score', () => {
    expect(rules.isGameComplete({ a: '10', b: '120' }, format)).toBe(false)
    expect(rules.isGameComplete({ a: '0', b: '0' }, format)).toBe(false)
    expect(rules.isGameComplete({ a: '0', b: '502' }, format)).toBe(false)
    expect(rules.isGameComplete({ a: '0', b: '1.5' }, format)).toBe(false)
    expect(rules.getGameError?.({ a: '10', b: '120' }, format)?.key).toBe('sportsCountdownOneZero')
    expect(rules.getGameError?.({ a: '0', b: '502' }, format)).toMatchObject({
      key: 'sportsCountdownAboveStart',
      params: { start: 501 },
    })
    expect(rules.getGameError?.({ a: '0', b: '' }, format)).toBeNull()
    expect(rules.getGameError?.({ a: '0', b: '120' }, format)).toBeNull()
    expect(
      rules.getResult(
        match([
          [10, 120],
          [10, 120],
        ]),
        format,
      ),
    ).toBeNull()
  })
})
