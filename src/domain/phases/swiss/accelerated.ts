import type { EvaluationContext } from '../../evaluation'
import type { Participant, Round } from '../../types'
import type { SwissConfig } from './config'
import { createRoundPlan, type PlannedRound } from './pairing'

export const DEFAULT_ACCELERATED_ROUNDS = 2

/**
 * Baker acceleration: while fewer than `acceleratedRounds` rounds were played, the upper half of
 * the seeding (entry order, withdrawn participants excluded) gets one virtual win. The bonus is
 * used for the pairing only and never appears in the ranking.
 */
export const getVirtualWins = (
  players: Participant[],
  playedRounds: number,
  config: SwissConfig,
): Map<string, number> => {
  const rounds = config.acceleratedRounds ?? DEFAULT_ACCELERATED_ROUNDS
  const active = players.filter((player) => !player.withdrawn)
  if (playedRounds >= rounds) return new Map()
  const topSize = Math.ceil(active.length / 2)
  return new Map(active.slice(0, topSize).map((player) => [player.id, 1]))
}

export const createAcceleratedPlan =
  (config: SwissConfig) =>
  (
    players: Participant[],
    previousRounds: Round[],
    planned: PlannedRound,
    preferredBye: string | undefined,
    ctx: EvaluationContext,
  ) =>
    createRoundPlan(players, previousRounds, planned, preferredBye, ctx, {
      virtualWins: getVirtualWins(players, previousRounds.length, config),
    })
