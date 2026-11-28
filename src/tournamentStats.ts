import { rankingColumns } from './pages/rankings/columns'
import { compareRankingParticipants, getRankingParticipants } from './tournament'

export type SortableStat = ReturnType<typeof getRankingParticipants>[number] & {
  played: number
  diff: number
  points: number
}

type SortValue = (row: SortableStat) => number | string

/** The value a column sorts by: its registered sortValue, otherwise the row field named like it. */
const getSortValue = (sort: string, sortValues: Record<string, SortValue>): SortValue => {
  const registered =
    sortValues[sort] ?? rankingColumns.find((column) => column.id === sort)?.sortValue
  return (registered as SortValue | undefined) ?? ((row) => Number(row[sort as keyof typeof row]))
}

export const sortStats = (
  stats: SortableStat[],
  sort: string,
  desc: boolean,
  sortValues: Record<string, SortValue> = {},
) => {
  const value = getSortValue(sort, sortValues)
  return [...stats].sort((a, b) => {
    if (sort === 'position') return compareRankingParticipants(a, b)
    const first = sort === 'name' ? a.name : value(a)
    const second = sort === 'name' ? b.name : value(b)
    const primaryValue =
      typeof first === 'string' || typeof second === 'string'
        ? String(first).localeCompare(String(second))
        : first - second
    if (primaryValue !== 0) return (desc ? -1 : 1) * primaryValue
    if (sort === 'wins') return compareRankingParticipants(a, b)
    return a.name.localeCompare(b.name)
  })
}
