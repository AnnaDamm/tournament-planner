import type { MessageKey } from '../i18n'
import type { ScoringRuleId } from './scoring/types'
import type { SportId } from './sports/types'
import type { TieBreakerId } from './ranking/types'

export type ParticipantId = string
export type Member = { id: string; name: string }
export type Participant = {
  id: ParticipantId
  name: string
  withdrawn?: boolean
  members?: Member[]
}

export type GameScore = { a: string; b: string }
export type SetScore = GameScore // legacy alias

export type MatchOutcome = 'a' | 'b' | 'draw'

export type MatchSource =
  | { kind: 'winner' | 'loser'; matchId: string }
  | { kind: 'seed'; seed: number } // 1-based seed within the phase entrants
  | { kind: 'groupRank'; group: string; rank: number }

export type MatchFormat = {
  winningGames: number // games needed to win (best of 2n-1); 1..99
  fixedGames?: number // play exactly N games (draw possible); overrides winningGames
  gamePoints?: number // target per game (21, 25, 501, ...); informational + bye credit default
  noDraws?: boolean // m4/scoring-sports: a winner is required (knockout); overrides draws
}

export type Match = {
  id: string
  a: ParticipantId
  b: ParticipantId
  scoreA: string
  scoreB: string
  court?: number
  sets?: GameScore[]
  predictedStart?: string
  startedAt?: string
  format?: Partial<MatchFormat> // per-match override
  outcome?: MatchOutcome // only for score-less rules
  label?: string // 'M3', 'QF1' (language-neutral)
  group?: string // group label 'A'
  bracket?: 'winners' | 'losers' | 'final' | 'grandFinalReset' | 'thirdPlace' | 'placement'
  places?: [number, number] // placement range decided by this match
  sourceA?: MatchSource
  sourceB?: MatchSource
  lineupA?: ParticipantId[] // per-round drawn teams
  lineupB?: ParticipantId[]
}

export type RoundStanding = {
  participantId: ParticipantId
  wins: number
  draws?: number
  losses: number
  scored: number
  conceded: number
  setsWon: number
  setsLost: number
}

export type I18nText = { key: MessageKey; params?: Record<string, string | number> }

export type Round = {
  number: number // GLOBAL, 1-based, unique across phases (court/schedule code keys on it)
  phaseId: string
  title?: I18nText
  predictedStart?: string
  startedAt?: string
  bye?: ParticipantId | null
  format: MatchFormat
  courtCount?: number
  matches: Match[]
  standings?: RoundStanding[]
}

export type PhaseModeId =
  'swiss' | 'roundRobin' | 'singleElimination' | 'doubleElimination' | 'placement'

export type PhaseTransition =
  | { kind: 'all' }
  | { kind: 'topN'; count: number }
  | { kind: 'topNPerGroup'; count: number; bestRemaining?: number }

export type Phase = {
  id: string
  name: string // '' shows the mode label
  mode: PhaseModeId
  config: unknown // validated by phaseModes[mode].parseConfig
  format?: MatchFormat // default for new rounds of this phase
  tieBreakers?: TieBreakerId[] // overrides the tournament list
  entry: PhaseTransition // ignored for the first phase
  entrants?: ParticipantId[] // seeded order, frozen when the phase starts
  startedAt?: string
}

export type ScoringSettings = {
  sport: SportId
  format: MatchFormat
  matchPoints: { win: number; draw: number; loss: number } // default 1 / 0.5 / 0
  rules?: ScoringRuleId // m4/scoring-sports: overrides the rules of the sport (only where it offers them)
}

export type TeamSettings = { mode: 'fixed' | 'drawOnce' | 'drawEachRound'; teamSize: number }

export type TournamentSettings = {
  tournamentName: string
  participantType: 'players' | 'teams'
  courtCount: number
  expectedDurationMinutes: number
  breakBetweenMatchesMinutes: number
  scheduledStart: string
  scoring: ScoringSettings
  tieBreakers: TieBreakerId[]
  teams: TeamSettings
  phases: Phase[]
}

export type TournamentSnapshot = TournamentSettings & {
  version: 2
  id: string
  players: Participant[]
  rounds: Round[] // flat, ordered, each tagged with phaseId
}
