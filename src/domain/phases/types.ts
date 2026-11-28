import type { MessageKey } from '../../i18n'
import type { EvaluationContext } from '../evaluation'
import type {
  Match,
  Participant,
  ParticipantId,
  Phase,
  PhaseModeId,
  PhaseTransition,
  Round,
  RoundStanding,
} from '../types'

export type PhaseCapabilities = {
  manualRounds: boolean
  reroll: boolean
  rerollBye: boolean
  swapParticipants: boolean
  fillUnknown: boolean
}

/** Used for rounds whose phase is unknown: nothing can be edited. */
export const noCapabilities: PhaseCapabilities = {
  manualRounds: false,
  reroll: false,
  rerollBye: false,
  swapParticipants: false,
  fillUnknown: false,
}

export type PhaseContext<C> = {
  phase: Phase & { config: C }
  phaseIndex: number
  entrants: Participant[] // seed order, incl. withdrawn (filtered inside, as before)
  rounds: Round[] // this phase's rounds, ordered
  ctx: EvaluationContext
}

export type RoundPlan = {
  bye: ParticipantId | null
  matches: Match[]
  standings?: RoundStanding[]
}

export type Placement = {
  participantId: ParticipantId
  place: number
  placeTo?: number
  group?: string
}

export type PhaseMode<C> = {
  id: PhaseModeId
  labelKey: MessageKey
  capabilities: PhaseCapabilities
  defaultConfig(): C
  parseConfig(raw: unknown): C | null
  initPhase(p: PhaseContext<C>, firstRoundNumber: number): Round[] // swiss: []; KO: full bracket
  createRound?(p: PhaseContext<C>, number: number): Round | null // manualRounds only
  planRound(p: PhaseContext<C>, round: Round, opts?: { preferredBye?: string }): RoundPlan
  fillUnknown?(p: PhaseContext<C>, round: Round): Round
  rerollBye?(p: PhaseContext<C>, round: Round): Round
  resolveRounds?(p: PhaseContext<C>): Round[] // after any result change: fill sources (KO advancement)
  /** True when resolving would change a participant of a match that already has scores. */
  hasResolveConflict?(p: PhaseContext<C>): boolean
  isComplete(p: PhaseContext<C>): boolean
  getPlacements(p: PhaseContext<C>): Placement[] // table + transitions
}

export type TransitionResolver = (
  prev: PhaseContext<unknown>,
  placements: Placement[],
  transition: PhaseTransition,
) => ParticipantId[]
