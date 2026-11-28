import type { GameScore } from '../types'
import { createGameRules, isNumericGame } from './gameRules'

const isCompleteGame = (game: GameScore) => isNumericGame(game) && Number(game.a) !== Number(game.b)

/** Best-of-N games ("sets", frames, ...) with points; optionally exactly N games (draws). */
export const setsRules = createGameRules({
  id: 'sets',
  usesGamePoints: true,
  isGameComplete: isCompleteGame,
  winnerOf: (game) => (Number(game.a) > Number(game.b) ? 'a' : 'b'),
  points: (game) => ({ a: Number(game.a), b: Number(game.b) }),
  byePointsPerGame: (defaults) =>
    Number.isFinite(defaults.gamePoints) ? Math.max(1, Math.floor(defaults.gamePoints!)) : 0,
})
