import styles from './RankingsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
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
import { createElement, useState, type KeyboardEvent } from 'react'
import { PageTitle } from '../../shared/PageTitle'
import { PlayerHistoryDialog } from '../../shared/PlayerHistoryDialog'
import { PlayerNameEditor } from './PlayerNameEditor'
import { t } from '../../i18n'
import { useTerm } from '../../i18n/useTerm'
import type { Participant, Phase, Round } from '../../tournamentTypes'
import type { EvaluationContext } from '../../tournament'
import { rankingColumns, type RankingRow } from './columns'
import { phaseViews } from '../phaseViews/registry'
import { getPhaseName } from '../phaseViews/phaseName'
import {
  deleteParticipant,
  reorderParticipants,
  shuffleParticipants,
  toggleParticipantWithdrawal,
} from '../../tournamentCommands'
import { useAppDispatch } from '../../storeHooks'

export type Stat = RankingRow

type Props = {
  sorted: Stat[]
  players: Participant[]
  defaultCourtCount: number
  ctx: EvaluationContext
  participantLabel: string
  phases: Phase[]
  phaseId: string
  onPhaseChange: (phaseId: string) => void
  rounds: Round[]
  name: (id: string) => string
  sort: string
  desc: boolean
  toggleSort: (key: string) => void
  onAdd: () => void
  canSeed: boolean
  readOnly?: boolean
}

const hasDuplicateParticipantNames = (participants: Participant[]) =>
  new Set(participants.map((participant) => participant.name.trim().toLocaleLowerCase())).size !==
  participants.length
