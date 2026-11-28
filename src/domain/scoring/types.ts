import type { I18nText, GameScore, Match, MatchFormat, MatchOutcome, ParticipantId } from '../types'

export type ScoringRuleId = 'sets' | 'gamesOnly' | 'singleScore' | 'outcomeOnly' | 'countdown'

export type MatchResult = {
  outcome: MatchOutcome
  winner: ParticipantId | null
  loser: ParticipantId | null
  games: GameScore[] // counted games
  gamesA: number
  gamesB: number
  pointsA: number
  pointsB: number
}

export type ScoringRules = {
  id: ScoringRuleId
  entry: 'games' | 'single' | 'outcome' // drives the score entry UI
  usesGamePoints: boolean
  supportsFixedGames: boolean
  allowsDraw(format: MatchFormat): boolean
  isGameComplete(game: GameScore, format: MatchFormat): boolean
  /** Why an entered game is invalid (shown next to the input); null when it is fine or unfinished. */
  getGameError?(game: GameScore, format: MatchFormat): I18nText | null
  getResult(match: Match, format: MatchFormat): MatchResult | null // null = not finished
  getMaxGameCount(format: MatchFormat): number
  getVisibleGameCount(match: Match, format: MatchFormat): number
  getByeCredit(
    roundFormat: MatchFormat,
    defaults: MatchFormat,
  ): { gamesWon: number; points: number }
}
