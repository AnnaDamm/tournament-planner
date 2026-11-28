import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import styles from './EliminationBracket.module.css'
import { t } from '../../../i18n'
import { getDecision } from '../../../domain/phases/elimination/advance'
import { getMatchFormat } from '../../../domain/format'
import type { ScoringRules } from '../../../domain/scoring/types'
import type { Match, Round } from '../../../domain/types'
import { getSideLabel, type SideLabelContext } from '../../rounds/sideLabel'

type Props = {
  round: Round
  match: Match
  rules: ScoringRules
  labels: SideLabelContext
}

/** One match of the bracket overview: both sides, the games won and the winner. */
export function BracketMatch({ round, match, rules, labels }: Props) {
  const result = rules.getResult(match, getMatchFormat(round, match))
  const decision = getDecision(rules, round, match)
  const side = (key: 'a' | 'b') => {
    const id = key === 'a' ? match.a : match.b
    const games = result ? (key === 'a' ? result.gamesA : result.gamesB) : ''
    const isWinner = decision?.winner === id
    return (
      <span className={classNames(sharedStyles, styles, isWinner ? 'side winner' : 'side')}>
        <span className={classNames(sharedStyles, styles, 'side-name')}>
          {getSideLabel(match, key, labels)}
        </span>
        <span className={classNames(sharedStyles, styles, 'side-score')}>
          {games}
          {isWinner && (
            <span className={classNames(sharedStyles, 'sr-only')}>
              {' '}
              ({t('eliminationWinnerMark')})
            </span>
          )}
        </span>
      </span>
    )
  }
  return (
    <li className={classNames(sharedStyles, styles, 'match')}>
      <span className={classNames(sharedStyles, styles, 'match-label')}>{match.label}</span>
      {side('a')}
      {side('b')}
    </li>
  )
}
