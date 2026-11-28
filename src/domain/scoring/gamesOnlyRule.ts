import type { GameScore } from '../types'
import { createGameRules, isNumericGame } from './gameRules'

// A game only records its winner: 1:0 or 0:1. There are no points per game.
const isCompleteGame = (game: GameScore) =>
  isNumericGame(game) && Number(game.a) + Number(game.b) === 1

/** eSports: best-of-N games (maps) where every game only selects a winner. */
export const gamesOnlyRules = createGameRules({
  id: 'gamesOnly',
  usesGamePoints: false,
  isGameComplete: isCompleteGame,
  winnerOf: (game) => (Number(game.a) > Number(game.b) ? 'a' : 'b'),
  points: () => ({ a: 0, b: 0 }),
  byePointsPerGame: () => 0,
})
