import { snapshotHydrated } from '../tournamentSlice'
import type { TournamentCommand } from './types'

/** Renames the active tournament; persistence updates the stored copy and the library index. */
export const renameActiveTournament =
  (name: string): TournamentCommand =>
  (dispatch, getState) => {
    const tournamentName = name.trim()
    if (tournamentName) dispatch(snapshotHydrated({ ...getState().tournament, tournamentName }))
  }
