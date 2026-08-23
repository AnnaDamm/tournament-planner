import type { RootState } from '../store'
import { hasEnteredScore, rerollRound } from '../tournament'
import {
  participantDeleted,
  participantRenamed,
  participantWithdrawalToggled,
  participantsAdded,
  participantsReordered,
} from '../tournamentSlice'
import { createParticipant } from '../tournamentActions'
import type { Participant } from '../tournamentTypes'
import type { TournamentCommand } from './types'

const updateParticipantOrder = (ordered: Participant[], state: RootState['tournament']) => ({
  players: ordered,
  rounds: state.rounds.some((round) => round.matches.some((match) => hasEnteredScore(match)))
    ? state.rounds
    : rerollRound(ordered, state.rounds, 1, state.defaultSetPoints),
})

export const addParticipants =
  (names: string[]): TournamentCommand =>
  (dispatch) => {
    if (names.length > 0) dispatch(participantsAdded(names.map(createParticipant)))
  }

export const deleteParticipant =
  (id: string): TournamentCommand =>
  (dispatch) => {
    dispatch(participantDeleted(id))
  }

export const renameParticipant =
  (id: string, name: string): TournamentCommand =>
  (dispatch) => {
    dispatch(participantRenamed({ id, name }))
  }

export const toggleParticipantWithdrawal =
  (id: string): TournamentCommand =>
  (dispatch) => {
    dispatch(participantWithdrawalToggled(id))
  }

export const reorderParticipants =
  (draggedId: string, targetId: string): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    const ordered = [...state.players]
    const from = ordered.findIndex((player) => player.id === draggedId)
    const to = ordered.findIndex((player) => player.id === targetId)
    if (from < 0 || to < 0) return
    const [dragged] = ordered.splice(from, 1)
    ordered.splice(to, 0, dragged)
    dispatch(participantsReordered(updateParticipantOrder(ordered, state)))
  }

export const shuffleParticipants = (): TournamentCommand => (dispatch, getState) => {
  const state = getState().tournament
  const ordered = [...state.players]
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]]
  }
  dispatch(participantsReordered(updateParticipantOrder(ordered, state)))
}
