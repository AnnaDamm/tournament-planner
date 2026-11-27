export const UNKNOWN_PARTICIPANT_PREFIX = '__unknown__:'

export const isUnknownParticipantId = (id: string) => id.startsWith(UNKNOWN_PARTICIPANT_PREFIX)

export const unknownParticipantId = (roundNumber: number, index: number) =>
  `${UNKNOWN_PARTICIPANT_PREFIX}${roundNumber}:${index}`

export const createId = () => Math.random().toString(36).slice(2, 9)
