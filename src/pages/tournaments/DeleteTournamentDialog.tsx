import styles from './TournamentsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { t, tf } from '../../i18n'
import { Dialog } from '../../shared/Dialog'

type Props = {
  name: string
  isLast: boolean
  onConfirm: () => void
  /** Called whenever the dialog closes (cancel, escape, backdrop or after confirming). */
  onClose: () => void
}

/** Mount it only while confirming; it opens itself as a modal and focuses the safe action. */
export function DeleteTournamentDialog({ name, isLast, onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => cancelRef.current?.focus(), [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [onClose])

  return (
    <Dialog
      dialogRef={dialogRef}
      labelledBy="delete-tournament-title"
      describedBy="delete-tournament-description"
    >
      <div className={classNames(sharedStyles, styles, 'dialog-head')}>
        <div>
          <h2 id="delete-tournament-title">{t('libraryDeleteDialogTitle')}</h2>
          <p id="delete-tournament-description">
            {tf('libraryDeleteDescription', { name })}
            {isLast && <> {t('libraryDeleteLastHint')}</>}
          </p>
        </div>
        <button
          className={classNames(sharedStyles, styles, 'icon-btn')}
          type="button"
          aria-label={t('close')}
          title={t('close')}
          onClick={() => dialogRef.current?.close()}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={classNames(sharedStyles, styles, 'dialog-actions')}>
        <button
          ref={cancelRef}
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          title={t('cancel')}
          onClick={() => dialogRef.current?.close()}
        >
          {t('cancel')}
        </button>
        <button
          className={classNames(sharedStyles, styles, 'button danger')}
          type="button"
          title={t('libraryDeleteConfirm')}
          onClick={() => {
            onConfirm()
            dialogRef.current?.close()
          }}
        >
          {t('libraryDeleteConfirm')}
        </button>
      </div>
    </Dialog>
  )
}
