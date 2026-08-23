import styles from './RoundActions.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { ArrowDown, Calculator, ListPlus, Play, RefreshCw, Settings2, X } from 'lucide-react'
import { t } from '../i18n'
import { hasEnteredScore, isUnknownParticipantId } from '../tournament'
import type { Round } from '../tournamentTypes'

type Props = {
  round: Round
  canCalculatePairings: boolean
  onSettings: () => void
  onStart: () => void
  onFillUnknown: () => void
  onReroll: () => void
  onRerollBye: () => void
  onDelete: () => void
  keyboardMoveActive?: boolean
}

export function RoundActions({
  round,
  canCalculatePairings,
  onSettings,
  onStart,
  onFillUnknown,
  onReroll,
  onRerollBye,
  onDelete,
  keyboardMoveActive = false,
}: Props) {
  const needsPairing = round.matches.length === 0
  const isUnstarted = round.matches.every((match) => !hasEnteredScore(match))
  return (
    <div className={classNames(sharedStyles, styles, 'round-actions')} inert={keyboardMoveActive}>
      <button
        className={classNames(sharedStyles, styles, 'button ghost')}
        type="button"
        aria-label={t('roundSettings')}
        title={t('roundSettings')}
        onClick={onSettings}
      >
        <Settings2 size={16} aria-hidden="true" />
      </button>
      {!round.startedAt && !needsPairing && (
        <button
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          aria-label={t('startRound')}
          title={t('startRound')}
          onClick={onStart}
        >
          <Play size={14} aria-hidden="true" />
        </button>
      )}
      {round.matches.some(
        (match) => isUnknownParticipantId(match.a) || isUnknownParticipantId(match.b),
      ) && (
        <button
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          aria-label={t('fillMore')}
          title={t('fillMore')}
          onClick={onFillUnknown}
        >
          <ListPlus size={16} aria-hidden="true" />
        </button>
      )}
      {needsPairing && canCalculatePairings ? (
        <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
          <button
            className={classNames(sharedStyles, styles, 'button ghost')}
            type="button"
            aria-label={t('calculatePairings')}
            title={t('calculatePairings')}
            onClick={onReroll}
          >
            <span
              className={classNames(sharedStyles, styles, 'pairing-calculate-icon')}
              aria-hidden="true"
            >
              <Calculator size={16} />
              <ArrowDown
                className={classNames(sharedStyles, styles, 'pairing-calculate-arrow')}
                size={9}
              />
            </span>
          </button>
          <div className={classNames(sharedStyles, styles, 'tooltip-popover')} aria-hidden="true">
            {t('calculatePairings')}
          </div>
        </div>
      ) : (
        isUnstarted && (
          <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
            <button
              className={classNames(sharedStyles, styles, 'button ghost')}
              type="button"
              aria-label={t('reroll')}
              title={t('reroll')}
              onClick={onReroll}
            >
              <span
                className={classNames(sharedStyles, styles, 'pairing-calculate-icon')}
                aria-hidden="true"
              >
                <Calculator size={16} />
                <ArrowDown
                  className={classNames(sharedStyles, styles, 'pairing-calculate-arrow')}
                  size={9}
                />
              </span>
            </button>
            <div className={classNames(sharedStyles, styles, 'tooltip-popover')} aria-hidden="true">
              {t('reroll')}
            </div>
          </div>
        )
      )}
      {round.bye && isUnstarted && (
        <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
          <button
            className={classNames(sharedStyles, styles, 'button ghost')}
            type="button"
            aria-label={t('rerollBye')}
            title={t('rerollBye')}
            onClick={onRerollBye}
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
          <div className={classNames(sharedStyles, styles, 'tooltip-popover')} aria-hidden="true">
            {t('rerollBye')}
          </div>
        </div>
      )}
      {!round.matches.some((match) => match.scoreA || match.scoreB) && (
        <button
          className={classNames(sharedStyles, styles, 'button danger')}
          type="button"
          aria-label={t('deleteRound')}
          title={t('deleteRound')}
          onClick={onDelete}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
