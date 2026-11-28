import {
  startFirstPhase as startFirstPhaseInSnapshot,
  startNextPhase as startNextPhaseInSnapshot,
} from '../domain/phases/phaseState'
import { createEvaluationContext, startReadyRounds } from '../tournament'
import { firstPhaseStarted, nextPhaseStarted } from '../tournamentSlice'
import type { TournamentCommand } from './types'

/** Starts the next phase when the active one is complete: resolves entrants and adds its rounds. */
export const startNextPhase = (): TournamentCommand => (dispatch, getState) => {
  const state = getState().tournament
  const next = startNextPhaseInSnapshot(state)
  if (next === state) return
  dispatch(
    nextPhaseStarted({
      phases: next.phases,
      rounds: startReadyRounds(createEvaluationContext(state).rules, next.rounds, state.courtCount),
    }),
  )
}

/** Creates the rounds of the first phase when the mode plans them all at once (brackets). */
export const startFirstPhase = (): TournamentCommand => (dispatch, getState) => {
  const state = getState().tournament
  if (state.players.filter((player) => !player.withdrawn).length < 2) return
  const started = startFirstPhaseInSnapshot(state)
  if (started === state) return
  dispatch(firstPhaseStarted(started.rounds))
}
