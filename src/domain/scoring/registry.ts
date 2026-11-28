import { countdownRules } from './countdownRule'
import { gamesOnlyRules } from './gamesOnlyRule'
import { outcomeOnlyRules } from './outcomeOnlyRule'
import { setsRules } from './setsRule'
import { singleScoreRules } from './singleScoreRule'
import type { ScoringRuleId, ScoringRules } from './types'

// Append-only: one import line and one entry line per rule.
export const scoringRules: Partial<Record<ScoringRuleId, ScoringRules>> = {
  sets: setsRules,
  gamesOnly: gamesOnlyRules,
  singleScore: singleScoreRules,
  outcomeOnly: outcomeOnlyRules,
  countdown: countdownRules,
}

export const getScoringRules = (id: ScoringRuleId): ScoringRules => scoringRules[id] ?? setsRules
