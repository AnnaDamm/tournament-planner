import type { MessageKey } from '../../i18n'
import type { EvaluationContext } from '../evaluation'
import type { MatchResult } from '../scoring/types'
import type { Match, Participant, ParticipantId, Round, RoundStanding } from '../types'

export type TieBreakerId =
  | 'lastLoss'
  | 'gamesWon'
  | 'gamesLost'
  | 'pointsScored'
  | 'pointsConceded'
  | 'buchholz'
  | 'medianBuchholz'
  | 'opponentPerformance'

export type CountedResult =
  | { roundNumber: number; kind: 'match'; match: Match; result: MatchResult }
  | { roundNumber: number; kind: 'bye'; participantId: ParticipantId }

export type RankingInput = {
  participants: Participant[]
  rounds: Round[] // counted rounds (phase-local)
  standings: Map<ParticipantId, RoundStanding & { matchPoints: number }>
  results: CountedResult[]
  ctx: EvaluationContext
}

export type TieBreaker = {
  id: TieBreakerId
  labelKey: MessageKey
  descriptionKey: MessageKey
  compute(input: RankingInput): Map<ParticipantId, number> // normalised: HIGHER IS BETTER
}

export type RankingParticipant = Participant &
  Required<Omit<RoundStanding, 'participantId'>> & {
    matchPoints: number
    lastLossRound: number
    tieBreakValues: number[]
  }
