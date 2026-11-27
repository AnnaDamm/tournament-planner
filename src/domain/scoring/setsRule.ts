import type { GameScore, Match, MatchFormat } from '../types'
import { getMatchGames } from './games'
import type { MatchResult, ScoringRules } from './types'

const isCompleteGame = (game: GameScore) =>
  game.a.trim() !== '' &&
  game.b.trim() !== '' &&
  Number.isFinite(Number(game.a)) &&
  Number.isFinite(Number(game.b)) &&
  Number(game.a) >= 0 &&
  Number(game.b) >= 0 &&
  Number(game.a) !== Number(game.b)

const clampWinningGames = (winningGames: number) =>
  Math.max(1, Math.min(99, Number(winningGames) || 1))

const getResult = (match: Match, format: MatchFormat): MatchResult | null => {
  const winningGames = Math.max(1, format.winningGames || 1)
  const games = getMatchGames(match).filter(isCompleteGame)
  let winsA = 0
  let winsB = 0
  let winner: string | null = null

  games.forEach((game) => {
    if (winner) return
    if (Number(game.a) > Number(game.b)) winsA += 1
    if (Number(game.b) > Number(game.a)) winsB += 1
    if (winsA >= winningGames) winner = match.a
    if (winsB >= winningGames) winner = match.b
  })
  if (!winner) return null

  const gamesA = games.filter((game) => Number(game.a) > Number(game.b)).length
  const pointsA = games.reduce((sum, game) => sum + Number(game.a), 0)
  const pointsB = games.reduce((sum, game) => sum + Number(game.b), 0)
  const winnerIsA = winner === match.a
  return {
    outcome: winnerIsA ? 'a' : 'b',
    winner,
    loser: winnerIsA ? match.b : match.a,
    games,
    gamesA,
    gamesB: games.length - gamesA,
    pointsA,
    pointsB,
  }
}

const getMaxGameCount = (format: MatchFormat) => clampWinningGames(format.winningGames) * 2 - 1

const getVisibleGameCount = (match: Match, format: MatchFormat) => {
  const targetWins = clampWinningGames(format.winningGames)
  let winsA = 0
  let winsB = 0
  let completedGames = 0
  let winnerAt = -1

  getMatchGames(match).forEach((game, index) => {
    if (!isCompleteGame(game)) return
    completedGames += 1
    if (Number(game.a) > Number(game.b)) winsA += 1
    if (Number(game.b) > Number(game.a)) winsB += 1
    if (winnerAt === -1 && (winsA >= targetWins || winsB >= targetWins)) winnerAt = index
  })

  return Math.max(
    targetWins,
    winnerAt >= 0 ? winnerAt + 1 : completedGames >= targetWins ? completedGames + 1 : targetWins,
  )
}

/** Best-of-N games ("sets") where the first side to reach winningGames wins. */
export const setsRules: ScoringRules = {
  id: 'sets',
  entry: 'games',
  usesGamePoints: true,
  supportsFixedGames: false,
  allowsDraw: () => false,
  isGameComplete: isCompleteGame,
  getResult,
  getMaxGameCount,
  getVisibleGameCount,
  getByeCredit: (roundFormat, defaults) => {
    const winningGames = Math.max(1, roundFormat.winningGames || 1)
    const gamePoints = Number.isFinite(defaults.gamePoints)
      ? Math.max(1, Math.floor(defaults.gamePoints!))
      : 21
    return { gamesWon: winningGames, points: winningGames * gamePoints }
  },
}
