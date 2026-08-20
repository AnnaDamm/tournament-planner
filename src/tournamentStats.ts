import { compareRankingParticipants, getRankingParticipants } from './tournament'

export type SortableStat = ReturnType<typeof getRankingParticipants>[number] & {
  played: number
  diff: number
  points: number
}

export const sortStats = (stats: SortableStat[], sort: string, desc: boolean) =>
  [...stats].sort((a, b) => {
    if (sort === 'position') return compareRankingParticipants(a, b)
    const primaryValue =
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : Number(a[sort as keyof typeof a]) - Number(b[sort as keyof typeof b])
    if (primaryValue !== 0) return (desc ? -1 : 1) * primaryValue
    if (sort === 'wins') return compareRankingParticipants(a, b)
    return a.name.localeCompare(b.name)
  })
