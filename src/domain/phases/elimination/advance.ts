import { getMatchFormat } from '../../format'
import { isUnknownParticipantId, unknownParticipantId } from '../../ids'
import { hasEnteredScore } from '../../scoring/games'
import type { ScoringRules } from '../../scoring/types'
import type { Match, ParticipantId, Round } from '../../types'

export type Decision = { winner: ParticipantId; loser: ParticipantId }

/**
 * The winner and loser of a finished match. A draw is not a decision: knockout matches need a
 * winner, so a drawn match neither advances anybody nor counts as finished for the bracket.
 */
export const getDecision = (rules: ScoringRules, round: Round, match: Match): Decision | null => {
  if (isUnknownParticipantId(match.a) || isUnknownParticipantId(match.b)) return null
  const result = rules.getResult(match, getMatchFormat(round, match))
  return result?.winner && result.loser ? { winner: result.winner, loser: result.loser } : null
}

/**
 * Fills the sides that wait for an earlier match with the winner or loser of that match, and puts
 * the placeholder back when the result was removed or is a draw. A match that already has scores
 * keeps its participants. Returns the rounds in the same order; unchanged rounds are returned
 * as the same objects.
 */
const resolve = (rules: ScoringRules, rounds: Round[]) => {
  let conflict = false
  const origins = new Map<string, { round: Round; match: Match }>()
  const resolved = rounds.map((round) => {
    let changed = false
    const matches = round.matches.map((original, matchIndex) => {
      let match = original
      const sides = [
        ['a', match.sourceA],
        ['b', match.sourceB],
      ] as const
      sides.forEach(([side, source], sideIndex) => {
        if (!source || (source.kind !== 'winner' && source.kind !== 'loser')) return
        const origin = origins.get(source.matchId)
        const decision = origin && getDecision(rules, origin.round, origin.match)
        const wanted = decision
          ? decision[source.kind]
          : unknownParticipantId(round.number, matchIndex * 2 + sideIndex)
        if (match[side] === wanted) return
        if (hasEnteredScore(match)) {
          conflict = true
          return
        }
        // The court and the start belong to the old pairing.
        match = { ...match, [side]: wanted, court: undefined, startedAt: undefined }
      })
      if (match !== original) changed = true
      return match
    })
    const next = changed ? { ...round, matches } : round
    next.matches.forEach((match) => origins.set(match.id, { round: next, match }))
    return next
  })
  return { rounds: resolved, conflict }
}

export const resolveBracketRounds = (rules: ScoringRules, rounds: Round[]): Round[] =>
  resolve(rules, rounds).rounds

/** True when a result would change a participant of a later match that already has scores. */
export const hasResolveConflict = (rules: ScoringRules, rounds: Round[]): boolean =>
  resolve(rules, rounds).conflict
