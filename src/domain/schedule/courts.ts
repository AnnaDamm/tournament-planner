import { getMatchFormat } from '../format'
import { isUnknownParticipantId } from '../ids'
import { getMatchParticipantIds } from '../participants'
import { hasEnteredScore } from '../scoring/games'
import type { ScoringRules } from '../scoring/types'
import type { Match, Round } from '../types'

export const getCurrentRoundNumber = (
  rules: ScoringRules,
  rounds: Round[],
  defaultCourtCount = 1,
) => {
  const runningMatchIds = getRunningMatchIdsByRound(rules, rounds, defaultCourtCount)
  const currentRound = rounds.find(
    (round) =>
      round.matches.length > 0 &&
      ((!round.startedAt && !isRoundComplete(rules, round)) || runningMatchIds.has(round.number)),
  )
  const lastPlannedRound = [...rounds].reverse().find((round) => round.matches.length > 0)
  return currentRound?.number ?? lastPlannedRound?.number ?? 0
}

const isMatchComplete = (rules: ScoringRules, round: Round, match: Match) =>
  Boolean(rules.getResult(match, getMatchFormat(round, match)))

export const isRoundComplete = (rules: ScoringRules, round: Round) =>
  round.matches.length > 0 && round.matches.every((match) => isMatchComplete(rules, round, match))

export const getRoundCourtCount = (round: Round, defaultCourtCount = 1) => {
  const value = round.courtCount ?? defaultCourtCount
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

export const getRunningMatchIds = (rules: ScoringRules, round: Round, defaultCourtCount = 1) => {
  if (!round.startedAt) return new Set<string>()
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const assignedMatches = round.matches.filter(
    (match) =>
      !isMatchComplete(rules, round, match) &&
      Number.isInteger(match.court) &&
      match.court! >= 1 &&
      match.court! <= capacity,
  )
  if (assignedMatches.length > 0) return new Set(assignedMatches.map((match) => match.id))
  const runningMatches = round.matches
    .filter((match) => !isMatchComplete(rules, round, match))
    .slice(0, getRoundCourtCount(round, defaultCourtCount))
  return new Set(runningMatches.map((match) => match.id))
}

const getComputedRunningMatchIdsByRound = (
  rules: ScoringRules,
  rounds: Round[],
  defaultCourtCount = 1,
  includeUnstarted = false,
) => {
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const runningByRound = new Map<number, Set<string>>()
  const occupiedParticipants = new Set<string>()
  const blockedByPreviousRounds = new Set<string>()
  const candidates = rounds.flatMap((round) => {
    const incompleteMatches = round.matches.filter((match) => !isMatchComplete(rules, round, match))
    const blockedParticipants = new Set(blockedByPreviousRounds)
    incompleteMatches.forEach((match) => {
      getMatchParticipantIds(match).forEach((id) => {
        if (!isUnknownParticipantId(id)) blockedByPreviousRounds.add(id)
      })
    })

    if (!round.startedAt && !includeUnstarted) return []
    return incompleteMatches.map((match) => ({ round, match, blockedParticipants }))
  })
  const prioritizedCandidates = candidates.sort(
    (first, second) => Number(hasEnteredScore(second.match)) - Number(hasEnteredScore(first.match)),
  )
  let assignedCourts = 0

  for (const { round, match, blockedParticipants } of prioritizedCandidates) {
    if (assignedCourts >= capacity) break
    const runningIds = runningByRound.get(round.number) ?? new Set<string>()
    if (runningIds.size >= getRoundCourtCount(round, capacity)) continue
    const participantIds = getMatchParticipantIds(match)
    if (participantIds.some(isUnknownParticipantId)) continue
    if (participantIds.some((id) => blockedParticipants.has(id) || occupiedParticipants.has(id))) {
      continue
    }
    runningIds.add(match.id)
    runningByRound.set(round.number, runningIds)
    participantIds.forEach((id) => occupiedParticipants.add(id))
    assignedCourts += 1
  }

  return runningByRound
}

const hasAssignedCourt = (match: Match, capacity: number) =>
  Number.isInteger(match.court) && match.court! >= 1 && match.court! <= capacity

const getAssignedRunningMatchIdsByRound = (
  rules: ScoringRules,
  rounds: Round[],
  defaultCourtCount: number,
) => {
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const runningByRound = new Map<number, Set<string>>()
  rounds.forEach((round) => {
    if (!round.startedAt) return
    const runningIds = new Set(
      round.matches
        .filter(
          (match) => !isMatchComplete(rules, round, match) && hasAssignedCourt(match, capacity),
        )
        .map((match) => match.id),
    )
    if (runningIds.size > 0) runningByRound.set(round.number, runningIds)
  })
  return runningByRound
}

export const getRunningMatchIdsByRound = (
  rules: ScoringRules,
  rounds: Round[],
  defaultCourtCount = 1,
  includeUnstarted = false,
) => {
  if (includeUnstarted) {
    return getComputedRunningMatchIdsByRound(rules, rounds, defaultCourtCount, true)
  }
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const hasPersistedAssignments = rounds.some((round) =>
    round.matches.some((match) => hasAssignedCourt(match, capacity)),
  )
  return hasPersistedAssignments
    ? getAssignedRunningMatchIdsByRound(rules, rounds, defaultCourtCount)
    : getComputedRunningMatchIdsByRound(rules, rounds, defaultCourtCount)
}

type CourtCandidate = {
  round: Round
  match: Match
  blockedParticipants: Set<string>
}

const getCourtCandidates = (rules: ScoringRules, rounds: Round[]) => {
  const blockedByPreviousRounds = new Set<string>()
  const candidates = rounds.flatMap((round) => {
    const incompleteMatches = round.matches.filter((match) => !isMatchComplete(rules, round, match))
    const blockedParticipants = new Set(blockedByPreviousRounds)
    incompleteMatches.forEach((match) => {
      getMatchParticipantIds(match).forEach((id) => {
        if (!isUnknownParticipantId(id)) blockedByPreviousRounds.add(id)
      })
    })
    if (!round.startedAt) return []
    return incompleteMatches.map((match) => ({ round, match, blockedParticipants }))
  })
  return candidates.sort(
    (first, second) => Number(hasEnteredScore(second.match)) - Number(hasEnteredScore(first.match)),
  )
}

const canAssignCourt = (
  candidate: CourtCandidate,
  capacity: number,
  usedCourts: Set<number>,
  occupiedParticipants: Set<string>,
  assignedByRound: Map<number, number>,
) => {
  const { round, match, blockedParticipants } = candidate
  const participantIds = getMatchParticipantIds(match)
  if (
    participantIds.some(
      (id) =>
        isUnknownParticipantId(id) || blockedParticipants.has(id) || occupiedParticipants.has(id),
    )
  ) {
    return false
  }
  return (assignedByRound.get(round.number) ?? 0) < getRoundCourtCount(round, capacity)
}

export const assignCourtsToMatches = (
  rules: ScoringRules,
  rounds: Round[],
  defaultCourtCount = 1,
  startedAt = new Date().toISOString(),
) => {
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const candidates = getCourtCandidates(rules, rounds)
  const usedCourts = new Set<number>()
  const occupiedParticipants = new Set<string>()
  const assignedByRound = new Map<number, number>()
  const assignedCourts = new Map<string, number>()
  const assignedStartTimes = new Map<string, string>()
  const assign = (candidate: CourtCandidate, court: number) => {
    assignedCourts.set(candidate.match.id, court)
    if (!candidate.match.startedAt) assignedStartTimes.set(candidate.match.id, startedAt)
    usedCourts.add(court)
    assignedByRound.set(
      candidate.round.number,
      (assignedByRound.get(candidate.round.number) ?? 0) + 1,
    )
    getMatchParticipantIds(candidate.match).forEach((id) => occupiedParticipants.add(id))
  }

  candidates.forEach((candidate) => {
    const court = candidate.match.court
    if (
      !canAssignCourt(candidate, capacity, usedCourts, occupiedParticipants, assignedByRound) ||
      !hasAssignedCourt(candidate.match, capacity) ||
      usedCourts.has(court!)
    ) {
      return
    }
    assign(candidate, court!)
  })

  candidates.forEach((candidate) => {
    if (assignedCourts.has(candidate.match.id)) return
    if (!canAssignCourt(candidate, capacity, usedCourts, occupiedParticipants, assignedByRound)) {
      return
    }
    const court = Array.from({ length: capacity }, (_, index) => index + 1).find(
      (value) => !usedCourts.has(value),
    )
    if (court !== undefined) assign(candidate, court)
  })

  let changed = false
  const next = rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => {
      const court = assignedCourts.get(match.id)
      const startedAt = assignedStartTimes.get(match.id)
      if (match.court === court && (!startedAt || match.startedAt === startedAt)) return match
      changed = true
      return { ...match, court, startedAt: match.startedAt ?? startedAt }
    }),
  }))
  return changed ? next : rounds
}