// oxlint-disable-next-line eslint/max-lines-per-function
export function RankingsPage({
  sorted,
  players,
  defaultCourtCount,
  ctx,
  participantLabel,
  phases,
  phaseId,
  onPhaseChange,
  rounds,
  name,
  sort,
  desc,
  toggleSort,
  onAdd,
  canSeed,
  readOnly = false,
}: Props) {
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [historyPlayer, setHistoryPlayer] = useState<Participant | null>(null)
  const term = useTerm()
  const mostPlayed = Math.max(0, ...sorted.map((player) => player.played))
  const phase = phases.find((item) => item.id === phaseId)
  const standingsView = phase && phaseViews[phase.mode]?.StandingsView
  const columns = rankingColumns.filter(
    (column) =>
      !column.visible ||
      (phase &&
        column.visible({ rules: ctx.rules, tieBreakers: ctx.tieBreakers, phaseMode: phase.mode })),
  )
  const phaseNotStarted = Boolean(phase) && phase !== phases[0] && !phase?.startedAt
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: phases.length - 1 }[
      event.key
    ]
    if (target === undefined) return
    event.preventDefault()
    const next = phases[(target + phases.length) % phases.length]
    onPhaseChange(next.id)
    document.getElementById(`ranking-phase-tab-${next.id}`)?.focus()
  }
  const hasDuplicateNames = hasDuplicateParticipantNames(sorted)
  return (
    <>
      <PageTitle title={t('table')}>
        {!readOnly && (
          <div className={classNames(sharedStyles, styles, 'page-actions')}>
            {canSeed && (
              <button
                className={classNames(sharedStyles, styles, 'button ghost')}
                onClick={() => dispatch(shuffleParticipants())}
                title={t('shuffle')}
              >
                <Shuffle size={16} aria-hidden="true" /> {t('shuffle')}
              </button>
            )}
            <button
              className={classNames(sharedStyles, styles, 'button primary')}
              onClick={onAdd}
              title={participantLabel === t('teams') ? t('addTeam') : t('add')}
            >
              <Plus size={17} aria-hidden="true" />{' '}
              {participantLabel === t('teams') ? t('addTeam') : t('add')}
            </button>
            {!editing ? (
              <button
                className={classNames(sharedStyles, styles, 'button ghost')}
                onClick={() => setEditing(true)}
                title={t('edit')}
              >
                <Pencil size={16} aria-hidden="true" /> {t('edit')}
              </button>
            ) : (
              <button
                className={classNames(sharedStyles, styles, 'button ghost')}
                onClick={() => setEditing(false)}
                title={t('done')}
              >
                <Check size={16} aria-hidden="true" /> {t('done')}
              </button>
            )}
          </div>
        )}
      </PageTitle>
      <div className={classNames(sharedStyles, styles, 'section-head ranking-participants-head')}>
        <h2>{participantLabel === t('teams') ? t('allTeams') : t('all')}</h2>
        <span>
          {sorted.length} {t('registered')}
        </span>
      </div>
      {hasDuplicateNames && (
        <p className={classNames(sharedStyles, styles, 'duplicate-warning')} role="alert">
          {t('duplicateWarning')}
        </p>
      )}
      {phases.length >= 2 && (
        <div
          className={classNames(sharedStyles, styles, 'phase-tabs')}
          role="tablist"
          aria-label={t('phasesSelector')}
        >
          {phases.map((item, index) => (
            <button
              key={item.id}
              id={`ranking-phase-tab-${item.id}`}
              className={classNames(sharedStyles, styles, 'phase-tab')}
              type="button"
              role="tab"
              aria-selected={item.id === phaseId}
              aria-controls="ranking-phase-panel"
              tabIndex={item.id === phaseId ? 0 : -1}
              onClick={() => onPhaseChange(item.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              {getPhaseName(item)}
            </button>
          ))}
        </div>
      )}
      {phaseNotStarted && (
        <p className={classNames(sharedStyles, styles, 'setting-status')}>
          {t('phasesNotStarted')}
        </p>
      )}
      {standingsView && phase ? (
        createElement(standingsView, { phaseId: phase.id })
      ) : (
        <div
          className={classNames(sharedStyles, styles, 'table-wrap')}
          role={phases.length >= 2 ? 'tabpanel' : undefined}
          id="ranking-phase-panel"
          aria-labelledby={phase ? `ranking-phase-tab-${phase.id}` : undefined}
        >
          <table className={classNames(sharedStyles, styles, 'ranking-table')}>
            <caption className={classNames(sharedStyles, styles, 'sr-only')}>
              {t('rankingTable')}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  aria-sort={sort === 'position' ? (desc ? 'descending' : 'ascending') : 'none'}
                >
                  <button
                    className={classNames(
                      sharedStyles,
                      styles,
                      sort === 'position' ? 'sort-active' : '',
                    )}
                    title={t('position')}
                    onClick={() => toggleSort('position')}
                  >
                    {t('position')}
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className={classNames(
                        sharedStyles,
                        styles,
                        sort === 'position' && desc ? 'sort-down' : '',
                      )}
                    />
                  </button>
                </th>
                {[
                  { id: 'name', label: participantLabel },
                  ...columns.map((column) => ({ id: column.id, label: column.header(term) })),
                ].map(({ id: key, label }) => (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={sort === key ? (desc ? 'descending' : 'ascending') : 'none'}
                  >
                    <button
                      className={classNames(
                        sharedStyles,
                        styles,
                        sort === key ? 'sort-active' : '',
                      )}
                      title={label}
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className={classNames(
                          sharedStyles,
                          styles,
                          sort === key && desc ? 'sort-down' : '',
                        )}
                      />
                    </button>
                  </th>
                ))}
                {!readOnly && (
                  <th className={classNames(sharedStyles, styles, 'actions-heading')} scope="col">
                    {t('actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((player) => {
                return (
                  <tr
                    id={`player-${player.id}`}
                    key={player.id}
                    className={classNames(
                      sharedStyles,
                      styles,
                      player.withdrawn ? 'withdrawn-row' : '',
                    )}
                    draggable={canSeed}
                    onDragStart={(event) => event.dataTransfer.setData('text/plain', player.id)}
                    onDragOver={(event) => canSeed && event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const draggedId = event.dataTransfer.getData('text/plain')
                      if (draggedId && draggedId !== player.id)
                        dispatch(reorderParticipants(draggedId, player.id))
                    }}
                  >
                    <td
                      className={classNames(sharedStyles, styles, 'rank-cell')}
                      data-label={t('position')}
                    >
                      <span
                        className={classNames(
                          sharedStyles,
                          styles,
                          `rank rank-${player.position} cell-value`,
                        )}
                      >
                        {player.position}
                      </span>
                    </td>
                    <td
                      className={classNames(sharedStyles, styles, 'name-cell')}
                      data-label={participantLabel}
                    >
                      {canSeed && (
                        <GripVertical
                          className={classNames(sharedStyles, styles, 'seed-grip')}
                          size={16}
                          aria-hidden="true"
                        />
                      )}
                      {editing ? (
                        <PlayerNameEditor player={player} />
                      ) : (
                        <button
                          className={classNames(
                            styles,
                            player.withdrawn
                              ? 'player-name-button table-player-name withdrawn-name'
                              : 'player-name-button table-player-name',
                          )}
                          title={`${t('history')}: ${player.name}`}
                          onClick={() => setHistoryPlayer(player)}
                        >
                          {player.name}
                        </button>
                      )}
                      {player.withdrawn && (
                        <small className={classNames(sharedStyles, styles, 'withdrawn-label')}>
                          {t('withdrawn')}
                        </small>
                      )}
                    </td>
                    {columns.map((column) => {
                      const Cell = column.strong ? 'strong' : 'span'
                      return (
                        <td key={column.id} data-label={column.header(term)}>
                          <Cell className={classNames(sharedStyles, styles, 'cell-value')}>
                            {column.value(player, { mostPlayed })}
                          </Cell>
                        </td>
                      )
                    })}
                    {!readOnly && (
                      <td
                        className={classNames(sharedStyles, styles, 'player-actions')}
                        data-label={t('actions')}
                      >
                        <button
                          className={classNames(sharedStyles, styles, 'status-btn')}
                          onClick={() => dispatch(toggleParticipantWithdrawal(player.id))}
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
                          className={classNames(sharedStyles, styles, 'delete-btn')}
                          onClick={() => dispatch(deleteParticipant(player.id))}
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
      )}
      <PlayerHistoryDialog
        player={historyPlayer}
        players={players}
        rounds={rounds}
        defaultCourtCount={defaultCourtCount}
        ctx={ctx}
        name={name}
        onClose={() => setHistoryPlayer(null)}
      />
    </>
  )
}
