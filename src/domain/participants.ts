import { isUnknownParticipantId } from './ids'
import type { Match, ParticipantId, Round } from './types'

/** Participants playing on one side; a drawn lineup replaces the side id. */
export const getMatchSideIds = (match: Match, side: 'a' | 'b'): ParticipantId[] =>
  (side === 'a' ? match.lineupA : match.lineupB) ?? [side === 'a' ? match.a : match.b]

export const getMatchParticipantIds = (match: Match): ParticipantId[] => [
  ...getMatchSideIds(match, 'a'),
  ...getMatchSideIds(match, 'b'),
]

export const hasMatchParticipant = (round: Round, participantId: ParticipantId) =>
  round.matches.some((match) => getMatchParticipantIds(match).includes(participantId))

export const hasValidBye = (round: Round) =>
  Boolean(round.bye && !isUnknownParticipantId(round.bye) && !hasMatchParticipant(round, round.bye))

export const isByeCounted = (round: Round, nextRound?: Round) =>
  Boolean(nextRound?.startedAt && hasValidBye(round))
