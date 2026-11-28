import type { Participant } from '../../types'

export const nextPowerOfTwo = (count: number) => {
  let size = 1
  while (size < count) size *= 2
  return size
}

/**
 * The seeds in bracket order for a bracket of the given size (a power of two): the first seed
 * meets the last one, the best two seeds can only meet in the final (1v8, 4v5, 2v7, 3v6 ...).
 */
export const getStandardSeedOrder = (size: number): number[] => {
  let order = [1]
  while (order.length < size) {
    const total = order.length * 2
    order = order.flatMap((seed) => [seed, total + 1 - seed])
  }
  return order
}

/** Fisher-Yates shuffle without touching the input. */
export const shuffle = <T>(items: T[], random: () => number = Math.random): T[] => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

/** The participants in seed order: withdrawn ones are left out; 'random' draws the seeds. */
export const seedEntrants = (
  entrants: Participant[],
  seeding: 'standard' | 'random',
  random: () => number = Math.random,
) => {
  const active = entrants.filter((participant) => !participant.withdrawn)
  return seeding === 'random' ? shuffle(active, random) : active
}
