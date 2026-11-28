import styles from './RoundSettingsDialog.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { t } from '../../i18n'
import type { MatchFormat, Round } from '../../tournamentTypes'
import type { ScoringRuleId } from '../../domain/scoring/types'
import type { SportId } from '../../domain/sports/types'
import { MatchFormatFields } from '../../shared/form/MatchFormatFields'
import { NumberField } from '../../shared/form/NumberField'

type Props = {
  /** Give the component a key per round so its fields start with the values of that round. */
  round: Round | null
  sportId: SportId
  rulesId?: ScoringRuleId
  defaultCourtCount: number
  onSave: (roundNumber: number, format: MatchFormat, courtCount: number) => void
  onClose: () => void
}

export function RoundSettingsDialog({
  round,
  sportId,
  rulesId,
  defaultCourtCount,
  onSave,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [format, setFormat] = useState<MatchFormat>(round?.format ?? { winningGames: 1 })
  const [courtCount, setCourtCount] = useState(round?.courtCount ?? defaultCourtCount)
  const close = () => {
    dialogRef.current?.close()
    onClose()
  }

  useEffect(() => {
    if (round && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [round])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        dialog.close()
        onClose()
      }
    }
    dialog.addEventListener('click', handleBackdropClick)
    return () => dialog.removeEventListener('click', handleBackdropClick)
  }, [onClose])

  if (!round) return null
  const save = () => {
    onSave(round.number, format, courtCount)
    close()
  }

  return (
    <dialog
      ref={dialogRef}
      className={classNames(sharedStyles, styles, 'dialog')}
      aria-labelledby="round-settings-title"
      aria-describedby="round-settings-description"
      onCancel={close}
    >
      <div className={classNames(sharedStyles, styles, 'dialog-head')}>
        <div>
          <h2 id="round-settings-title">{t('roundSettings')}</h2>
          <p id="round-settings-description">
            {t('round')} {String(round.number).padStart(2, '0')}
          </p>
        </div>
        <button
          className={classNames(sharedStyles, styles, 'icon-btn')}
          type="button"
          onClick={close}
          aria-label={t('close')}
          title={t('close')}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={classNames(sharedStyles, styles, 'round-settings-fields')}>
        <MatchFormatFields
          idPrefix="round-format"
          sportId={sportId}
          rulesId={rulesId}
          format={format}
          variant="dialog"
          onChange={setFormat}
        />
        <label htmlFor="round-court-count">
          <span>{t('courts')}</span>
          <NumberField id="round-court-count" value={courtCount} onChange={setCourtCount} />
        </label>
      </div>
      <div className={classNames(sharedStyles, styles, 'dialog-actions')}>
        <button
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          onClick={close}
          title={t('cancel')}
        >
          {t('cancel')}
        </button>
        <button
          className={classNames(sharedStyles, styles, 'button primary')}
          type="button"
          onClick={save}
          title={t('save')}
        >
          {t('save')}
        </button>
      </div>
    </dialog>
  )
}
