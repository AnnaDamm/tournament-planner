import { tieBreakers } from './registry'
import type { TieBreakerId } from './types'

/** Moves the entry at index by one position; out-of-range moves leave the list unchanged. */
export const moveTieBreaker = (list: TieBreakerId[], index: number, direction: -1 | 1) => {
  const target = index + direction
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/** Registered tie-breakers that are not part of the list yet, in registry order. */
export const getAvailableTieBreakers = (list: TieBreakerId[]) =>
  (Object.keys(tieBreakers) as TieBreakerId[]).filter((id) => !list.includes(id))
