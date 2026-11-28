// Barrel for the tournament domain; the logic lives in src/domain.
export { createId, isUnknownParticipantId, UNKNOWN_PARTICIPANT_PREFIX } from './domain/ids'
export { getMatchFormat } from './domain/format'
export {
  getMatchParticipantIds,
  getMatchSideIds,
  hasValidBye,
  isByeCounted,
  isRoundByeCounted,
} from './domain/participants'
export { getMatchGames as getMatchSets, hasEnteredScore } from './domain/scoring/games'
export { getRoundMatchResult, createEvaluationContext } from './domain/evaluation'
export type { EvaluationContext } from './domain/evaluation'
export { calculateStandings, calculateStandingsBeforeRounds } from './domain/standings/standings'
export {
  compareRankingParticipants,
  getRankingParticipants,
  rankParticipants,
} from './domain/ranking/rank'
export type { RankingParticipant } from './domain/ranking/types'
export {
  createRoundPlan,
  fillUnknownRound,
  rerollBye,
  rerollRound,
  sortMatchesByParticipantOrder,
} from './domain/phases/swiss/pairing'
export {
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  getCurrentRoundNumber,
  getRoundCourtCount,
  getRunningMatchIds,
  getRunningMatchIdsByRound,
  isRoundComplete,
  startReadyRounds,
  startRoundInRounds,
} from './domain/schedule/courts'
