import { getScoringRules } from '../scoring/registry'
import type { ScoringRules } from '../scoring/types'
import type { ScoringSettings } from '../types'
import { badminton, darts, esports, football, other, snooker, volleyball } from './presets'
import type { Sport, SportId } from './types'

// Append-only: one entry line per sport.
export const sports: Sport[] = [other, badminton, volleyball, football, esports, snooker, darts]

export const getSport = (id: SportId): Sport => sports.find((sport) => sport.id === id) ?? other

/** The rules of the sport, or the alternative the sport offers and the settings select. */
export const resolveScoringRules = (
  scoring: Pick<ScoringSettings, 'sport' | 'rules'>,
): ScoringRules => {
  const sport = getSport(scoring.sport)
  const id =
    scoring.rules && sport.alternativeRules?.includes(scoring.rules) ? scoring.rules : sport.rules
  return getScoringRules(id)
}
