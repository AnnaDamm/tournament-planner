import { createEvaluationContext, type EvaluationContext } from '../evaluation'
import type { Participant, Phase, Round, TournamentSnapshot } from '../types'

type ScopeSnapshot = Pick<
  TournamentSnapshot,
  'phases' | 'players' | 'rounds' | 'scoring' | 'tieBreakers'
>

export type PhaseScope = {
  phase: Phase | undefined
  entrants: Participant[]
  rounds: Round[] // this phase's rounds, ordered
  ctx: EvaluationContext
}

/** The participants of a phase: everybody in the first phase, the frozen entrants afterwards. */
export const getPhaseEntrants = (
  snapshot: Pick<TournamentSnapshot, 'phases' | 'players'>,
  phaseId: string,
): Participant[] => {
  const index = snapshot.phases.findIndex((phase) => phase.id === phaseId)
  if (index <= 0) return snapshot.players
  const byId = new Map(snapshot.players.map((player) => [player.id, player]))
  return (snapshot.phases[index].entrants ?? []).flatMap((id) =>
    byId.has(id) ? [byId.get(id)!] : [],
  )
}

/**
 * The evaluation context of a phase. When a later phase has started, the bye in the last round
 * of this phase counts although the round that follows belongs to the later phase.
 */
export const createPhaseEvaluationContext = (
  snapshot: ScopeSnapshot,
  phaseId: string,
  forceFinal = false,
): EvaluationContext => {
  const ctx = createEvaluationContext(snapshot, phaseId)
  const index = snapshot.phases.findIndex((phase) => phase.id === phaseId)
  const last = snapshot.rounds.filter((round) => round.phaseId === phaseId).at(-1)
  if (!last) return ctx
  const later = new Set(snapshot.phases.slice(index + 1).map((phase) => phase.id))
  const successorStarted =
    snapshot.phases.slice(index + 1).some((phase) => phase.startedAt) ||
    snapshot.rounds.some((round) => later.has(round.phaseId) && round.startedAt)
  return forceFinal || (index >= 0 && successorStarted)
    ? { ...ctx, countedByeRound: last.number }
    : ctx
}

/** Everything that ranks and evaluates one phase on its own (entrants, rounds, context). */
export const getPhaseScope = (snapshot: ScopeSnapshot, phaseId: string): PhaseScope => ({
  phase: snapshot.phases.find((phase) => phase.id === phaseId),
  entrants: getPhaseEntrants(snapshot, phaseId),
  rounds: snapshot.rounds.filter((round) => round.phaseId === phaseId),
  ctx: createPhaseEvaluationContext(snapshot, phaseId),
})

/** A phase that has rounds or was started can no longer change its structure. */
export const isPhaseLocked = (phase: Phase, rounds: Pick<Round, 'phaseId'>[]) =>
  Boolean(phase.startedAt) || rounds.some((round) => round.phaseId === phase.id)

/**
 * Merges edited phases into the stored ones by id: locked phases stay exactly as stored (also
 * when the draft dropped them), unlocked phases take the draft but keep entrants and startedAt.
 */
export const mergePhasesOnSave = (
  current: Phase[],
  draft: Phase[],
  rounds: Pick<Round, 'phaseId'>[],
): Phase[] => {
  const byId = new Map(current.map((phase) => [phase.id, phase]))
  const merged = draft.map((phase) => {
    const stored = byId.get(phase.id)
    if (!stored) return phase
    if (isPhaseLocked(stored, rounds)) return stored
    const { entrants: _entrants, startedAt: _startedAt, ...rest } = phase
    return {
      ...rest,
      ...(stored.entrants ? { entrants: stored.entrants } : {}),
      ...(stored.startedAt ? { startedAt: stored.startedAt } : {}),
    }
  })
  const kept = new Set(merged.map((phase) => phase.id))
  current.forEach((stored, index) => {
    if (!kept.has(stored.id) && isPhaseLocked(stored, rounds)) {
      merged.splice(Math.min(index, merged.length), 0, stored)
    }
  })
  return merged
}
