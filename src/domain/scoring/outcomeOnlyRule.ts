import type { ScoringRules } from './types'

/** No sets: a match is won, lost or drawn; the outcome is entered directly. */
export const outcomeOnlyRules: ScoringRules = {
  id: 'outcomeOnly',
  entry: 'outcome',
  usesGamePoints: false,
  supportsFixedGames: false,
  allowsDraw: (format) => !format.noDraws,
  isGameComplete: () => false,
  getResult: (match, format) => {
    const { outcome } = match
    if (!outcome || (outcome === 'draw' && format.noDraws)) return null
    return {
      outcome,
      winner: outcome === 'draw' ? null : outcome === 'a' ? match.a : match.b,
      loser: outcome === 'draw' ? null : outcome === 'a' ? match.b : match.a,
      games: [],
      gamesA: outcome === 'a' ? 1 : 0,
      gamesB: outcome === 'b' ? 1 : 0,
      pointsA: 0,
      pointsB: 0,
    }
  },
  getMaxGameCount: () => 1,
  getVisibleGameCount: () => 1,
  getByeCredit: () => ({ gamesWon: 1, points: 0 }),
}
