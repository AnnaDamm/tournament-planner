import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n'

const clampWinningGames = (value: number) => Math.min(99, Math.max(1, Math.floor(value) || 1))
const clampCourtCount = (value: number) => Math.max(1, Math.floor(value) || 1)
const clampDuration = (value: number) => Math.max(1, Math.floor(value) || 1)
const clampBreak = (value: number) => Math.max(0, Math.floor(value) || 0)

type Props = {
  tournamentName: string
  setTournamentName: (value: string) => void
  participantType: 'players' | 'teams'
  setParticipantType: (value: 'players' | 'teams') => void
  courtCount: number
  setCourtCount: (value: number) => void
  defaultWinningGames: number
  setDefaultWinningGames: (value: number) => void
  scheduledStart: string
  setScheduledStart: (value: string) => void
  expectedDurationMinutes: number
  setExpectedDurationMinutes: (value: number) => void
  breakBetweenMatchesMinutes: number
  setBreakBetweenMatchesMinutes: (value: number) => void
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

// oxlint-disable-next-line eslint/max-lines-per-function
export function SettingsPage({
  tournamentName,
  setTournamentName,
  participantType,
  setParticipantType,
  courtCount,
  setCourtCount,
  defaultWinningGames,
  setDefaultWinningGames,
  scheduledStart,
  setScheduledStart,
  expectedDurationMinutes,
  setExpectedDurationMinutes,
  breakBetweenMatchesMinutes,
  setBreakBetweenMatchesMinutes,
  onExport,
  onImport,
  onDeleteAll,
}: Props) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState(false)

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

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    setImportError(!(await onImport(file)))
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
            <div className="eyebrow">{t('tournament')}</div>
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
        <div className="round-card settings-card">
          <div className="settings-field">
            <label htmlFor="expected-duration">
              <b>{t('expectedDuration')}</b>
              <small>{t('expectedDurationHelp')}</small>
            </label>
            <input
              id="expected-duration"
              key={expectedDurationMinutes}
              type="number"
              min="1"
              defaultValue={expectedDurationMinutes}
              onBlur={(event) => {
                const value = clampDuration(Number(event.currentTarget.value))
                event.currentTarget.value = String(value)
                setExpectedDurationMinutes(value)
              }}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="break-between-matches">
              <b>{t('breakBetweenMatches')}</b>
              <small>{t('breakBetweenMatchesHelp')}</small>
            </label>
            <input
              id="break-between-matches"
              key={breakBetweenMatchesMinutes}
              type="number"
              min="0"
              defaultValue={breakBetweenMatchesMinutes}
              onBlur={(event) => {
                const value = clampBreak(Number(event.currentTarget.value))
                event.currentTarget.value = String(value)
                setBreakBetweenMatchesMinutes(value)
              }}
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
              value={scheduledStart}
              onChange={(event) => setScheduledStart(event.target.value)}
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
              value={tournamentName}
              onChange={(event) => setTournamentName(event.target.value)}
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
              value={participantType}
              onChange={(event) => setParticipantType(event.target.value as 'players' | 'teams')}
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
              key={courtCount}
              type="number"
              min="1"
              defaultValue={courtCount}
              onBlur={(event) => {
                const value = clampCourtCount(Number(event.currentTarget.value))
                event.currentTarget.value = String(value)
                setCourtCount(value)
              }}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="default-winning-games">
              <b>{t('defaultWinningGames')}</b>
              <small>{t('defaultWinningGamesHelp')}</small>
            </label>
            <input
              id="default-winning-games"
              key={defaultWinningGames}
              type="number"
              min="1"
              max="99"
              defaultValue={defaultWinningGames}
              onBlur={(event) => {
                const value = clampWinningGames(Number(event.currentTarget.value))
                event.currentTarget.value = String(value)
                setDefaultWinningGames(value)
              }}
            />
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
        </div>
        <button
          className="button danger delete-all-button"
          onClick={onDeleteAll}
          title={t('deleteAll')}
        >
          {t('deleteAll')}
        </button>
      </section>
    </dialog>
  )
}
