import { Check, Flag, Pencil, Plus, Undo2, Users, X } from 'lucide-react'
import { useState } from 'react'
import { PageTitle } from './PageTitle'
import { t } from '../i18n'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import type { Round } from '../storage'

export type Participant = {
  id: string
  name: string
  wins: number
  losses: number
  scored: number
  conceded: number
  setsWon?: number
  setsLost?: number
  withdrawn?: boolean
}
type Props = {
  players: Participant[]
  participantLabel: string
  participantPlural: string
  onAdd: () => void
  onDelete: (id: string) => void
  onRename: (player: Participant, name: string) => void
  onToggleWithdraw: (id: string) => void
  rounds: Round[]
  name: (id: string) => string
}

export function Players({
  players,
  participantLabel,
  participantPlural,
  onAdd,
  onDelete,
  onRename,
  onToggleWithdraw,
  rounds,
  name,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<Participant | null>(null)
  const addLabel = participantLabel === t('teams') ? t('addTeam') : t('add')
  const hasDuplicateNames =
    new Set(players.map((player) => player.name.trim().toLocaleLowerCase())).size !== players.length
  return (
    <>
      <PageTitle eyebrow={t('participants')} title={participantLabel}>
        {!editing ? (
          <button className="button ghost" onClick={() => setEditing(true)}>
            <Pencil size={16} /> {t('edit')}
          </button>
        ) : (
          <div className="page-actions">
            <button className="button primary" onClick={onAdd}>
              <Plus size={17} /> {addLabel}
            </button>
            <button className="button ghost" onClick={() => setEditing(false)}>
              <Check size={16} /> {t('done')}
            </button>
          </div>
        )}
      </PageTitle>
      <div className="hero-card">
        <div className="hero-icon">
          <Users size={22} />
        </div>
        <div>
          <b>{t('ready')}</b>
          <p>{t('intro')}</p>
        </div>
        <span className="count-pill">
          {players.length} {participantLabel}
        </span>
      </div>
      <div className="section-head">
        <h2>{participantPlural}</h2>
        <span>
          {players.length} {t('registered')}
        </span>
      </div>
      {hasDuplicateNames && (
        <p className="duplicate-warning" role="alert">
          {t('duplicateWarning')}
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{participantLabel}</th>
              <th>{t('wins')}</th>
              <th>{t('losses')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.id} className={player.withdrawn ? 'withdrawn-row' : ''}>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>
                  {editing ? (
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(event) =>
                        onRename(player, event.currentTarget.textContent?.trim() || player.name)
                      }
                    >
                      {player.name}
                    </span>
                  ) : (
                    <button className="player-name-button" onClick={() => setHistoryPlayer(player)}>
                      {player.name}
                    </button>
                  )}
                  {player.withdrawn && <small className="withdrawn-label">{t('withdrawn')}</small>}
                </td>
                <td>{player.wins}</td>
                <td>{player.losses}</td>
                <td className="player-actions">
                  <button
                    className="status-btn"
                    onClick={() => onToggleWithdraw(player.id)}
                    title={player.withdrawn ? t('undoWithdrawal') : t('withdraw')}
                    aria-label={player.withdrawn ? t('undoWithdrawal') : t('withdraw')}
                  >
                    {player.withdrawn ? <Undo2 size={16} /> : <Flag size={16} />}
                  </button>
                  {editing && (
                    <button
                      className="delete-btn"
                      onClick={() => onDelete(player.id)}
                      title={t('delete')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PlayerHistoryDialog
        player={historyPlayer}
        rounds={rounds}
        name={name}
        onClose={() => setHistoryPlayer(null)}
      />
    </>
  )
}