export const calculateExpectedMatchStarts = (
  rounds: Round[],
  courtCount: number,
  durationMinutes: number,
  breakMinutes: number,
  scheduledStart = '',
  expectedMatchCount = 0,
) => {
  const capacity = Math.max(1, Math.floor(courtCount) || 1)
  const duration = Math.max(1, durationMinutes) * 60_000
  const pause = Math.max(0, breakMinutes) * 60_000
  let nextRoundStart = Number.isNaN(new Date(scheduledStart).getTime())
    ? undefined
    : new Date(scheduledStart).getTime()

  return rounds.map((round) => {
    const actualStarts = round.matches
      .map((match) => match.startedAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite)
    const roundStartedAt = round.startedAt ? new Date(round.startedAt).getTime() : NaN
    const roundStart = actualStarts.length
      ? Math.min(...actualStarts)
      : Number.isFinite(roundStartedAt)
        ? roundStartedAt
        : nextRoundStart

    if (!Number.isFinite(roundStart)) {
      return round
    }

    const matches = round.matches.map((match, index) => ({
      ...match,
      predictedStart: new Date(
        roundStart + Math.floor(index / capacity) * (duration + pause),
      ).toISOString(),
    }))
    const matchCount = round.matches.length || expectedMatchCount
    const batches = Math.ceil(matchCount / capacity)
    nextRoundStart = roundStart + batches * duration + batches * pause
    return { ...round, predictedStart: new Date(roundStart).toISOString(), matches }
  })
}

export const startRoundInRounds = (
  rounds: Round[],
  number: number,
  startedAt = new Date().toISOString(),
) =>
  rounds.map((round) =>
    round.number === number && !round.startedAt ? { ...round, startedAt } : round,
  )

export const startReadyRounds = (
  rules: ScoringRules,
  rounds: Round[],
  defaultCourtCount = 1,
  startedAt = new Date().toISOString(),
) => {
  const readyMatchIds = getRunningMatchIdsByRound(rules, rounds, defaultCourtCount, true)
  let changed = false
  const next = rounds.map((round, index) => {
    const startsFirstRound = index === 0 && round.matches.some(hasEnteredScore)
    const startsReadyRound = index > 0 && readyMatchIds.has(round.number)
    if (!round.startedAt && (startsFirstRound || startsReadyRound)) {
      changed = true
      return { ...round, startedAt }
    }
    return round
  })
  return assignCourtsToMatches(rules, changed ? next : rounds, defaultCourtCount, startedAt)
}
