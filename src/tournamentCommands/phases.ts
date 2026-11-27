import { startNextPhase as startNextPhaseInSnapshot } from '../domain/phases/phaseState'
import { createEvaluationContext, startReadyRounds } from '../tournament'
import { nextPhaseStarted } from '../tournamentSlice'
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
