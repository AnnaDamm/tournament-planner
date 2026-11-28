import styles from './SettingsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../i18n'
import type { TournamentSettings } from '../../tournamentTypes'
import { clampFormat } from '../../domain/format'
import { settingsSections } from './sections'
import { saveTournamentSettings } from '../../tournamentCommands'
import { selectRounds, selectTournamentSettings } from '../../tournamentSelectors'
import { useAppDispatch, useAppSelector } from '../../storeHooks'

type Props = {
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

const sections = [...settingsSections].sort((first, second) => first.order - second.order)

// oxlint-disable-next-line eslint/max-lines-per-function
export function SettingsPage({ onExport, onImport, onDeleteAll }: Props) {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectTournamentSettings)
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const rounds = useAppSelector(selectRounds)
  const [draft, setDraft] = useState<TournamentSettings>(settings)
  const started = rounds.some((round) => round.startedAt)
  const [importError, setImportError] = useState(false)

  useEffect(() => {
    // The draft mirrors committed settings after imports and live updates.
    // oxlint-disable-next-line react/set-state-in-effect
    setDraft(settings)
  }, [settings])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) navigate(-1)
    }
    dialog.addEventListener('click', handleBackdropClick)
    return () => {
      dialog.removeEventListener('click', handleBackdropClick)
      if (dialog.open) dialog.close()
    }
  }, [navigate])

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    navigate(-1)
  }

  const handleSave = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    dispatch(
      saveTournamentSettings({
        ...draft,
        tournamentName: draft.tournamentName.trim() || 'Tourny',
        scoring: { ...draft.scoring, format: clampFormat(draft.scoring.format) },
        phases: draft.phases.map((phase) =>
          phase.format ? { ...phase, format: clampFormat(phase.format) } : phase,
        ),
      }),
    )
    navigate(-1)
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    const imported = await onImport(file)
    setImportError(!imported)
  }

  return (
    <dialog
      ref={dialogRef}
      className={classNames(sharedStyles, styles, 'settings-modal')}
      aria-labelledby="settings-title"
      onCancel={handleCancel}
    >
      <section className={classNames(sharedStyles, styles, 'settings-drawer')}>
        <div className={classNames(sharedStyles, styles, 'settings-drawer-head')}>
          <div>
            <h1 id="settings-title">{t('settings')}</h1>
          </div>
          <button
            className={classNames(sharedStyles, styles, 'icon-btn settings-drawer-close')}
            type="button"
            aria-label={t('back')}
            title={t('back')}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <form
          className={classNames(sharedStyles, styles, 'round-card settings-card')}
          onSubmit={handleSave}
        >
          {sections.map(({ id, Component }) => (
            <Component key={id} draft={draft} setDraft={setDraft} started={started} />
          ))}
          <div className={classNames(sharedStyles, styles, 'dialog-actions settings-form-actions')}>
            <button
              className={classNames(sharedStyles, styles, 'button ghost')}
              type="button"
              onClick={() => navigate(-1)}
              title={t('cancel')}
            >
              {t('cancel')}
            </button>
            <button
              className={classNames(sharedStyles, styles, 'button primary')}
              type="submit"
              title={t('save')}
            >
              {t('save')}
            </button>
          </div>
          <div className={classNames(sharedStyles, styles, 'settings-actions')}>
            <button
              className={classNames(sharedStyles, styles, 'button ghost')}
              type="button"
              onClick={onExport}
              title={t('exportData')}
            >
              <Download size={16} aria-hidden="true" /> {t('exportData')}
            </button>
            <button
              className={classNames(sharedStyles, styles, 'button ghost')}
              type="button"
              title={t('importData')}
              onClick={() => importInputRef.current?.click()}
            >
              <Upload size={16} aria-hidden="true" /> {t('importData')}
            </button>
            <input
              ref={importInputRef}
              aria-label={t('importData')}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (event) => {
                await handleImport(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
          {importError && (
            <p className={classNames(sharedStyles, styles, 'setting-status error')} role="alert">
              {t('importError')}
            </p>
          )}
        </form>
        <button
          className={classNames(sharedStyles, styles, 'button danger delete-all-button')}
          type="button"
          onClick={onDeleteAll}
          title={t('deleteAll')}
        >
          {t('deleteAll')}
        </button>
      </section>
    </dialog>
  )
}
