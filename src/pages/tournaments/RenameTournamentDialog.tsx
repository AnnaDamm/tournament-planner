import styles from './TournamentsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { X } from 'lucide-react'
import { t } from '../../i18n'
import { Dialog } from '../../shared/Dialog'

type Props = {
  name: string
  onSubmit: (name: string) => void
  /** Called whenever the dialog closes (cancel, escape, backdrop or after saving). */
  onClose: () => void
}

/** Mount it only while renaming; it opens itself as a modal and starts with the current name. */
export function RenameTournamentDialog({ name, onSubmit, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(name)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    inputRef.current?.focus()
    inputRef.current?.select()
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [onClose])

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    onSubmit(value)
    dialogRef.current?.close()
  }

  return (
    <Dialog dialogRef={dialogRef} labelledBy="rename-tournament-title">
      <form onSubmit={submit}>
        <div className={classNames(sharedStyles, styles, 'dialog-head')}>
          <h2 id="rename-tournament-title">{t('libraryRenameDialogTitle')}</h2>
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
        <div className={classNames(sharedStyles, styles, 'library-field')}>
          <label htmlFor="rename-tournament-name">{t('libraryRenameLabel')}</label>
          <input
            id="rename-tournament-name"
            type="text"
            value={value}
            maxLength={80}
            required
            ref={inputRef}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <div className={classNames(sharedStyles, styles, 'dialog-actions')}>
          <button
            className={classNames(sharedStyles, styles, 'button ghost')}
            type="button"
            title={t('cancel')}
            onClick={() => dialogRef.current?.close()}
          >
            {t('cancel')}
          </button>
          <button
            className={classNames(sharedStyles, styles, 'button primary')}
            type="submit"
            title={t('libraryRename')}
          >
            {t('libraryRename')}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
