import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Participant, Round, TournamentSettings, TournamentSnapshot } from './tournamentTypes'
import { createEmptyTournamentSnapshot } from './storage'

export type SettingsSavedPayload = {
  settings: TournamentSettings
  rounds: Round[]
}

export type ParticipantsReorderedPayload = {
  players: Participant[]
  rounds: Round[]
}

export type ParticipantRenamedPayload = {
  id: string
  name: string
}

export type ScheduledRoundStartedPayload = {
  rounds: Round[]
  scheduledStart: string
}

const tournamentSlice = createSlice({
  name: 'tournament',
  initialState: createEmptyTournamentSnapshot(true),
  reducers: {
    snapshotHydrated: (_state, action: PayloadAction<TournamentSnapshot>) => action.payload,
    snapshotImported: (_state, action: PayloadAction<TournamentSnapshot>) => action.payload,
    settingsSaved: (state, action: PayloadAction<SettingsSavedPayload>) => {
      Object.assign(state, action.payload.settings)
      state.rounds = action.payload.rounds
    },
    participantsAdded: (state, action: PayloadAction<Participant[]>) => {
      state.players = [...state.players, ...action.payload]
    },
    participantDeleted: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter((player) => player.id !== action.payload)
    },
    participantRenamed: (state, action: PayloadAction<ParticipantRenamedPayload>) => {
      const player = state.players.find((item) => item.id === action.payload.id)
      if (player) player.name = action.payload.name
    },
    participantWithdrawalToggled: (state, action: PayloadAction<string>) => {
      const player = state.players.find((item) => item.id === action.payload)
      if (player) player.withdrawn = !player.withdrawn
    },
    participantsReordered: (state, action: PayloadAction<ParticipantsReorderedPayload>) => {
      state.players = action.payload.players
      state.rounds = action.payload.rounds
    },
    roundCreated: (state, action: PayloadAction<Round>) => {
      state.rounds = [...state.rounds, action.payload]
    },
    roundStarted: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundMatchesUpdated: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundSettingsChanged: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundDeleted: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundUnknownParticipantsFilled: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundRerolled: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundByeRerolled: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    roundPlayersSwapped: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
    tournamentCleared: (state) => {
      state.players = []
      state.rounds = []
    },
    scheduledRoundStarted: (state, action: PayloadAction<ScheduledRoundStartedPayload>) => {
      state.rounds = action.payload.rounds
      state.scheduledStart = action.payload.scheduledStart
    },
    predictedStartsUpdated: (state, action: PayloadAction<Round[]>) => {
      state.rounds = action.payload
    },
  },
})

export const {
  snapshotHydrated,
  snapshotImported,
  settingsSaved,
  participantsAdded,
  participantDeleted,
  participantRenamed,
  participantWithdrawalToggled,
  participantsReordered,
  roundCreated,
  roundStarted,
  roundMatchesUpdated,
  roundSettingsChanged,
  roundDeleted,
  roundUnknownParticipantsFilled,
  roundRerolled,
  roundByeRerolled,
  roundPlayersSwapped,
  tournamentCleared,
  scheduledRoundStarted,
  predictedStartsUpdated,
} = tournamentSlice.actions

export const tournamentReducer = tournamentSlice.reducer
