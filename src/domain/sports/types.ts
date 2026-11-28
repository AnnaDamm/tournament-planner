import type { MessageKey } from '../../i18n'
import type { ScoringRuleId } from '../scoring/types'
import type { MatchFormat, ScoringSettings } from '../types'

export type SportId =
  'other' | 'badminton' | 'volleyball' | 'football' | 'esports' | 'snooker' | 'darts'

export type TermKey =
  | 'gamesHeader'
  | 'gameScore'
  | 'gamesPlural'
  | 'winningGames'
  | 'winningGamesHelp'
  | 'defaultWinningGames'
  | 'defaultWinningGamesHelp'
  | 'gamePoints'
  | 'gamePointsHelp'
  | 'pointsHeader'
  | 'differenceHeader'

export type Sport = {
  id: SportId
  labelKey: MessageKey
  rules: ScoringRuleId
  defaults: Omit<ScoringSettings, 'sport'>
  terms: Record<TermKey, MessageKey>
  editable: Array<keyof MatchFormat> // which format fields the UI shows
  /** Other rules the user may choose instead of `rules` (stored in scoring.rules). */
  alternativeRules?: ScoringRuleId[]
}
