import type { GameScore, MatchFormat } from '../types'
import { createGameRules, isNumericGame } from './gameRules'

const DEFAULT_START_SCORE = 501

const getStartScore = (format: MatchFormat) =>
  format.gamePoints && format.gamePoints > 0 ? format.gamePoints : DEFAULT_START_SCORE

// Every side enters its remaining score of the leg; the side at exactly 0 wins the leg.
const isCompleteGame = (game: GameScore, format: MatchFormat) =>
  isNumericGame(game) &&
  Number.isInteger(Number(game.a)) &&
  Number.isInteger(Number(game.b)) &&
  (Number(game.a) === 0) !== (Number(game.b) === 0) &&
  Math.max(Number(game.a), Number(game.b)) <= getStartScore(format)

/** Darts: legs counting down from the start score; the side that reaches 0 wins the leg. */
export const countdownRules = createGameRules({
  id: 'countdown',
  usesGamePoints: true,
  isGameComplete: isCompleteGame,
  winnerOf: (game) => (Number(game.a) === 0 ? 'a' : 'b'),
  points: (game, format) => ({
    a: getStartScore(format) - Number(game.a),
    b: getStartScore(format) - Number(game.b),
  }),
  byePointsPerGame: (defaults) => getStartScore(defaults),
  getGameError: (game, format) => {
    if (game.a.trim() === '' || game.b.trim() === '') return null
    if (
      !isNumericGame(game) ||
      !Number.isInteger(Number(game.a)) ||
      !Number.isInteger(Number(game.b))
    )
      return { key: 'sportsCountdownWholeNumbers' }
    if ((Number(game.a) === 0) === (Number(game.b) === 0)) return { key: 'sportsCountdownOneZero' }
    const start = getStartScore(format)
    return Math.max(Number(game.a), Number(game.b)) > start
      ? { key: 'sportsCountdownAboveStart', params: { start } }
      : null
  },
})
