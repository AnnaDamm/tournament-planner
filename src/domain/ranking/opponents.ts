import { getMatchSideIds } from '../participants'
import type { ParticipantId } from '../types'
import type { RankingInput } from './types'

/** Scores of one opponent as seen by a participant; null marks a bye (no real opponent). */
export type Opponent = ParticipantId | null

/**
 * Every opponent a participant has met, one entry per match (a rematch counts twice). A bye
 * is listed as null. Only finished matches and counted byes take part.
 */
export const getOpponents = (input: RankingInput): Map<ParticipantId, Opponent[]> => {
  const opponents = new Map<ParticipantId, Opponent[]>(
    input.participants.map((player) => [player.id, []]),
  )
  input.results.forEach((entry) => {
    if (entry.kind === 'bye') {
      opponents.get(entry.participantId)?.push(null)
      return
    }
    const sideA = getMatchSideIds(entry.match, 'a')
    const sideB = getMatchSideIds(entry.match, 'b')
    sideA.forEach((id) => opponents.get(id)?.push(...sideB))
    sideB.forEach((id) => opponents.get(id)?.push(...sideA))
  })
  return opponents
}

/** Match points of an opponent; a bye counts as an opponent with 0 points. */
export const getOpponentScores = (input: RankingInput, opponents: Opponent[]): number[] =>
  opponents.map((id) => (id === null ? 0 : (input.standings.get(id)?.matchPoints ?? 0)))

/** Removes floating point noise so that equal values compare equal. */
export const roundValue = (value: number) => Math.round(value * 1e6) / 1e6
