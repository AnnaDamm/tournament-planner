import type { AppDispatch, RootState } from '../store'

export type TournamentCommand = (dispatch: AppDispatch, getState: () => RootState) => void
