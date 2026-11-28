import { buildPhaseContext, getActivePhase, startFirstPhase } from '../domain/phases/phaseState'
import { getPhaseMode } from '../domain/phases/registry'
import {
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  createEvaluationContext,
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
  (dispatch, getState) => {
    dispatch(
      snapshotImported({
        ...snapshot,
        // An import replaces the content of the active tournament, not its identity.
        id: getState().tournament.id,
        rounds: startReadyRounds(
          createEvaluationContext(snapshot).rules,
          snapshot.rounds,
          snapshot.courtCount,
        ),
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

    // A bracket is created completely when the tournament starts.
    const bracket = startFirstPhase(state)
    const phase = getActivePhase(bracket)
    const mode = getPhaseMode(phase.mode)
    const p = buildPhaseContext(bracket, phase.id)
    if (!mode || !p) return
    const existing = bracket.rounds[0]
    const base: Round = existing ?? {
      number: 1,
      phaseId: phase.id,
      bye: null,
      format: phase.format ?? state.scoring.format,
      courtCount: state.courtCount,
      matches: [],
    }
    const plan = mode.planRound(p, base)
    const firstRound: Round = existing
      ? {
          ...existing,
          bye: plan.bye,
          matches: existing.matches.length ? existing.matches : plan.matches,
          standings: plan.standings,
        }
      : { ...base, bye: plan.bye, matches: plan.matches, standings: plan.standings }
    const rounds = existing ? [firstRound, ...bracket.rounds.slice(1)] : [firstRound]
    const { rules } = p.ctx
    const startedAt = new Date(startAt).toISOString()
    dispatch(
      scheduledRoundStarted({
        rounds: assignCourtsToMatches(
          rules,
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
