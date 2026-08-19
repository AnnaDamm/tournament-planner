import { Check, ChevronDown, Flag, Pencil, Plus, Undo2, X } from 'lucide-react'
import { useState } from 'react'
import { PageTitle } from './PageTitle'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import { t } from '../i18n'
import type { Participant, Round } from '../tournamentTypes'

export type Stat = Participant & {
  diff: number
  points: number
  setsWon: number
  setsLost: number
  played: number
  position: number
}

type Props = {
  sorted: Stat[]
  participantLabel: string
  rounds: Round[]
  name: (id: string) => string
  sort: string
  desc: boolean
  toggleSort: (key: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onRename: (player: Participant, name: string) => void
  onToggleWithdraw: (id: string) => void
}

const formatDifference = (value: number) => (value > 0 ? `+${value}` : String(value))

export function Table({
  sorted,
  participantLabel,
  rounds,
  name,
  sort,
  desc,
  toggleSort,
  onAdd,
  onDelete,
  onRename,
  onToggleWithdraw,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<Participant | null>(null)
  const mostPlayed = Math.max(0, ...sorted.map((player) => player.played))
  const hasDuplicateNames =
    new Set(sorted.map((player) => player.name.trim().toLocaleLowerCase())).size !== sorted.length
  const addLabel = participantLabel === t('teams') ? t('addTeam') : t('add')
  const columns = [
    ['name', participantLabel],
    ['wins', t('wins')],
    ['losses', t('losses')],
    ['played', t('games')],
    ['setsWon', t('sets')],
    ['points', t('points')],
  ]

  return (
    <>
      <PageTitle eyebrow={t('ranking')} title={t('table')}>
        <div className="page-actions">
          <button className="button primary" onClick={onAdd}>
            <Plus size={17} /> {addLabel}
          </button>
          {!editing ? (
            <button className="button ghost" onClick={() => setEditing(true)}>
              <Pencil size={16} /> {t('edit')}
            </button>
          ) : (
            <button className="button ghost" onClick={() => setEditing(false)}>
              <Check size={16} /> {t('done')}
            </button>
          )}
        </div>
      </PageTitle>
      <div className="section-head ranking-participants-head">
        <h2>{participantLabel === t('teams') ? t('allTeams') : t('all')}</h2>
        <span>
          {sorted.length} {t('registered')}
        </span>
      </div>
      {hasDuplicateNames && (
        <p className="duplicate-warning" role="alert">
          {t('duplicateWarning')}
        </p>
      )}
      <div className="table-wrap">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>
                <button
                  className={sort === 'position' ? 'sort-active' : ''}
                  onClick={() => toggleSort('position')}
                >
                  {t('position')}
                  <ChevronDown
                    size={14}
                    className={sort === 'position' && desc ? 'sort-down' : ''}
                  />
                </button>
              </th>
              {columns.map(([key, label]) => (
                <th key={key}>
                  <button
                    className={sort === key ? 'sort-active' : ''}
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <ChevronDown size={14} className={sort === key && desc ? 'sort-down' : ''} />
                  </button>
                </th>
              ))}
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player) => {
              const gamesBehind = mostPlayed - player.played
              return (
                <tr
                  id={`player-${player.id}`}
                  key={player.id}
                  className={player.withdrawn ? 'withdrawn-row' : ''}
                >
                  <td className="rank-cell" data-label={t('position')}>
                    <span className={`rank rank-${player.position} cell-value`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="name-cell" data-label={participantLabel}>
                    {editing ? (
                      <input
                        className="player-name-input"
                        type="text"
                        value={player.name}
                        aria-label={`${t('editName')}: ${player.name}`}
                        onChange={(event) => onRename(player, event.target.value)}
                      />
                    ) : (
                      <button
                        className={
                          player.withdrawn
                            ? 'player-name-button table-player-name withdrawn-name'
                            : 'player-name-button table-player-name'
                        }
                        onClick={() => setHistoryPlayer(player)}
                      >
                        {player.name}
                      </button>
                    )}
                    {player.withdrawn && (
                      <small className="withdrawn-label">{t('withdrawn')}</small>
                    )}
                  </td>
                  <td data-label={t('wins')}>
                    <span className="cell-value">{player.wins}</span>
                  </td>
                  <td data-label={t('losses')}>
                    <span className="cell-value">{player.losses}</span>
                  </td>
                  <td data-label={t('games')}>
                    <span className="cell-value">
                      {player.played}
                      {gamesBehind > 0 && (
                        <small className="games-behind" title={t('fewerGames')}>
                          (-{gamesBehind})
                        </small>
                      )}
                    </span>
                  </td>
                  <td data-label={t('sets')}>
                    <span className="cell-value">
                      {player.setsWon}:{player.setsLost} (
                      {formatDifference(player.setsWon - player.setsLost)})
                    </span>
                  </td>
                  <td data-label={t('points')}>
                    <strong className="cell-value">
                      {player.scored}:{player.conceded} (
                      {formatDifference(player.scored - player.conceded)})
                    </strong>
                  </td>
                  <td className="player-actions" data-label={t('actions')}>
                    <button
                      className="status-btn"
                      onClick={() => onToggleWithdraw(player.id)}
                      title={player.withdrawn ? t('undoWithdrawal') : t('withdraw')}
                      aria-label={player.withdrawn ? t('undoWithdrawal') : t('withdraw')}
                    >
                      {player.withdrawn ? <Undo2 size={16} /> : <Flag size={16} />}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => onDelete(player.id)}
                      title={t('delete')}
                      aria-label={`${t('delete')}: ${player.name}`}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
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
