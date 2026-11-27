import type { SwissConfig } from './config'
import { createRoundPlan } from './pairing'

export type SwissPlanner = typeof createRoundPlan

// Append-only: one entry per variant. Unregistered variants fall back to the standard planner.
export const swissVariants: Partial<Record<SwissConfig['variant'], SwissPlanner>> = {
  standard: createRoundPlan,
}
