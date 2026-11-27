import { createDefaultPhase, createDefaultSettingsParts, DEFAULT_PHASE_ID } from '../defaults'
import { createId } from '../ids'
import type { Participant, Round, TournamentSnapshot } from '../types'
import type { V1TournamentSnapshot } from './v1'

/** Converts a validated v1 snapshot; no behaviour changes, every round joins phase 1. */
export const migrateV1ToV2 = (v1: V1TournamentSnapshot): TournamentSnapshot => ({
  version: 2,
  id: createId(),
  tournamentName: v1.tournamentName,
  participantType: v1.participantType,
  courtCount: v1.courtCount,
  expectedDurationMinutes: v1.expectedDurationMinutes,
  breakBetweenMatchesMinutes: v1.breakBetweenMatchesMinutes,
  scheduledStart: v1.scheduledStart,
  ...createDefaultSettingsParts({
    winningGames: v1.defaultWinningGames,
    gamePoints: v1.defaultSetPoints,
  }),
  phases: [createDefaultPhase()],
  players: v1.players.map((player): Participant => ({
    id: player.id,
    name: player.name,
    ...(player.withdrawn === undefined ? {} : { withdrawn: player.withdrawn }),
  })),
  rounds: v1.rounds.map(({ winningGames, ...round }): Round => ({
    ...round,
    phaseId: DEFAULT_PHASE_ID,
    format: { winningGames },
  })),
})
