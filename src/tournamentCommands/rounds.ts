import {
  applyPhaseResolution,
  buildPhaseContext,
  fillUnknownInSnapshot,
  getActivePhase,
  rerollByeInSnapshot,
  rerollRoundInSnapshot,
} from '../domain/phases/phaseState'
import { getPhaseMode } from '../domain/phases/registry'
import { clampFormat } from '../domain/format'
import {
  assignCourtsToMatches,
  createEvaluationContext,
  getRoundMatchResult,
  hasEnteredScore,
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
import type { Match, MatchFormat, Round } from '../tournamentTypes'
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

const updateRoundFormat = (state: State, number: number, format: MatchFormat, courtCount: number) =>
  finishRoundChange(
    state,
    state.rounds.map((round) =>
      round.number === number
        ? { ...round, format: clampFormat(format, round.format), courtCount }
        : round,
    ),
  )

/** Keeps only the fields of an override that differ from the round format. */
const toMatchOverride = (round: Round, format: Partial<MatchFormat> | undefined) => {
  const clamped = format && clampFormat(format, round.format)
  const override = Object.fromEntries(
    Object.entries(clamped ?? {}).filter(
      ([key, value]) => value !== round.format[key as keyof MatchFormat],
    ),
  ) as Partial<MatchFormat>
  return Object.keys(override).length > 0 ? override : undefined
}

const updateMatchFormat = (
  state: State,
  number: number,
  matchId: string,
  format: Partial<MatchFormat> | undefined,
) =>
  finishRoundChange(
    state,
    state.rounds.map((round) =>
      round.number === number
        ? {
            ...round,
            matches: round.matches.map((match) => {
              if (match.id !== matchId || hasEnteredScore(match)) return match
              const { format: _previous, ...rest } = match
              const override = toMatchOverride(round, format)
              return override ? { ...rest, format: override } : rest
            }),
          }
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

export const setRoundFormat =
  (number: number, format: MatchFormat, courtCount: number): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundSettingsChanged(updateRoundFormat(state, number, format, courtCount)))
  }

/** Sets (or, with undefined, clears) the format override of one match that has no score yet. */
export const setMatchFormat =
  (number: number, matchId: string, format: Partial<MatchFormat> | undefined): TournamentCommand =>
  (dispatch, getState) => {
    const state = getState().tournament
    dispatch(roundSettingsChanged(updateMatchFormat(state, number, matchId, format)))
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
