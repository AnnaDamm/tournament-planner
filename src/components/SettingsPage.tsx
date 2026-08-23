import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n'
import type { TournamentSettings } from '../tournamentTypes'
import { saveTournamentSettings } from '../tournamentCommands'
import { selectTournamentSettings } from '../tournamentSelectors'
import { useAppDispatch, useAppSelector } from '../storeHooks'

type SettingsDraft = {
  tournamentName: string
  participantType: TournamentSettings['participantType']
  courtCount: string
  defaultWinningGames: string
  defaultSetPoints: string
  scheduledStart: string
  expectedDurationMinutes: string
  breakBetweenMatchesMinutes: string
}

type Props = {
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

const clampWinningGames = (value: number) => Math.min(99, Math.max(1, Math.floor(value) || 1))
const clampPositiveInteger = (value: number) => Math.max(1, Math.floor(value) || 1)
const clampDuration = (value: number) => Math.max(1, Math.floor(value) || 1)
const clampBreak = (value: number) => Math.max(0, Math.floor(value) || 0)

const createDraft = (settings: TournamentSettings): SettingsDraft => ({
  tournamentName: settings.tournamentName,
  participantType: settings.participantType,
  courtCount: String(settings.courtCount),
  defaultWinningGames: String(settings.defaultWinningGames),
  defaultSetPoints: String(settings.defaultSetPoints),
  scheduledStart: settings.scheduledStart,
  expectedDurationMinutes: String(settings.expectedDurationMinutes),
  breakBetweenMatchesMinutes: String(settings.breakBetweenMatchesMinutes),
})

// oxlint-disable-next-line eslint/max-lines-per-function
export function SettingsPage({ onExport, onImport, onDeleteAll }: Props) {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectTournamentSettings)
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<SettingsDraft>(() => createDraft(settings))
  const [importError, setImportError] = useState(false)

  useEffect(() => {
    // The draft mirrors committed settings after imports and live updates.
    // oxlint-disable-next-line react/set-state-in-effect
    setDraft(createDraft(settings))
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
        tournamentName: draft.tournamentName.trim() || 'Tourny',
        participantType: draft.participantType,
        courtCount: clampPositiveInteger(Number(draft.courtCount)),
        defaultWinningGames: clampWinningGames(Number(draft.defaultWinningGames)),
        defaultSetPoints: clampPositiveInteger(Number(draft.defaultSetPoints)),
        scheduledStart: draft.scheduledStart,
        expectedDurationMinutes: clampDuration(Number(draft.expectedDurationMinutes)),
        breakBetweenMatchesMinutes: clampBreak(Number(draft.breakBetweenMatchesMinutes)),
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
      className="settings-modal"
      aria-labelledby="settings-title"
      onCancel={handleCancel}
    >
      <section className="settings-drawer">
        <div className="settings-drawer-head">
          <div>
            <h1 id="settings-title">{t('settings')}</h1>
          </div>
          <button
            className="icon-btn settings-drawer-close"
            type="button"
            aria-label={t('back')}
            title={t('back')}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <form className="round-card settings-card" onSubmit={handleSave}>
          <div className="settings-field">
            <label htmlFor="expected-duration">
              <b>{t('expectedDuration')}</b>
              <small>{t('expectedDurationHelp')}</small>
            </label>
            <input
              id="expected-duration"
              type="number"
              min="1"
              value={draft.expectedDurationMinutes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  expectedDurationMinutes: event.currentTarget.value,
                }))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="break-between-matches">
              <b>{t('breakBetweenMatches')}</b>
              <small>{t('breakBetweenMatchesHelp')}</small>
            </label>
            <input
              id="break-between-matches"
              type="number"
              min="0"
              value={draft.breakBetweenMatchesMinutes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  breakBetweenMatchesMinutes: event.currentTarget.value,
                }))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="scheduled-start">
              <b>{t('scheduledStart')}</b>
              <small>{t('scheduledStartHelp')}</small>
            </label>
            <input
              id="scheduled-start"
              type="datetime-local"
              value={draft.scheduledStart}
              onChange={(event) =>
                setDraft((current) => ({ ...current, scheduledStart: event.target.value }))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="tournament-name">
              <b>{t('tournamentName')}</b>
              <small>{t('tournamentNameHelp')}</small>
            </label>
            <input
              id="tournament-name"
              type="text"
              value={draft.tournamentName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, tournamentName: event.target.value }))
              }
              maxLength={80}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="participant-type">
              <b>{t('type')}</b>
              <small>{t('typeHelp')}</small>
            </label>
            <select
              id="participant-type"
              value={draft.participantType}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  participantType: event.target.value as SettingsDraft['participantType'],
                }))
              }
            >
              <option value="players">{t('players')}</option>
              <option value="teams">{t('teams')}</option>
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="court-count">
              <b>{t('courts')}</b>
              <small>{t('courtsHelp')}</small>
            </label>
            <input
              id="court-count"
              type="number"
              min="1"
              value={draft.courtCount}
              onChange={(event) =>
                setDraft((current) => ({ ...current, courtCount: event.currentTarget.value }))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="default-winning-games">
              <b>{t('defaultWinningGames')}</b>
              <small>{t('defaultWinningGamesHelp')}</small>
            </label>
            <input
              id="default-winning-games"
              type="number"
              min="1"
              max="99"
              value={draft.defaultWinningGames}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultWinningGames: event.currentTarget.value,
                }))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="default-set-points">
              <b>{t('defaultSetPoints')}</b>
              <small>{t('defaultSetPointsHelp')}</small>
            </label>
            <input
              id="default-set-points"
              type="number"
              min="1"
              step="1"
              value={draft.defaultSetPoints}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultSetPoints: event.currentTarget.value,
                }))
              }
            />
          </div>
          <div className="dialog-actions settings-form-actions">
            <button
              className="button ghost"
              type="button"
              onClick={() => navigate(-1)}
              title={t('cancel')}
            >
              {t('cancel')}
            </button>
            <button className="button primary" type="submit" title={t('save')}>
              {t('save')}
            </button>
          </div>
          <div className="settings-actions">
            <button
              className="button ghost"
              type="button"
              onClick={onExport}
              title={t('exportData')}
            >
              <Download size={16} aria-hidden="true" /> {t('exportData')}
            </button>
            <button
              className="button ghost"
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
            <p className="setting-status error" role="alert">
              {t('importError')}
            </p>
          )}
        </form>
        <button
          className="button danger delete-all-button"
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
