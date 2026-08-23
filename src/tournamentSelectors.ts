import type { RootState } from './store'

export const selectTournamentSnapshot = (state: RootState) => state.tournament
