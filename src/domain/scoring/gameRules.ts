import type { I18nText } from '../types'
import type { GameScore, Match, MatchFormat } from '../types'
import { getMatchGames } from './games'
import type { MatchResult, ScoringRuleId, ScoringRules } from './types'

/** What differs between the rules that play a number of games (sets, maps, legs, ...). */
export type GameKind = {
  id: ScoringRuleId
  usesGamePoints: boolean
  /** A fully entered game that decides the game. */
  isGameComplete(game: GameScore, format: MatchFormat): boolean
  /** The winner of a complete game. */
  winnerOf(game: GameScore): 'a' | 'b'
  /** The points both sides score in a complete game. */
  points(game: GameScore, format: MatchFormat): { a: number; b: number }
  /** Points credited per won game for a bye. */
  byePointsPerGame(defaults: MatchFormat): number
  getGameError?(game: GameScore, format: MatchFormat): I18nText | null
}

export const isNumericGame = (game: GameScore) =>
  game.a.trim() !== '' &&
  game.b.trim() !== '' &&
  Number.isFinite(Number(game.a)) &&
  Number.isFinite(Number(game.b)) &&
  Number(game.a) >= 0 &&
  Number(game.b) >= 0

const clampWinningGames = (winningGames: number) =>
  Math.max(1, Math.min(99, Number(winningGames) || 1))

/** The fixed number of games of a format (draws possible); undefined = best of N. */
export const getFixedGames = (format: MatchFormat) =>
  format.fixedGames === undefined
    ? undefined
    : Math.max(1, Math.min(99, Math.floor(Number(format.fixedGames)) || 1))

const allowsDraw = (format: MatchFormat) => {
  const fixed = getFixedGames(format)
  return !format.noDraws && fixed !== undefined && fixed % 2 === 0
}

const buildResult = (
  kind: GameKind,
  match: Match,
  format: MatchFormat,
  games: GameScore[],
  outcome: MatchResult['outcome'],
): MatchResult => {
  const gamesA = games.filter((game) => kind.winnerOf(game) === 'a').length
  const points = games.map((game) => kind.points(game, format))
  const winnerIsA = outcome === 'a'
  return {
    outcome,
    winner: outcome === 'draw' ? null : winnerIsA ? match.a : match.b,
    loser: outcome === 'draw' ? null : winnerIsA ? match.b : match.a,
    games,
    gamesA,
    gamesB: games.length - gamesA,
    pointsA: points.reduce((sum, point) => sum + point.a, 0),
    pointsB: points.reduce((sum, point) => sum + point.b, 0),
  }
}

/** Best-of-N games (the first side to reach winningGames wins) or exactly N games (draws). */
export const createGameRules = (kind: GameKind): ScoringRules => {
  const getResult = (match: Match, format: MatchFormat): MatchResult | null => {
    const games = getMatchGames(match).filter((game) => kind.isGameComplete(game, format))
    const fixed = getFixedGames(format)
    if (fixed !== undefined) {
      if (games.length < fixed) return null
      const counted = games.slice(0, fixed)
      const winsA = counted.filter((game) => kind.winnerOf(game) === 'a').length
      const winsB = counted.length - winsA
      const outcome = winsA > winsB ? 'a' : winsB > winsA ? 'b' : 'draw'
      if (outcome === 'draw' && !allowsDraw(format)) return null
      return buildResult(kind, match, format, counted, outcome)
    }
    const winningGames = Math.max(1, format.winningGames || 1)
    let winsA = 0
    let winsB = 0
    let outcome: 'a' | 'b' | null = null
    games.forEach((game) => {
      if (outcome) return
      if (kind.winnerOf(game) === 'a') winsA += 1
      else winsB += 1
      if (winsA >= winningGames) outcome = 'a'
      if (winsB >= winningGames) outcome = 'b'
    })
    return outcome ? buildResult(kind, match, format, games, outcome) : null
  }

  const getMaxGameCount = (format: MatchFormat) =>
    getFixedGames(format) ?? clampWinningGames(format.winningGames) * 2 - 1

  const getVisibleGameCount = (match: Match, format: MatchFormat) => {
    const fixed = getFixedGames(format)
    if (fixed !== undefined) return fixed
    const targetWins = clampWinningGames(format.winningGames)
    let winsA = 0
    let winsB = 0
    let completedGames = 0
    let winnerAt = -1

    getMatchGames(match).forEach((game, index) => {
      if (!kind.isGameComplete(game, format)) return
      completedGames += 1
      if (kind.winnerOf(game) === 'a') winsA += 1
      else winsB += 1
      if (winnerAt === -1 && (winsA >= targetWins || winsB >= targetWins)) winnerAt = index
    })

    return Math.max(
      targetWins,
      winnerAt >= 0 ? winnerAt + 1 : completedGames >= targetWins ? completedGames + 1 : targetWins,
    )
  }

  return {
    id: kind.id,
    entry: 'games',
    usesGamePoints: kind.usesGamePoints,
    supportsFixedGames: true,
    allowsDraw,
    isGameComplete: kind.isGameComplete,
    getGameError: kind.getGameError,
    getResult,
    getMaxGameCount,
    getVisibleGameCount,
    getByeCredit: (roundFormat, defaults) => {
      const winningGames = Math.max(1, roundFormat.winningGames || 1)
      return { gamesWon: winningGames, points: winningGames * kind.byePointsPerGame(defaults) }
    },
  }
}
