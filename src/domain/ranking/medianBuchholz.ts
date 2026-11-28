import { getOpponentScores, getOpponents, roundValue } from './opponents'
import type { RankingInput, TieBreaker } from './types'

/** The opponent scores without the highest and the lowest one (needs at least three). */
export const trimExtremes = (scores: number[]) => {
  if (scores.length < 3) return scores
  return [...scores].sort((first, second) => first - second).slice(1, -1)
}

/**
 * Median Buchholz: the Buchholz without the best and the worst opponent. With fewer than three
 * opponents it equals the Buchholz.
 */
export const medianBuchholz: TieBreaker = {
  id: 'medianBuchholz',
  labelKey: 'tieBreakersMedianBuchholz',
  descriptionKey: 'tieBreakersMedianBuchholzHelp',
  compute: (input: RankingInput) =>
    new Map(
      [...getOpponents(input)].map(([id, list]) => [
        id,
        roundValue(trimExtremes(getOpponentScores(input, list)).reduce((sum, s) => sum + s, 0)),
      ]),
    ),
}
