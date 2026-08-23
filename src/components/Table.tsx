import {
  Check,
  ChevronDown,
  Flag,
  GripVertical,
  Pencil,
  Plus,
  Shuffle,
  Undo2,
  X,
} from 'lucide-react'
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
  players: Participant[]
  defaultCourtCount: number
  defaultSetPoints: number
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
  onReorder: (draggedId: string, targetId: string) => void
  onShuffle: () => void
  canSeed: boolean
  readOnly?: boolean
}

const formatDifference = (value: number) => (value > 0 ? `+${value}` : String(value))
const hasDuplicateParticipantNames = (participants: Participant[]) =>
  new Set(participants.map((participant) => participant.name.trim().toLocaleLowerCase())).size !==
  participants.length
const getColumns = (participantLabel: string) => [
  ['name', participantLabel],
  ['wins', t('wins')],
  ['played', t('games')],
  ['setsWon', t('sets')],
  ['points', t('points')],
]

// oxlint-disable-next-line eslint/max-lines-per-function
export function Table({
  sorted,
  players,
  defaultCourtCount,
  defaultSetPoints,
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
  onReorder,
  onShuffle,
  canSeed,
  readOnly = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<Participant | null>(null)
  const mostPlayed = Math.max(0, ...sorted.map((player) => player.played))
  const hasDuplicateNames = hasDuplicateParticipantNames(sorted)
  return (
    <>
      <PageTitle eyebrow={t('ranking')} title={t('table')}>
        {!readOnly && (
          <div className="page-actions">
            {canSeed && (
              <button className="button ghost" onClick={onShuffle} title={t('shuffle')}>
                <Shuffle size={16} aria-hidden="true" /> {t('shuffle')}
              </button>
            )}
            <button
              className="button primary"
              onClick={onAdd}
              title={participantLabel === t('teams') ? t('addTeam') : t('add')}
            >
              <Plus size={17} aria-hidden="true" />{' '}
              {participantLabel === t('teams') ? t('addTeam') : t('add')}
            </button>
            {!editing ? (
              <button className="button ghost" onClick={() => setEditing(true)} title={t('edit')}>
                <Pencil size={16} aria-hidden="true" /> {t('edit')}
              </button>
            ) : (
              <button className="button ghost" onClick={() => setEditing(false)} title={t('done')}>
                <Check size={16} aria-hidden="true" /> {t('done')}
              </button>
            )}
          </div>
        )}
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
          <caption className="sr-only">{t('rankingTable')}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={sort === 'position' ? (desc ? 'descending' : 'ascending') : 'none'}
              >
                <button
                  className={sort === 'position' ? 'sort-active' : ''}
                  title={t('position')}
                  onClick={() => toggleSort('position')}
                >
                  {t('position')}
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={sort === 'position' && desc ? 'sort-down' : ''}
                  />
                </button>
              </th>
              {getColumns(participantLabel).map(([key, label]) => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={sort === key ? (desc ? 'descending' : 'ascending') : 'none'}
                >
                  <button
                    className={sort === key ? 'sort-active' : ''}
                    title={label}
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className={sort === key && desc ? 'sort-down' : ''}
                    />
                  </button>
                </th>
              ))}
              {!readOnly && <th scope="col">{t('actions')}</th>}
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
                  draggable={canSeed}
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', player.id)}
                  onDragOver={(event) => canSeed && event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const draggedId = event.dataTransfer.getData('text/plain')
                    if (draggedId && draggedId !== player.id) onReorder(draggedId, player.id)
                  }}
                >
                  <td className="rank-cell" data-label={t('position')}>
                    <span className={`rank rank-${player.position} cell-value`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="name-cell" data-label={participantLabel}>
                    {canSeed && <GripVertical className="seed-grip" size={16} aria-hidden="true" />}
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
                        title={`${t('history')}: ${player.name}`}
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
                  {!readOnly && (
                    <td className="player-actions" data-label={t('actions')}>
                      <button
                        className="status-btn"
                        onClick={() => onToggleWithdraw(player.id)}
                        title={player.withdrawn ? t('undoWithdrawal') : t('withdraw')}
                        aria-label={player.withdrawn ? t('undoWithdrawal') : t('withdraw')}
                      >
                        {player.withdrawn ? (
                          <Undo2 size={16} aria-hidden="true" />
                        ) : (
                          <Flag size={16} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => onDelete(player.id)}
                        title={t('delete')}
                        aria-label={`${t('delete')}: ${player.name}`}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <PlayerHistoryDialog
        player={historyPlayer}
        players={players}
        rounds={rounds}
        defaultCourtCount={defaultCourtCount}
        defaultSetPoints={defaultSetPoints}
        name={name}
        onClose={() => setHistoryPlayer(null)}
      />
    </>
  )
}
