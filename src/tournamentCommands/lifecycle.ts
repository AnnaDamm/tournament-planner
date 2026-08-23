import {
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  createRoundPlan,
  startRoundInRounds,
  startReadyRounds,
} from '../tournament'
import {
  predictedStartsUpdated,
  scheduledRoundStarted,
  snapshotImported,
  tournamentCleared,
} from '../tournamentSlice'
import type { Round, TournamentSnapshot } from '../tournamentTypes'
import type { TournamentCommand } from './types'

export const deleteAllTournamentData = (): TournamentCommand => (dispatch) => {
  dispatch(tournamentCleared())
}

export const importTournamentSnapshot =
  (snapshot: TournamentSnapshot): TournamentCommand =>
  (dispatch) => {
    dispatch(
      snapshotImported({
        ...snapshot,
        rounds: startReadyRounds(snapshot.rounds, snapshot.courtCount),
      }),
    )
  }

export const startScheduledRound =
  (startAt: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    if (
      state.players.filter((player) => !player.withdrawn).length < 2 ||
      state.rounds.some((round) => round.startedAt)
    )
      return

    const plan = createRoundPlan(state.players, [], 1, undefined, state.defaultSetPoints)
    const existing = state.rounds[0]
    const firstRound = existing
      ? {
          ...existing,
          bye: plan.bye,
          matches: existing.matches.length ? existing.matches : plan.matches,
          standings: plan.standings,
        }
      : {
          number: 1,
          bye: plan.bye,
          winningGames: state.defaultWinningGames,
          courtCount: state.courtCount,
          matches: plan.matches,
          standings: plan.standings,
        }
    const rounds = existing ? [firstRound, ...state.rounds.slice(1)] : [firstRound]
    const startedAt = new Date(startAt).toISOString()
    dispatch(
      scheduledRoundStarted({
        rounds: assignCourtsToMatches(
          startRoundInRounds(rounds, 1, startedAt),
          state.courtCount,
          startedAt,
        ),
        scheduledStart: '',
      }),
    )
  }

export const updatePredictedStarts =
  (scheduledRounds: Round[]): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    let changed = false
    const rounds = state.rounds.map((round, index) => {
      const scheduledRound = scheduledRounds[index]
      if (!scheduledRound) return round
      const matchesChanged = round.matches.some(
        (match, matchIndex) =>
          match.predictedStart !== scheduledRound.matches[matchIndex]?.predictedStart,
      )
      if (!matchesChanged && round.predictedStart === scheduledRound.predictedStart) return round
      changed = true
      return {
        ...round,
        predictedStart: scheduledRound.predictedStart,
        matches: round.matches.map((match, matchIndex) => ({
          ...match,
          predictedStart: scheduledRound.matches[matchIndex]?.predictedStart,
        })),
      }
    })
    if (changed) dispatch(predictedStartsUpdated(rounds))
  }

export const getScheduledRounds = (snapshot: TournamentSnapshot, scheduledStart: string): Round[] =>
  calculateExpectedMatchStarts(
    snapshot.rounds,
    snapshot.courtCount,
    snapshot.expectedDurationMinutes,
    snapshot.breakBetweenMatchesMinutes,
    scheduledStart,
    Math.floor(snapshot.players.filter((player) => !player.withdrawn).length / 2),
  )
