import {
  applyPhaseResolution,
  buildPhaseContext,
  fillUnknownInSnapshot,
  getActivePhase,
  rerollByeInSnapshot,
  rerollRoundInSnapshot,
} from '../domain/phases/phaseState'
import { getPhaseMode } from '../domain/phases/registry'
import {
  assignCourtsToMatches,
  createEvaluationContext,
  getRoundMatchResult,
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
import type { RootState } from '../store'
import type { Match, Round } from '../tournamentTypes'
import { swapRoundPlayers } from '../tournamentActions'
import type { TournamentCommand } from './types'

type State = RootState['tournament']

/** Lets phases resolve dependent matches (no-op for Swiss), then starts rounds that became ready. */
const finishRoundChange = (
  state: State,
  rounds: Round[],
  courtCount = state.courtCount,
  startedAt?: string,
) => {
  const resolved = applyPhaseResolution({ ...state, rounds })
  return startReadyRounds(
    createEvaluationContext(state).rules,
    resolved.rounds,
    courtCount,
    startedAt,
  )
}

const updateRoundSettings = (
  state: State,
  number: number,
  winningGames: number,
  courtCount: number,
) =>
  finishRoundChange(
    state,
    state.rounds.map((round) =>
      round.number === number
        ? { ...round, format: { ...round.format, winningGames }, courtCount }
        : round,
    ),
  )

const deleteRoundAndStartReadyRounds = (state: State, number: number) =>
  finishRoundChange(
    state,
    state.rounds
      .filter((round) => round.number !== number)
      .map((round) => (round.number > number ? { ...round, number: round.number - 1 } : round)),
  )

export const createRound = (): TournamentCommand => (dispatch, getState) => {
  const state = getState().tournament
  if (state.players.filter((player) => !player.withdrawn).length < 2) return
  const phase = getActivePhase(state)
  const mode = getPhaseMode(phase.mode)
  const p = buildPhaseContext(state, phase.id)
  const created = p && mode?.createRound?.(p, state.rounds.length + 1)
  if (!created) return
  dispatch(
    roundCreated({
      ...created,
      courtCount: state.rounds.at(-1)?.courtCount ?? state.courtCount,
    }),
  )
}

export const startRound =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundStarted(
        assignCourtsToMatches(
          createEvaluationContext(state).rules,
          startRoundInRounds(state.rounds, number),
          state.courtCount,
        ),
      ),
    )
  }

export const updateRoundMatches =
  (index: number, matches: Match[]): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    const previousMatches = state.rounds[index]?.matches ?? []
    const ctx = createEvaluationContext(state)
    const round = state.rounds[index]
    const completedMatch = matches.some((match) => {
      const previousMatch = previousMatches.find((item) => item.id === match.id)
      return (
        round &&
        getRoundMatchResult(ctx, round, match) &&
        !getRoundMatchResult(ctx, round, previousMatch ?? match)
      )
    })
    const nextStart = new Date(
      Date.now() + (completedMatch ? state.breakBetweenMatchesMinutes * 60_000 : 0),
    ).toISOString()
    const rounds = finishRoundChange(
      state,
      state.rounds.map((item, roundIndex) => (roundIndex === index ? { ...item, matches } : item)),
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
    dispatch(roundSettingsChanged(updateRoundSettings(state, number, winningGames, courtCount)))
  }

export const deleteRound =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundDeleted(deleteRoundAndStartReadyRounds(state, number)))
  }

export const fillUnknown =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundUnknownParticipantsFilled(
        finishRoundChange(state, fillUnknownInSnapshot(state, number)),
      ),
    )
  }

export const reroll =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundRerolled(finishRoundChange(state, rerollRoundInSnapshot(state, number))))
  }

export const rerollByeCommand =
  (number: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundByeRerolled(finishRoundChange(state, rerollByeInSnapshot(state, number))))
  }

export const swapPlayers =
  (roundIndex: number, draggedId: string, targetId: string): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(
      roundPlayersSwapped(
        swapRoundPlayers(
          createEvaluationContext(state).rules,
          state.rounds,
          roundIndex,
          draggedId,
          targetId,
        ),
      ),
    )
  }
