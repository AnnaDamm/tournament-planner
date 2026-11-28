import { mergePhasesOnSave } from '../domain/phases/scope'
import { createEvaluationContext } from '../tournament'
import { settingsSaved } from '../tournamentSlice'
import type { TournamentSettings } from '../tournamentTypes'
import { updateRoundsForCourtCount } from '../tournamentActions'
import type { TournamentCommand } from './types'

export const saveTournamentSettings =
  (settings: TournamentSettings): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    const saved = {
      ...settings,
      // Started phases stay as they are; the others keep their entrants and start time.
      phases: mergePhasesOnSave(state.phases, settings.phases, state.rounds),
    }
    const { rules } = createEvaluationContext(saved)
    dispatch(
      settingsSaved({
        settings: saved,
        rounds: updateRoundsForCourtCount(rules, state.rounds, saved.courtCount),
      }),
    )
  }
