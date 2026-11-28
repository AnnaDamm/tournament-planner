import { getMatchGames } from './games'
import { isNumericGame } from './gameRules'
import type { ScoringRules } from './types'

/** Football: one score line per match; a draw is possible unless the format forbids it. */
export const singleScoreRules: ScoringRules = {
  id: 'singleScore',
  entry: 'single',
  usesGamePoints: false,
  supportsFixedGames: false,
  allowsDraw: (format) => !format.noDraws,
  isGameComplete: isNumericGame,
  getResult: (match, format) => {
    const game = getMatchGames(match).find(isNumericGame)
    if (!game) return null
    const a = Number(game.a)
    const b = Number(game.b)
    if (a === b && format.noDraws) return null
    const outcome = a > b ? 'a' : b > a ? 'b' : 'draw'
    return {
      outcome,
      winner: outcome === 'draw' ? null : outcome === 'a' ? match.a : match.b,
      loser: outcome === 'draw' ? null : outcome === 'a' ? match.b : match.a,
      games: [game],
      // The goals are the "games" of this rule, so the table shows one goals column.
      gamesA: a,
      gamesB: b,
      pointsA: a,
      pointsB: b,
    }
  },
  getMaxGameCount: () => 1,
  getVisibleGameCount: () => 1,
  getByeCredit: () => ({ gamesWon: 0, points: 0 }),
}
