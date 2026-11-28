import type { SwissConfig } from './config'
import { createAcceleratedPlan } from './accelerated'
import { createDanishPlan } from './danish'
import { createRoundPlan } from './pairing'

export type SwissPlanner = typeof createRoundPlan

/** One planner per variant; unknown variants fall back to the standard planner. */
export const getSwissPlanner = (config: SwissConfig): SwissPlanner => {
  if (config.variant === 'accelerated') return createAcceleratedPlan(config) as SwissPlanner
  if (config.variant === 'danish') return createDanishPlan as SwissPlanner
  return createRoundPlan
}
