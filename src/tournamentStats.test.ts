import { describe, expect, it } from 'vitest'
import { sortStats, type SortableStat } from './tournamentStats'

const row = (name: string, wins: number, extra = 0) =>
  ({
    id: name,
    name,
    wins,
    losses: 0,
    draws: 0,
    scored: 0,
    conceded: 0,
    setsWon: 0,
    setsLost: 0,
    matchPoints: wins,
    lastLossRound: 0,
    tieBreakValues: [],
    played: wins,
    diff: 0,
    points: 0,
    extra,
  }) as unknown as SortableStat

describe('sortStats', () => {
  const stats = [row('A', 1, 5), row('B', 2, 1), row('C', 3, 3)]
  const names = (sorted: SortableStat[]) => sorted.map((item) => item.name)

  it('sorts by a field of the row', () => {
    expect(names(sortStats(stats, 'wins', true))).toEqual(['C', 'B', 'A'])
    expect(names(sortStats(stats, 'name', false))).toEqual(['A', 'B', 'C'])
  })

  it('sorts by a registered sortValue for columns that are not row fields', () => {
    const sortValues = {
      buchholz: (item: SortableStat) => (item as never as { extra: number }).extra,
    }
    expect(names(sortStats(stats, 'buchholz', true, sortValues))).toEqual(['A', 'C', 'B'])
    expect(names(sortStats(stats, 'buchholz', false, sortValues))).toEqual(['B', 'C', 'A'])
  })
})
