import type { Phase, Round, TournamentSnapshot } from '../types'
import { hasEnteredScore } from '../scoring/games'
import { getPhaseMode } from './registry'
import { createPhaseEvaluationContext, getPhaseEntrants } from './scope'
import { transitionResolvers } from './transitions'
import type { PhaseContext, PhaseMode } from './types'

type PhaseSnapshot = Pick<
  TournamentSnapshot,
  'phases' | 'players' | 'rounds' | 'scoring' | 'tieBreakers'
>

export const getPhase = (snapshot: Pick<TournamentSnapshot, 'phases'>, id: string) =>
  snapshot.phases.find((phase) => phase.id === id)

export const getPhaseRounds = (snapshot: Pick<TournamentSnapshot, 'rounds'>, phaseId: string) =>
  snapshot.rounds.filter((round) => round.phaseId === phaseId)

/** The last phase that has rounds or was started; the first phase otherwise. */
export const getActivePhase = (snapshot: PhaseSnapshot): Phase =>
  [...snapshot.phases]
    .reverse()
    .find(
      (phase) => phase.startedAt || snapshot.rounds.some((round) => round.phaseId === phase.id),
    ) ?? snapshot.phases[0]

export const buildPhaseContext = (
  snapshot: PhaseSnapshot,
  phaseId: string,
): PhaseContext<unknown> | null => {
  const phaseIndex = snapshot.phases.findIndex((phase) => phase.id === phaseId)
  const phase = snapshot.phases[phaseIndex]
  const mode = phase && getPhaseMode(phase.mode)
  if (!phase || !mode) return null
  const entrants = getPhaseEntrants(snapshot, phaseId)
  return {
    phase: { ...phase, config: mode.parseConfig(phase.config) ?? mode.defaultConfig() },
    phaseIndex,
    entrants,
    rounds: getPhaseRounds(snapshot, phaseId),
    ctx: createPhaseEvaluationContext(snapshot, phaseId),
  }
}

export const getPhaseModeFor = (phase: Phase): PhaseMode<unknown> | undefined =>
  getPhaseMode(phase.mode)

export const isPhaseComplete = (snapshot: PhaseSnapshot, phaseId: string) => {
  const p = buildPhaseContext(snapshot, phaseId)
  return Boolean(p && getPhaseMode(p.phase.mode)?.isComplete(p))
}

/** Lets every phase fill in dependent matches (elimination advancement); a no-op for Swiss. */
export const applyPhaseResolution = <T extends PhaseSnapshot>(snapshot: T): T => {
  let rounds = snapshot.rounds
  snapshot.phases.forEach((phase) => {
    const mode = getPhaseMode(phase.mode)
    if (!mode?.resolveRounds) return
    const p = buildPhaseContext({ ...snapshot, rounds }, phase.id)
    if (!p) return
    const resolved = mode.resolveRounds(p)
    const byNumber = new Map(resolved.map((round) => [round.number, round]))
    rounds = rounds.map((round) => byNumber.get(round.number) ?? round)
  })
  return rounds === snapshot.rounds ? snapshot : { ...snapshot, rounds }
}

/** The phase after the active one when it can be started now: the active phase is complete. */
const getNextPhaseToStart = (snapshot: PhaseSnapshot) => {
  const active = getActivePhase(snapshot)
  const next = snapshot.phases[snapshot.phases.findIndex((phase) => phase.id === active.id) + 1]
  if (!next || next.startedAt || !isPhaseComplete(snapshot, active.id)) return undefined
  const resolver = transitionResolvers[next.entry.kind]
  const mode = getPhaseMode(next.mode)
  return resolver && mode ? { active, next, resolver, mode } : undefined
}

/** The phase that "Start next phase" would start now, if any. */
export const getStartablePhase = (snapshot: PhaseSnapshot): Phase | undefined =>
  getNextPhaseToStart(snapshot)?.next

/** Starts the phase after the active one when the active one is complete. */
export const startNextPhase = <T extends PhaseSnapshot>(snapshot: T): T => {
  const target = getNextPhaseToStart(snapshot)
  if (!target) return snapshot
  const { active, next, resolver, mode } = target
  // Advancing ends the active phase: its last bye counts for the transition.
  const prevBase = buildPhaseContext(snapshot, active.id)!
  const prev = { ...prevBase, ctx: createPhaseEvaluationContext(snapshot, active.id, true) }
  const entrants = resolver(prev, getPhaseMode(active.mode)!.getPlacements(prev), next.entry)
  const phases = snapshot.phases.map((phase) =>
    phase.id === next.id ? { ...phase, entrants, startedAt: new Date().toISOString() } : phase,
  )
  const started = { ...snapshot, phases }
  const firstRoundNumber = Math.max(0, ...snapshot.rounds.map((round) => round.number)) + 1
  const created = mode.initPhase(buildPhaseContext(started, next.id)!, firstRoundNumber)
  return applyPhaseResolution({ ...started, rounds: [...snapshot.rounds, ...created] })
}

const findRound = (snapshot: PhaseSnapshot, number: number) =>
  snapshot.rounds.find((round) => round.number === number)

const replaceRound = (rounds: Round[], replacement: Round) =>
  rounds.map((round) => (round.number === replacement.number ? replacement : round))

/** Plans a round again (reroll) unless scores were entered; returns the full round list. */
export const rerollRoundInSnapshot = (snapshot: PhaseSnapshot, number: number): Round[] => {
  const round = findRound(snapshot, number)
  const p = round && buildPhaseContext(snapshot, round.phaseId)
  const mode = p && getPhaseMode(p.phase.mode)
  if (!round || !p || !mode?.capabilities.reroll) return snapshot.rounds
  if (round.matches.some(hasEnteredScore)) return snapshot.rounds
  const plan = mode.planRound(p, round, { preferredBye: round.bye ?? undefined })
  return replaceRound(snapshot.rounds, {
    ...round,
    bye: plan.bye,
    matches: plan.matches,
    standings: plan.standings,
  })
}

export const rerollByeInSnapshot = (snapshot: PhaseSnapshot, number: number): Round[] => {
  const round = findRound(snapshot, number)
  const p = round && buildPhaseContext(snapshot, round.phaseId)
  const mode = p && getPhaseMode(p.phase.mode)
  if (!round || !p || !mode?.rerollBye || !mode.capabilities.rerollBye) return snapshot.rounds
  return replaceRound(snapshot.rounds, mode.rerollBye(p, round))
}

export const fillUnknownInSnapshot = (snapshot: PhaseSnapshot, number: number): Round[] => {
  const round = findRound(snapshot, number)
  const p = round && buildPhaseContext(snapshot, round.phaseId)
  const mode = p && getPhaseMode(p.phase.mode)
  if (!round || !p || !mode?.fillUnknown || !mode.capabilities.fillUnknown) return snapshot.rounds
  return replaceRound(snapshot.rounds, mode.fillUnknown(p, round))
}
