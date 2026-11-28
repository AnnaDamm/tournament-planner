import { getMatchFormat } from '../format'
import type { Round, TournamentSettings } from '../types'
import type { ScoringRules } from './types'

/** Whether any configured format (tournament, phase, round, match) can end in a draw. */
export const canHaveDraws = (
  rules: ScoringRules,
  settings: Pick<TournamentSettings, 'scoring' | 'phases'>,
  rounds: Round[],
) =>
  [
    settings.scoring.format,
    ...settings.phases.flatMap((phase) => (phase.format ? [phase.format] : [])),
    ...rounds.flatMap((round) => [
      round.format,
      ...round.matches.map((match) => getMatchFormat(round, match)),
    ]),
  ].some((format) => rules.allowsDraw(format))
