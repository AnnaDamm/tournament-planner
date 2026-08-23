import {
  assignCourtsToMatches,
  fillUnknownRound,
  getMatchResult,
  rerollBye,
  rerollRound,
  startReadyRounds,
  startRoundInRounds,
} from '../tournament'
import {
  roundByeRerolled,
  roundCreated,
  roundDeleted,
  roundMatchesUpdated,
  roundPlayersSwapped,
  roundRerolled,
  roundSettingsChanged,
  roundStarted,
  roundUnknownParticipantsFilled,
} from '../tournamentSlice'
import type { Match, Participant, Round } from '../tournamentTypes'
import { swapRoundPlayers } from '../tournamentActions'
import type { TournamentCommand } from './types'

const updateRoundSettings = (
  rounds: Round[],
  number: number,
  winningGames: number,
  courtCount: number,
  defaultCourtCount: number,
) =>
  startReadyRounds(
    rounds.map((round) =>
      round.number === number ? { ...round, winningGames, courtCount } : round,
    ),
    defaultCourtCount,
  )

const deleteRoundAndStartReadyRounds = (rounds: Round[], number: number, courtCount: number) =>
  startReadyRounds(
    rounds
      .filter((round) => round.number !== number)
      .map((round) => (round.number > number ? { ...round, number: round.number - 1 } : round)),
    courtCount,
  )

const rerollRoundAndStartReadyRounds = (
  players: Participant[],
  rounds: Round[],
  number: number,
  courtCount: number,
  defaultSetPoints: number,
) => startReadyRounds(rerollRound(players, rounds, number, defaultSetPoints), courtCount)

const rerollByeAndStartReadyRounds = (
  players: Participant[],
  rounds: Round[],
  number: number,
  courtCount: number,
  defaultSetPoints: number,
) => startReadyRounds(rerollBye(players, rounds, number, defaultSetPoints), courtCount)

const fillRoundAndStartReadyRounds = (
  rounds: Round[],
  number: number,
  players: Participant[],
  courtCount: number,
  defaultSetPoints: number,
) => {
  const index = rounds.findIndex((round) => round.number === number)
  if (index < 0) return rounds
  const filled = fillUnknownRound(rounds[index], players, rounds.slice(0, index), defaultSetPoints)
  return startReadyRounds(
    rounds.map((round, roundIndex) => (roundIndex === index ? filled : round)),
    courtCount,
  )
}

export const createRound = (): TournamentCommand => (dispatch, getState) => {
  const state = getState().tournament
  if (state.players.filter((player) => !player.withdrawn).length < 2) return
  const previousRound = state.rounds.at(-1)
  dispatch(
    roundCreated({
      number: state.rounds.length + 1,
      bye: null,
      winningGames: previousRound?.winningGames ?? state.defaultWinningGames,
      courtCount: previousRound?.courtCount ?? state.courtCount,
      matches: [],
    }),
  )
}

export const startRound =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundStarted(
        assignCourtsToMatches(startRoundInRounds(state.rounds, number), state.courtCount),
      ),
    )
  }

export const updateRoundMatches =
  (index: number, matches: Match[]): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    const previousMatches = state.rounds[index]?.matches ?? []
    const completedMatch = matches.some((match) => {
      const previousMatch = previousMatches.find((item) => item.id === match.id)
      const winningGames = Math.max(1, state.rounds[index]?.winningGames || 1)
      return (
        getMatchResult(match, winningGames) && !getMatchResult(previousMatch ?? match, winningGames)
      )
    })
    const nextStart = new Date(
      Date.now() + (completedMatch ? state.breakBetweenMatchesMinutes * 60_000 : 0),
    ).toISOString()
    const rounds = startReadyRounds(
      state.rounds.map((round, roundIndex) =>
        roundIndex === index ? { ...round, matches } : round,
      ),
      state.courtCount,
      nextStart,
    )
    dispatch(roundMatchesUpdated(rounds))
  }

export const updateRoundMatch =
  (index: number, match: Match): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    const currentMatches = state.rounds[index]?.matches ?? []
    const matches = currentMatches.map((currentMatch) =>
      currentMatch.id === match.id ? match : currentMatch,
    )
    dispatch(updateRoundMatches(index, matches))
  }

export const setRoundSettings =
  (number: number, winningGames: number, courtCount: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundSettingsChanged(
        updateRoundSettings(state.rounds, number, winningGames, courtCount, state.courtCount),
      ),
    )
  }

export const deleteRound =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundDeleted(deleteRoundAndStartReadyRounds(state.rounds, number, state.courtCount)))
  }

export const fillUnknown =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundUnknownParticipantsFilled(
        fillRoundAndStartReadyRounds(
          state.rounds,
          number,
          state.players,
          state.courtCount,
          state.defaultSetPoints,
        ),
      ),
    )
  }

export const reroll =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundRerolled(
        rerollRoundAndStartReadyRounds(
          state.players,
          state.rounds,
          number,
          state.courtCount,
          state.defaultSetPoints,
        ),
      ),
    )
  }

export const rerollByeCommand =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundByeRerolled(
        rerollByeAndStartReadyRounds(
          state.players,
          state.rounds,
          number,
          state.courtCount,
          state.defaultSetPoints,
        ),
      ),
    )
  }

export const swapPlayers =
  (roundIndex: number, draggedId: string, targetId: string): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundPlayersSwapped(swapRoundPlayers(state.rounds, roundIndex, draggedId, targetId)))
  }
