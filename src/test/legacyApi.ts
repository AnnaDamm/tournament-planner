// The only import surface of the characterization tests in src/domain/__golden__.
// Later refactorings adapt this adapter; the snapshot files must stay unchanged.
export {
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  calculateStandings,
  calculateStandingsBeforeRounds,
  compareRankingParticipants,
  createRoundPlan,
  fillUnknownRound,
  getCurrentRoundNumber,
  getMatchResult,
  getRankingParticipants,
  getVisibleSetCount,
  isUnknownParticipantId,
  rerollBye,
  rerollRound,
  startReadyRounds,
} from '../tournament'
export { sortStats } from '../tournamentStats'
export { parseTournamentSnapshot } from '../tournamentSnapshot'
export type { Match, Participant, Round, TournamentSnapshot } from '../tournamentTypes'
