import styles from './RoundSettingsDialog.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { t } from '../../i18n'
import { getMatchFormat } from '../../domain/format'
import type { SportId } from '../../domain/sports/types'
import type { Match, MatchFormat, Round } from '../../tournamentTypes'
import { MatchFormatFields } from '../../shared/form/MatchFormatFields'

type Props = {
  /** Give the component a key per match so its fields start with the values of that match. */
  round: Round | null
  match: Match | null
  title: string
  sportId: SportId
  /** A format saves as an override of the round format; undefined removes the override. */
  onSave: (roundNumber: number, matchId: string, format: MatchFormat | undefined) => void
  onClose: () => void
}

export function MatchSettingsDialog({ round, match, title, sportId, onSave, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [format, setFormat] = useState<MatchFormat>(
    round && match ? getMatchFormat(round, match) : { winningGames: 1 },
  )
  const open = Boolean(round && match)
  const close = () => {
    dialogRef.current?.close()
    onClose()
  }
  const save = (next: MatchFormat | undefined) => {
    if (round && match) onSave(round.number, match.id, next)
    close()
  }

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [open])

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

  if (!round || !match) return null

  return (
    <dialog
      ref={dialogRef}
      className={classNames(sharedStyles, styles, 'dialog')}
      aria-labelledby="match-settings-title"
      aria-describedby="match-settings-description"
      onCancel={close}
    >
      <div className={classNames(sharedStyles, styles, 'dialog-head')}>
        <div>
          <h2 id="match-settings-title">{t('phasesMatchSettings')}</h2>
          <p id="match-settings-description">{title}</p>
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
      <p className={classNames(sharedStyles, styles, 'setting-status')}>
        {t('phasesMatchSettingsHelp')}
      </p>
      <div className={classNames(sharedStyles, styles, 'round-settings-fields')}>
        <MatchFormatFields
          idPrefix="match-format"
          sportId={sportId}
          format={format}
          variant="dialog"
          onChange={setFormat}
        />
      </div>
      <div className={classNames(sharedStyles, styles, 'dialog-actions')}>
        <button
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          onClick={() => save(undefined)}
          title={t('phasesResetFormat')}
        >
          {t('phasesResetFormat')}
        </button>
        <button
          className={classNames(sharedStyles, styles, 'button primary')}
          type="button"
          onClick={() => save(format)}
          title={t('save')}
        >
          {t('save')}
        </button>
      </div>
    </dialog>
  )
}
