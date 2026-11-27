// The only import surface of the characterization tests in src/domain/__golden__.
// It adapts the v2 domain to the original v1-shaped API (v1 rounds with winningGames, plain
// set-point numbers, v1 snapshots), so the committed snapshot files stay byte-identical.
import { createDefaultPhase, createDefaultScoring, DEFAULT_PHASE_ID } from '../domain/defaults'
import { createEvaluationContext, type EvaluationContext } from '../domain/evaluation'
import { isUnknownParticipantId } from '../domain/ids'
import * as pairing from '../domain/phases/swiss/pairing'
import { compareRankingParticipants as compareRanking } from '../domain/ranking/rank'
import * as ranking from '../domain/ranking/rank'
import { DEFAULT_TIE_BREAKERS } from '../domain/ranking/registry'
import * as courts from '../domain/schedule/courts'
import { setsRules } from '../domain/scoring/setsRule'
import { parseTournamentSnapshot as parseSnapshot } from '../domain/snapshot'
import * as standings from '../domain/standings/standings'
import type { Participant, Round } from '../domain/types'
import type { V1Match, V1Participant, V1Round, V1TournamentSnapshot } from '../domain/snapshot/v1'

export type { V1Match as Match, V1Participant as Participant, V1Round as Round }
export type { V1TournamentSnapshot as TournamentSnapshot }
export type RankingParticipant = Omit<V1Participant, 'setsWon' | 'setsLost'> & {
  setsWon: number
  setsLost: number
  lastLossRound: number
}
export { isUnknownParticipantId }
export { sortStats } from '../tournamentStats'

const toV2Round = ({ winningGames, ...round }: V1Round): Round => ({
  ...round,
  phaseId: DEFAULT_PHASE_ID,
  format: { winningGames },
})
const toV1Round = ({ phaseId: _phaseId, format, ...round }: Round): V1Round => ({
  ...round,
  winningGames: format.winningGames,
})
const toV2Rounds = (rounds: V1Round[]) => rounds.map(toV2Round)
const toV1Rounds = (rounds: Round[]) => rounds.map(toV1Round)

const contextFor = (setPoints: number): EvaluationContext =>
  createEvaluationContext({
    scoring: createDefaultScoring({ winningGames: 1, gamePoints: setPoints }),
    tieBreakers: [...DEFAULT_TIE_BREAKERS],
    phases: [createDefaultPhase()],
  })

export const createRoundPlan = (
  players: Participant[],
  previousRounds: V1Round[],
  roundNumber: number,
  preferredBye?: string,
  defaultSetPoints = 21,
) =>
  pairing.createRoundPlan(
    players,
    toV2Rounds(previousRounds),
    { roundNumber, isFirstRound: roundNumber === 1 },
    preferredBye,
    contextFor(defaultSetPoints),
  )

export const fillUnknownRound = (
  round: V1Round,
  players: Participant[],
  previousRounds: V1Round[],
  defaultSetPoints = 21,
) =>
  toV1Round(
    pairing.fillUnknownRound(
      toV2Round(round),
      players,
      toV2Rounds(previousRounds),
      contextFor(defaultSetPoints),
    ),
  )

export const rerollRound = (
  players: Participant[],
  rounds: V1Round[],
  number: number,
  defaultSetPoints = 21,
) =>
  toV1Rounds(pairing.rerollRound(players, toV2Rounds(rounds), number, contextFor(defaultSetPoints)))

export const rerollBye = (
  players: Participant[],
  rounds: V1Round[],
  number: number,
  defaultSetPoints = 21,
) =>
  toV1Rounds(pairing.rerollBye(players, toV2Rounds(rounds), number, contextFor(defaultSetPoints)))

export const calculateStandings = (
  players: Participant[],
  rounds: V1Round[],
  defaultSetPoints = 21,
) => standings.calculateStandings(players, toV2Rounds(rounds), contextFor(defaultSetPoints))

export const calculateStandingsBeforeRounds = (
  players: Participant[],
  rounds: V1Round[],
  defaultSetPoints = 21,
) =>
  standings.calculateStandingsBeforeRounds(
    players,
    toV2Rounds(rounds),
    contextFor(defaultSetPoints),
  )

export const getRankingParticipants = (
  players: Participant[],
  rounds: V1Round[],
  defaultSetPoints = 21,
) => ranking.getRankingParticipants(players, toV2Rounds(rounds), contextFor(defaultSetPoints))

/** Compares v1-shaped ranking rows: their fields are mapped to match points and tie-breaker values. */
export const compareRankingParticipants = (
  first: RankingParticipant,
  second: RankingParticipant,
) => {
  const lift = (item: RankingParticipant) => ({
    ...item,
    draws: 0,
    matchPoints: item.wins,
    tieBreakValues: [
      item.lastLossRound === 0 ? Infinity : item.lastLossRound,
      item.setsWon ?? 0,
      -(item.setsLost ?? 0),
      item.scored,
      -item.conceded,
    ],
  })
  return compareRanking(lift(first), lift(second))
}

export const getMatchResult = (match: V1Match, winningGames: number) => {
  const result = setsRules.getResult(match, { winningGames })
  return result ? { sets: result.games, winner: result.winner } : null
}

export const getVisibleSetCount = (match: V1Match, winningGames: number) =>
  setsRules.getVisibleGameCount(match, { winningGames })

export const startReadyRounds = (rounds: V1Round[], defaultCourtCount = 1, startedAt?: string) =>
  toV1Rounds(courts.startReadyRounds(setsRules, toV2Rounds(rounds), defaultCourtCount, startedAt))

export const assignCourtsToMatches = (
  rounds: V1Round[],
  defaultCourtCount = 1,
  startedAt?: string,
) =>
  toV1Rounds(
    courts.assignCourtsToMatches(setsRules, toV2Rounds(rounds), defaultCourtCount, startedAt),
  )

export const calculateExpectedMatchStarts = (
  rounds: V1Round[],
  ...args: Parameters<typeof courts.calculateExpectedMatchStarts> extends [unknown, ...infer Rest]
    ? Rest
    : never
) => toV1Rounds(courts.calculateExpectedMatchStarts(toV2Rounds(rounds), ...args))

export const getCurrentRoundNumber = (rounds: V1Round[], defaultCourtCount = 1) =>
  courts.getCurrentRoundNumber(setsRules, toV2Rounds(rounds), defaultCourtCount)

/** v1 semantics: only v1 documents are accepted, the result is shown in the v1 shape. */
export const parseTournamentSnapshot = (value: unknown): V1TournamentSnapshot | null => {
  if (typeof value !== 'object' || value === null) return null
  const version = (value as { version?: unknown }).version
  if (version !== undefined && version !== 1) return null
  const snapshot = parseSnapshot(value)
  if (!snapshot) return null
  return {
    version: 1,
    tournamentName: snapshot.tournamentName,
    participantType: snapshot.participantType,
    courtCount: snapshot.courtCount,
    defaultWinningGames: snapshot.scoring.format.winningGames,
    defaultSetPoints: snapshot.scoring.format.gamePoints ?? 21,
    expectedDurationMinutes: snapshot.expectedDurationMinutes,
    breakBetweenMatchesMinutes: snapshot.breakBetweenMatchesMinutes,
    scheduledStart: snapshot.scheduledStart,
    players: snapshot.players.map((player) => ({
      id: player.id,
      name: player.name,
      wins: 0,
      losses: 0,
      scored: 0,
      conceded: 0,
      ...(player.withdrawn === undefined ? {} : { withdrawn: player.withdrawn }),
    })),
    rounds: toV1Rounds(snapshot.rounds),
  }
}
