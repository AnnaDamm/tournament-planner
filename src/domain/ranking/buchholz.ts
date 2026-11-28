import { getOpponentScores, getOpponents, roundValue } from './opponents'
import type { RankingInput, TieBreaker } from './types'

export const sumOpponentScores = (input: RankingInput) => {
  const opponents = getOpponents(input)
  return new Map(
    [...opponents].map(([id, list]) => [
      id,
      roundValue(getOpponentScores(input, list).reduce((sum, score) => sum + score, 0)),
    ]),
  )
}

/** Buchholz: the sum of the match points of all opponents (a bye counts as 0 points). */
export const buchholz: TieBreaker = {
  id: 'buchholz',
  labelKey: 'tieBreakersBuchholz',
  descriptionKey: 'tieBreakersBuchholzHelp',
  compute: sumOpponentScores,
}
