import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { t } from '../i18n'
import { getMatchResult, getMatchSets } from '../tournament'
import type { Round } from '../storage'
import type { Participant } from './Players'

type Props = {
  player: Participant | null
  rounds: Round[]
  name: (id: string) => string
  onClose: () => void
}

const formatSets = (playerId: string, match: Round['matches'][number]) =>
  getMatchSets(match)
    .map((set) => {
      const score = `${set.a || '–'}:${set.b || '–'}`
      if (match.a === playerId) return score
      return `${set.b || '–'}:${set.a || '–'}`
    })
    .join(', ')

export function PlayerHistoryDialog({ player, rounds, name, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (player && !dialog.open) dialog.showModal()
    if (!player && dialog.open) dialog.close()
  }, [player])

  const entries = player
    ? rounds.flatMap((round) => {
        const matches = round.matches
          .filter((match) => match.a === player.id || match.b === player.id)
          .map((match) => {
            const opponentId = match.a === player.id ? match.b : match.a
            const result = getMatchResult(match, Math.max(1, round.winningGames || 1))
            const won = result?.winner === player.id
            return {
              key: `${round.number}-${match.id}`,
              round: round.number,
              opponent: name(opponentId),
              score: formatSets(player.id, match),
              outcome: result ? (won ? t('win') : t('loss')) : t('pending'),
              outcomeClass: result ? (won ? 'positive' : 'negative') : '',
            }
          })
        return round.bye === player.id
          ? [
              {
                key: `${round.number}-bye`,
                round: round.number,
                opponent: t('bye'),
                score: '—',
                outcome: t('win'),
                outcomeClass: 'positive',
              },
              ...matches,
            ]
          : matches
      })
    : []

  return (
    <dialog
      ref={dialogRef}
      className="dialog history-dialog"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-head">
        <div>
          <h2>{player?.name}</h2>
          <p>{t('history')}</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')}>
          <X size={18} />
        </button>
      </div>
      <div className="history-table-wrap">
        {entries.length === 0 ? (
          <p className="history-empty">{t('historyEmpty')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('round')}</th>
                <th>{t('opponent')}</th>
                <th>{t('score')}</th>
                <th>{t('result')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.key}>
                  <td>{entry.round}</td>
                  <td>{entry.opponent}</td>
                  <td>{entry.score}</td>
                  <td className={entry.outcomeClass}>{entry.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </dialog>
  )
}
