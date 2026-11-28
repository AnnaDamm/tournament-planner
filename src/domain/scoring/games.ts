import type { GameScore, Match } from '../types'

/** The entered games; the legacy single score fields count as one game. */
export const getMatchGames = (match: Match): GameScore[] =>
  match.sets?.length
    ? match.sets
    : match.scoreA !== '' || match.scoreB !== ''
      ? [{ a: match.scoreA, b: match.scoreB }]
      : []

export const hasEnteredScore = (match: Match) =>
  match.outcome !== undefined ||
  getMatchGames(match).some((game) => game.a.trim() !== '' || game.b.trim() !== '')
