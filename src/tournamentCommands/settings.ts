import { createEvaluationContext } from '../tournament'
import { settingsSaved } from '../tournamentSlice'
import type { TournamentSettings } from '../tournamentTypes'
import { updateRoundsForCourtCount } from '../tournamentActions'
import type { TournamentCommand } from './types'

export const saveTournamentSettings =
  (settings: TournamentSettings): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    const { rules } = createEvaluationContext(settings)
    dispatch(
      settingsSaved({
        settings,
        rounds: updateRoundsForCourtCount(rules, state.rounds, settings.courtCount),
      }),
    )
  }
