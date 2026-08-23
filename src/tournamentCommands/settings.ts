import { settingsSaved } from '../tournamentSlice'
import type { TournamentSettings } from '../tournamentTypes'
import { updateRoundsForCourtCount } from '../tournamentActions'
import type { TournamentCommand } from './types'

export const saveTournamentSettings =
  (settings: TournamentSettings): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      settingsSaved({
        settings,
        rounds: updateRoundsForCourtCount(state.rounds, settings.courtCount),
      }),
    )
  }
