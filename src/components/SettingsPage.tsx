import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n'

type Props = {
  tournamentName: string
  setTournamentName: (value: string) => void
  participantType: 'players' | 'teams'
  setParticipantType: (value: 'players' | 'teams') => void
  courtCount: number
  setCourtCount: (value: number) => void
  defaultWinningGames: number
  setDefaultWinningGames: (value: number) => void
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

export function SettingsPage({
  tournamentName,
  setTournamentName,
  participantType,
  setParticipantType,
  courtCount,
  setCourtCount,
  defaultWinningGames,
  setDefaultWinningGames,
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
    return () => {
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="round-card settings-card">
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
              type="number"
              min="1"
              value={courtCount}
              onChange={(event) =>
                setCourtCount(Math.max(1, Math.floor(Number(event.target.value) || 1)))
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
              max="9"
              value={defaultWinningGames}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) =>
                setDefaultWinningGames(
                  Math.min(9, Math.max(1, Math.floor(Number(event.target.value) || 1))),
                )
              }
            />
          </div>
          <div className="settings-actions">
            <button className="button ghost" type="button" onClick={onExport}>
              <Download size={16} aria-hidden="true" /> {t('exportData')}
            </button>
            <button
              className="button ghost"
              type="button"
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
        <button className="button danger delete-all-button" onClick={onDeleteAll}>
          {t('deleteAll')}
        </button>
      </section>
    </dialog>
  )
}
