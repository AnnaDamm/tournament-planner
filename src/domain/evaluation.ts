import { getMatchFormat } from './format'
import type { ScoringRules } from './scoring/types'
import { getScoringRules } from './scoring/registry'
import { getSport } from './sports/registry'
import type { TieBreakerId } from './ranking/types'
import type { Match, MatchFormat, Round, TournamentSettings } from './types'

export type EvaluationContext = {
  rules: ScoringRules
  scoring: TournamentSettings['scoring']
  tieBreakers: TieBreakerId[]
  defaultFormat: MatchFormat
  /**
   * The bye of this round counts although no later round of the evaluated phase exists: the
   * next phase has started (or is being started), so the phase is final.
   */
  countedByeRound?: number
}

/** Everything needed to evaluate results and rankings, optionally for one phase. */
export const createEvaluationContext = (
  settings: Pick<TournamentSettings, 'scoring' | 'tieBreakers' | 'phases'>,
  phaseId?: string,
): EvaluationContext => {
  const phase = phaseId ? settings.phases.find((item) => item.id === phaseId) : undefined
  return {
    rules: getScoringRules(getSport(settings.scoring.sport).rules),
    scoring: settings.scoring,
    tieBreakers: phase?.tieBreakers ?? settings.tieBreakers,
    defaultFormat: settings.scoring.format,
  }
}

/** The result of a match evaluated with the effective format of its round. */
export const getRoundMatchResult = (
  ctx: Pick<EvaluationContext, 'rules'>,
  round: Round,
  match: Match,
) => ctx.rules.getResult(match, getMatchFormat(round, match))
