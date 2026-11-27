import { DEFAULT_TIE_BREAKERS } from './ranking/registry'
import { getSport } from './sports/registry'
import { DEFAULT_TEAM_SETTINGS } from './teams/settings'
import type { MatchFormat, Phase, ScoringSettings, TournamentSettings } from './types'

export const DEFAULT_PHASE_ID = 'phase-1'

export const createDefaultScoring = (format?: MatchFormat): ScoringSettings => {
  const defaults = getSport('other').defaults
  return {
    sport: 'other',
    format: { ...(format ?? defaults.format) },
    matchPoints: { ...defaults.matchPoints },
  }
}

export const createDefaultPhase = (): Phase => ({
  id: DEFAULT_PHASE_ID,
  name: '',
  mode: 'swiss',
  config: { variant: 'standard' },
  entry: { kind: 'all' },
})

export const createDefaultSettingsParts = (
  format?: MatchFormat,
): Pick<TournamentSettings, 'scoring' | 'tieBreakers' | 'teams' | 'phases'> => ({
  scoring: createDefaultScoring(format),
  tieBreakers: [...DEFAULT_TIE_BREAKERS],
  teams: { ...DEFAULT_TEAM_SETTINGS },
  phases: [createDefaultPhase()],
})
