import type { EvaluationContext } from '../../evaluation'
import { isUnknownParticipantId, unknownParticipantId } from '../../ids'
import { getMatchParticipantIds, hasValidBye } from '../../participants'
import { compareRankingParticipants, getRankingParticipants } from '../../ranking/rank'
import { calculateStandings } from '../../standings/standings'
import type { Participant, Round } from '../../types'
import {
  finalizedParticipantIds,
  sortMatchesByParticipantOrder,
  type PlannedRound,
} from './pairing'

/** The lowest ranked candidate without a bye so far (otherwise simply the lowest ranked). */
const selectLowestBye = (rankedIds: string[], previousRounds: Round[]) => {
  const byes = new Set(previousRounds.filter(hasValidBye).map((round) => round.bye!))
  return [...rankedIds].reverse().find((id) => !byes.has(id)) ?? rankedIds.at(-1)!
}

/**
 * Danish system: the ranking is paired from the top (1-2, 3-4, ...). Rematches are allowed and
 * the bye goes to the lowest ranked participant who has not had one yet.
 */
export const createDanishPlan = (
  players: Participant[],
  previousRounds: Round[],
  { roundNumber, isFirstRound }: PlannedRound,
  preferredBye: string | undefined,
  ctx: EvaluationContext,
) => {
  const active = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(active, previousRounds, ctx)
  const ranking = getRankingParticipants(active, previousRounds, ctx)
  if (!isFirstRound) ranking.sort(compareRankingParticipants)
  const order = ranking.map((player) => player.id)
  const finalized = finalizedParticipantIds(active, previousRounds, ctx)
  let known = order.filter((id) => finalized.has(id))
  let bye: string | null = null
  if (known.length === active.length && active.length % 2 === 1) {
    bye =
      preferredBye && known.includes(preferredBye)
        ? preferredBye
        : selectLowestBye(known, previousRounds)
    known = known.filter((id) => id !== bye)
  }
  const unknown = Array.from({ length: active.length - known.length }, (_, index) =>
    unknownParticipantId(roundNumber, index),
  )
  const ids = [...known, ...unknown]
  if (ids.length % 2 === 1) {
    const pending = ids.findIndex(isUnknownParticipantId)
    ids.splice(pending >= 0 ? pending : ids.length - 1, 1)
  }
  const matches = Array.from({ length: ids.length / 2 }, (_, index) => ({
    id: `${roundNumber}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    a: ids[index * 2],
    b: ids[index * 2 + 1],
    scoreA: '',
    scoreB: '',
  }))
  return { standings, bye, matches: sortMatchesByParticipantOrder(matches, order) }
}

/** Fills unknown placeholders with the best ranked participants that are not yet placed. */
export const fillDanishUnknown = (
  round: Round,
  players: Participant[],
  previousRounds: Round[],
  ctx: EvaluationContext,
): Round => {
  const active = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(active, previousRounds, ctx)
  const ranking = getRankingParticipants(active, previousRounds, ctx).sort(
    compareRankingParticipants,
  )
  const order = ranking.map((player) => player.id)
  const finalized = finalizedParticipantIds(active, previousRounds, ctx)
  const used = new Set<string>()
  const collect = (id: string | null | undefined) => {
    if (id && !isUnknownParticipantId(id)) used.add(id)
  }
  collect(round.bye)
  round.matches.forEach((match) => getMatchParticipantIds(match).forEach(collect))
  const available = order.filter((id) => finalized.has(id) && !used.has(id))
  let bye = round.bye
  if (
    !bye &&
    active.length % 2 === 1 &&
    active.every((player) => finalized.has(player.id)) &&
    available.length > 0
  ) {
    bye = selectLowestBye(available, previousRounds)
    available.splice(available.indexOf(bye), 1)
  }
  const replace = (id: string) => (isUnknownParticipantId(id) ? (available.shift() ?? id) : id)
  if (bye && isUnknownParticipantId(bye)) bye = available.pop() ?? bye
  const matches = round.matches.map((match) => ({
    ...match,
    a: replace(match.a),
    b: replace(match.b),
  }))
  return { ...round, bye, matches: sortMatchesByParticipantOrder(matches, order), standings }
}
