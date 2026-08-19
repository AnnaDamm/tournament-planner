import { calculateStandings } from './tournament'

export type SortableStat = ReturnType<typeof calculateStandings>[number] & {
  played: number
  diff: number
  points: number
}

export const sortStats = (stats: SortableStat[], sort: string, desc: boolean) =>
  [...stats].sort((a, b) => {
    const primaryValue =
      sort === 'position'
        ? a.wins - b.wins
        : sort === 'name'
          ? a.name.localeCompare(b.name)
          : Number(a[sort as keyof typeof a]) - Number(b[sort as keyof typeof b])
    if (primaryValue !== 0) return (desc ? -1 : 1) * primaryValue
    if (sort === 'position' || sort === 'wins') {
      const setsDifferenceA = a.setsWon - a.setsLost
      const setsDifferenceB = b.setsWon - b.setsLost
      if (setsDifferenceA !== setsDifferenceB) return setsDifferenceB - setsDifferenceA
      if (a.diff !== b.diff) return b.diff - a.diff
    }
    return a.name.localeCompare(b.name)
  })
