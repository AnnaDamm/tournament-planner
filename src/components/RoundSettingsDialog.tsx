import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { t } from '../i18n'
import type { Round } from '../tournamentTypes'

type Props = {
  round: Round | null
  defaultCourtCount: number
  defaultWinningGames: number
  onSave: (roundNumber: number, winningGames: number, courtCount: number) => void
  onClose: () => void
}

const clampWinningGames = (value: number) => Math.min(9, Math.max(1, Math.floor(value) || 1))
const clampCourtCount = (value: number) => Math.max(1, Math.floor(value) || 1)

export function RoundSettingsDialog({
  round,
  defaultCourtCount,
  defaultWinningGames,
  onSave,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [winningGames, setWinningGames] = useState(round?.winningGames ?? defaultWinningGames)
  const [courtCount, setCourtCount] = useState(round?.courtCount ?? defaultCourtCount)

  useEffect(() => {
    if (round && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [round])

  if (!round) return null

  const close = () => {
    dialogRef.current?.close()
    onClose()
  }
  const save = () => {
    onSave(round.number, clampWinningGames(winningGames), clampCourtCount(courtCount))
    close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="round-settings-title"
      aria-describedby="round-settings-description"
      onCancel={close}
    >
      <div className="dialog-head">
        <div>
          <h2 id="round-settings-title">{t('roundSettings')}</h2>
          <p id="round-settings-description">
            {t('round')} {String(round.number).padStart(2, '0')}
          </p>
        </div>
        <button className="icon-btn" type="button" onClick={close} aria-label={t('close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="round-settings-fields">
        <label htmlFor="round-winning-games">
          <span>{t('winningGames')}</span>
          <input
            id="round-winning-games"
            type="number"
            min="1"
            max="9"
            value={winningGames}
            onChange={(event) => setWinningGames(clampWinningGames(Number(event.target.value)))}
          />
        </label>
        <label htmlFor="round-court-count">
          <span>{t('courts')}</span>
          <input
            id="round-court-count"
            type="number"
            min="1"
            value={courtCount}
            onChange={(event) => setCourtCount(clampCourtCount(Number(event.target.value)))}
          />
        </label>
      </div>
      <div className="dialog-actions">
        <button className="button ghost" type="button" onClick={close}>
          {t('cancel')}
        </button>
        <button className="button primary" type="button" onClick={save}>
          {t('save')}
        </button>
      </div>
    </dialog>
  )
}
