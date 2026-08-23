import { configureStore } from '@reduxjs/toolkit'
import type { TournamentSnapshot } from './tournamentTypes'
import { tournamentReducer } from './tournamentSlice'

export const createTournamentStore = (snapshot: TournamentSnapshot) =>
  configureStore({
    reducer: { tournament: tournamentReducer },
    preloadedState: { tournament: snapshot },
  })

export type AppStore = ReturnType<typeof createTournamentStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
