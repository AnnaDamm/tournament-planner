import { getOpponents, roundValue } from './opponents'
import type { RankingInput, TieBreaker } from './types'

/** Every opponent counts with at least this share of won match points. */
export const OPPONENT_WIN_FLOOR = 1 / 3

/** Match-win percentage of a participant (0..1) with the floor applied. */
const getWinShare = (input: RankingInput, id: string) => {
  const standing = input.standings.get(id)
  const winPoints = input.ctx.scoring.matchPoints.win
  const played = standing ? standing.wins + (standing.draws ?? 0) + standing.losses : 0
  if (!standing || played === 0 || winPoints <= 0) return OPPONENT_WIN_FLOOR
  return Math.max(OPPONENT_WIN_FLOOR, Math.min(1, standing.matchPoints / (played * winPoints)))
}

/**
 * Opponents' performance (OMW%): the average match-win percentage of all opponents, each floored
 * at 33 %. Byes are ignored; without opponents the value is 0.
 */
export const opponentPerformance: TieBreaker = {
  id: 'opponentPerformance',
  labelKey: 'tieBreakersOpponentPerformance',
  descriptionKey: 'tieBreakersOpponentPerformanceHelp',
  compute: (input: RankingInput) =>
    new Map(
      [...getOpponents(input)].map(([id, list]) => {
        const real = list.filter((opponent): opponent is string => opponent !== null)
        const total = real.reduce((sum, opponent) => sum + getWinShare(input, opponent), 0)
        return [id, real.length === 0 ? 0 : roundValue(total / real.length)]
      }),
    ),
}
