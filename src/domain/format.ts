import type { MatchFormat, Match, Round } from './types'

export const DEFAULT_FORMAT: MatchFormat = { winningGames: 1, gamePoints: 21 }

const clampInteger = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Math.floor(Number(value))
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

/** Normalises a (possibly hand-edited) format; missing fields come from the fallback. */
export const clampFormat = (
  format: Partial<MatchFormat> | undefined,
  fallback: MatchFormat = DEFAULT_FORMAT,
): MatchFormat => {
  const result: MatchFormat = {
    winningGames: clampInteger(format?.winningGames, 1, 99, fallback.winningGames),
  }
  const gamePoints = format?.gamePoints ?? fallback.gamePoints
  if (gamePoints !== undefined) result.gamePoints = clampInteger(gamePoints, 1, 1_000_000, 21)
  const fixedGames = format?.fixedGames ?? fallback.fixedGames
  if (fixedGames !== undefined) result.fixedGames = clampInteger(fixedGames, 1, 99, 1)
  return result
}

/** The effective format of a match: the round format with the per-match override on top. */
export const getMatchFormat = (round: Round, match?: Match): MatchFormat => {
  const format = { ...round.format, ...match?.format }
  return { ...format, winningGames: Math.max(1, format.winningGames || 1) }
}
