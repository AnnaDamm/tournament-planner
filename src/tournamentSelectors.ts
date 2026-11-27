import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from './store'
import {
  calculateExpectedMatchStarts,
  calculateStandingsBeforeRounds,
  compareRankingParticipants,
  createEvaluationContext,
  getCurrentRoundNumber,
  getRankingParticipants,
  getRoundMatchResult,
  getRunningMatchIdsByRound,
  isUnknownParticipantId,
} from './tournament'
import { sortStats } from './tournamentStats'
import type { TournamentSettings } from './tournamentTypes'

export const selectTournamentSnapshot = (state: RootState) => state.tournament
export const selectPlayers = (state: RootState) => state.tournament.players
export const selectRounds = (state: RootState) => state.tournament.rounds
export const selectTournamentName = (state: RootState) => state.tournament.tournamentName
export const selectParticipantType = (state: RootState) => state.tournament.participantType
export const selectCourtCount = (state: RootState) => state.tournament.courtCount
export const selectScoring = (state: RootState) => state.tournament.scoring
export const selectTieBreakers = (state: RootState) => state.tournament.tieBreakers
export const selectTeams = (state: RootState) => state.tournament.teams
export const selectPhases = (state: RootState) => state.tournament.phases
export const selectDefaultWinningGames = (state: RootState) =>
  state.tournament.scoring.format.winningGames
export const selectDefaultSetPoints = (state: RootState) =>
  state.tournament.scoring.format.gamePoints ?? 21

export const selectEvaluationContext = createSelector(
  [selectScoring, selectTieBreakers, selectPhases],
  (scoring, tieBreakers, phases) => createEvaluationContext({ scoring, tieBreakers, phases }),
)
export const selectExpectedDurationMinutes = (state: RootState) =>
  state.tournament.expectedDurationMinutes
export const selectBreakBetweenMatchesMinutes = (state: RootState) =>
  state.tournament.breakBetweenMatchesMinutes
export const selectScheduledStart = (state: RootState) => state.tournament.scheduledStart

export const selectTournamentSettings = createSelector(
  [
    selectTournamentName,
    selectParticipantType,
    selectCourtCount,
    selectExpectedDurationMinutes,
    selectBreakBetweenMatchesMinutes,
    selectScheduledStart,
    selectScoring,
    selectTieBreakers,
    selectTeams,
    selectPhases,
  ],
  (
    tournamentName,
    participantType,
    courtCount,
    expectedDurationMinutes,
    breakBetweenMatchesMinutes,
    scheduledStart,
    scoring,
    tieBreakers,
    teams,
    phases,
  ): TournamentSettings => ({
    tournamentName,
    participantType,
    courtCount,
    expectedDurationMinutes,
    breakBetweenMatchesMinutes,
    scheduledStart,
    scoring,
    tieBreakers,
    teams,
    phases,
  }),
)

export const selectStandingsBeforeRounds = createSelector(
  [selectPlayers, selectRounds, selectEvaluationContext],
  (players, rounds, ctx) => calculateStandingsBeforeRounds(players, rounds, ctx),
)

export const selectRankingStats = createSelector(
  [selectPlayers, selectRounds, selectEvaluationContext],
  (players, rounds, ctx) =>
    getRankingParticipants(players, rounds, ctx).map((player) => ({
      ...player,
      played: player.wins + player.draws + player.losses,
      diff: player.scored - player.conceded,
      points: player.scored,
    })),
)

export const selectParticipantOrderByRound = createSelector(
  [selectPlayers, selectRounds, selectEvaluationContext],
  (players, rounds, ctx) =>
    rounds.map((_, roundIndex) => {
      const ranking = getRankingParticipants(players, rounds.slice(0, roundIndex), ctx)
      if (roundIndex > 0) ranking.sort(compareRankingParticipants)
      return ranking.map((player) => player.id)
    }),
)

export const selectSortedParticipants = createSelector(
  [
    selectRankingStats,
    selectRounds,
    (_state: RootState, sort: string) => sort,
    (_state: RootState, _sort: string, desc: boolean) => desc,
  ],
  (stats, rounds, sort, desc) => {
    const positions = new Map(
      (rounds.some((round) => round.startedAt) ? sortStats(stats, 'position', true) : stats).map(
        (player, index) => [player.id, index + 1],
      ),
    )

    return (rounds.some((round) => round.startedAt) ? sortStats(stats, sort, desc) : stats).map(
      (player) => ({
        ...player,
        position: positions.get(player.id) ?? 0,
      }),
    )
  },
)

export const selectScheduledRounds = createSelector(
  [
    selectRounds,
    selectCourtCount,
    selectExpectedDurationMinutes,
    selectBreakBetweenMatchesMinutes,
    selectScheduledStart,
    selectPlayers,
  ],
  (rounds, courtCount, durationMinutes, breakMinutes, scheduledStart, players) => {
    const scheduledRounds = calculateExpectedMatchStarts(
      rounds,
      courtCount,
      durationMinutes,
      breakMinutes,
      scheduledStart,
      Math.floor(players.filter((player) => !player.withdrawn).length / 2),
    )

    return scheduledRounds.map((scheduledRound, roundIndex) => {
      const currentRound = rounds[roundIndex]
      if (!currentRound || currentRound === scheduledRound) return scheduledRound

      const matches = scheduledRound.matches.map((scheduledMatch, matchIndex) => {
        const currentMatch = currentRound.matches[matchIndex]
        return currentMatch?.predictedStart === scheduledMatch.predictedStart
          ? currentMatch
          : scheduledMatch
      })
      const matchesUnchanged = matches.every(
        (match, matchIndex) => match === currentRound.matches[matchIndex],
      )
      return matchesUnchanged && currentRound.predictedStart === scheduledRound.predictedStart
        ? currentRound
        : { ...scheduledRound, matches }
    })
  },
)

export const selectParticipantNames = createSelector([selectPlayers], (players) =>
  players.map((player) => player.name),
)

export const selectParticipantTargets = createSelector([selectPlayers], (players) =>
  players.map((player) => ({
    participantName: player.name,
    participantId: player.id,
  })),
)

export const selectNextMatchTargets = createSelector(
  [selectPlayers, selectRounds, selectCourtCount, selectEvaluationContext],
  (players, rounds, courtCount, ctx) => {
    const runningMatchIds = new Set(
      [...getRunningMatchIdsByRound(ctx.rules, rounds, courtCount).values()].flatMap((ids) => [
        ...ids,
      ]),
    )
    const targetsByParticipant = new Map(players.map((player) => [player.id, [] as string[]]))

    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (getRoundMatchResult(ctx, round, match) || runningMatchIds.has(match.id)) return
        targetsByParticipant.get(match.a)?.push(match.id)
        targetsByParticipant.get(match.b)?.push(match.id)
      })
    })

    return players.flatMap((player) =>
      (targetsByParticipant.get(player.id) ?? []).map((matchId) => ({
        participantName: player.name,
        matchId,
      })),
    )
  },
)

export const selectCurrentRoundNumber = createSelector(
  [selectRounds, selectCourtCount, selectEvaluationContext],
  (rounds, courtCount, ctx) => getCurrentRoundNumber(ctx.rules, rounds, courtCount),
)

export const selectRoundCount = createSelector([selectRounds], (rounds) => rounds.length)

export const selectParticipantName = (state: RootState, id: string) => {
  if (isUnknownParticipantId(id)) return undefined
  return state.tournament.players.find((player) => player.id === id)?.name
}
