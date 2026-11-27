import { setsRules } from './setsRule'
import type { ScoringRuleId, ScoringRules } from './types'

// Append-only: one import line and one entry line per rule.
export const scoringRules: Partial<Record<ScoringRuleId, ScoringRules>> = {
  sets: setsRules,
}

export const getScoringRules = (id: ScoringRuleId): ScoringRules => scoringRules[id] ?? setsRules
