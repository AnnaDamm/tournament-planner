import styles from './MatchRow.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarClock, Clock, GitCompareArrows, GripVertical } from 'lucide-react'
import type { Match, SetScore } from '../tournamentTypes'
import { t } from '../i18n'
import {
  getMatchResult,
  getMaxSetCount,
  hasEnteredScore,
  isUnknownParticipantId,
} from '../tournament'
import { SetScores } from './SetScores'

type Props = {
  match: Match
  matchIndex: number
  roundIndex: number
  name: (id: string) => string
  recordA: string
  recordB: string
  onPlayerClick: (id: string) => void
  onCompare: (firstId: string, secondId: string) => void
  onUpdate: (match: Match) => void
  onSwap: (draggedId: string, targetId: string) => void
  selectedParticipantId?: string | null
  onKeyboardSwap: (participantId: string) => void
  keyboardMoveActive?: boolean
  winningGames: number
  isRunning?: boolean
  readOnly?: boolean
}

const isCompleteSet = (set: SetScore) =>
  set.a.trim() !== '' &&
  set.b.trim() !== '' &&
  Number.isFinite(Number(set.a)) &&
  Number.isFinite(Number(set.b)) &&
  Number(set.a) >= 0 &&
  Number(set.b) >= 0 &&
  Number(set.a) !== Number(set.b)

const getSetStats = (sets: SetScore[], winningGames: number) => {
  let winsA = 0
  let winsB = 0
  let completedSets = 0
  let winnerAt = -1

  sets.forEach((set, index) => {
    if (!isCompleteSet(set)) return
    completedSets += 1
    if (Number(set.a) > Number(set.b)) winsA += 1
    if (Number(set.b) > Number(set.a)) winsB += 1
    if (winnerAt === -1 && (winsA >= winningGames || winsB >= winningGames)) {
      winnerAt = index
    }
  })

  return { completedSets, winnerAt }
}

const trimSetsAfterWinner = (sets: SetScore[], winningGames: number) => {
  const { winnerAt } = getSetStats(sets, winningGames)
  if (winnerAt >= 0) return sets.slice(0, winnerAt + 1)
  let lastEnteredIndex = -1
  sets.forEach((set, index) => {
    if (set.a !== '' || set.b !== '') lastEnteredIndex = index
  })
  return lastEnteredIndex >= 0 ? sets.slice(0, lastEnteredIndex + 1) : []
}

const formatStartTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}

// oxlint-disable-next-line eslint/max-lines-per-function
export const MatchRow = memo(function MatchRow({
  match,
  matchIndex,
  roundIndex,
  name,
  recordA,
  recordB,
  onPlayerClick,
  onCompare,
  onUpdate,
  onSwap,
  selectedParticipantId = null,
  onKeyboardSwap,
  keyboardMoveActive = false,
  winningGames,
  isRunning = false,
  readOnly = false,
}: Props) {
  const initialSets = useMemo<SetScore[]>(
    () => (match.sets?.length ? match.sets : [{ a: match.scoreA ?? '', b: match.scoreB ?? '' }]),
    [match.sets, match.scoreA, match.scoreB],
  )
  const [draftSets, setDraftSets] = useState<SetScore[]>(initialSets)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftSetsRef = useRef<SetScore[]>(initialSets)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setDraftSets(initialSets)
    draftSetsRef.current = initialSets
  }, [initialSets])
  const targetWins = Math.max(1, Math.min(99, Number(winningGames) || 1))
  const matchResult = getMatchResult(match, targetWins)
  const canReorder = !readOnly && !hasEnteredScore(match)
  const canKeyboardDropA =
    keyboardMoveActive && selectedParticipantId !== null && selectedParticipantId !== match.a
  const canKeyboardDropB =
    keyboardMoveActive && selectedParticipantId !== null && selectedParticipantId !== match.b
  const { completedSets, winnerAt } = useMemo(
    () => getSetStats(draftSets, targetWins),
    [draftSets, targetWins],
  )
  const maxSetCount = getMaxSetCount(targetWins)
  const finalScore = useMemo(() => {
    if (winnerAt < 0) return null
    return draftSets.slice(0, winnerAt + 1).reduce(
      (score, set) => {
        if (Number(set.a) > Number(set.b)) score.a += 1
        if (Number(set.b) > Number(set.a)) score.b += 1
        return score
      },
      { a: 0, b: 0 },
    )
  }, [draftSets, winnerAt])
  const visibleSetCount = Math.max(
    targetWins,
    Math.min(
      maxSetCount,
      winnerAt >= 0 ? winnerAt + 1 : completedSets >= targetWins ? completedSets + 1 : targetWins,
    ),
  )
  const updateSet = (setIndex: number, side: 'a' | 'b', value: string) => {
    const safeValue =
      value === '' ? '' : String(Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0))
    const nextSets = Array.from(
      { length: Math.max(draftSets.length, setIndex + 1) },
      (_, index) => draftSets[index] ?? { a: '', b: '' },
    ).map((set, index) => (index === setIndex ? { ...set, [side]: safeValue } : set))
    setDraftSets(nextSets)
    draftSetsRef.current = nextSets
  }
  const scheduleCommit = () => {
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      const nextSets = trimSetsAfterWinner(draftSetsRef.current, targetWins)
      const firstSet = nextSets[0] ?? { a: '', b: '' }
      onUpdate({ ...match, sets: nextSets, scoreA: firstSet.a, scoreB: firstSet.b })
    }, 200)
  }
  return (
    <fieldset
      id={`match-${match.id}`}
      className={classNames(sharedStyles, styles, `match ${isRunning ? 'running' : ''}`)}
    >
      <legend className={classNames(sharedStyles, styles, 'sr-only')}>
        {t('matchLabel')} {matchIndex + 1}: {name(match.a)} {t('versus')} {name(match.b)}
        {match.court ? `, ${t('court')} ${match.court}` : ''}
        {isRunning ? `, ${t('running')}` : ''}
      </legend>
      <span className={classNames(sharedStyles, styles, 'match-court')} aria-hidden="true">
        {match.court ?? '–'}
      </span>
      {(match.startedAt || match.predictedStart) && (
        <time
          className={classNames(sharedStyles, styles, 'match-start')}
          dateTime={match.startedAt ?? match.predictedStart}
          title={t(match.startedAt ? 'startedAt' : 'expectedStart')}
        >
          {match.startedAt ? (
            <Clock size={12} aria-hidden="true" />
          ) : (
            <CalendarClock size={12} aria-hidden="true" />
          )}{' '}
          {formatStartTime(match.startedAt ?? match.predictedStart!)}
        </time>
      )}
      {!isUnknownParticipantId(match.a) && !isUnknownParticipantId(match.b) && (
        <button
          className={classNames(sharedStyles, styles, 'compare-button')}
          type="button"
          tabIndex={keyboardMoveActive ? -1 : undefined}
          inert={keyboardMoveActive}
          aria-label={`${t('comparePlayers')}: ${name(match.a)} ${t('versus')} ${name(match.b)}`}
          title={`${t('comparePlayers')}: ${name(match.a)} ${t('versus')} ${name(match.b)}`}
          onClick={() => onCompare(match.a, match.b)}
        >
          <GitCompareArrows size={16} aria-hidden="true" />
        </button>
      )}
      <span
        className={classNames(
          styles,
          `drag-hint match-player match-player-a ${matchResult?.winner === match.a ? 'winner' : ''} ${canReorder ? '' : 'locked'}`,
        )}
        draggable={false}
        onDragOver={(event) => canReorder && event.preventDefault()}
        onDrop={(event) => {
          if (
            canReorder &&
            event.dataTransfer.getData('application/x-courtly-round') === String(roundIndex)
          ) {
            onSwap(event.dataTransfer.getData('text/plain'), match.a)
          }
        }}
      >
        {canReorder && (
          <button
            className={classNames(sharedStyles, styles, 'drag-handle-button')}
            type="button"
            draggable={canReorder && !keyboardMoveActive}
            disabled={keyboardMoveActive && !canKeyboardDropA}
            tabIndex={keyboardMoveActive ? (canKeyboardDropA ? 0 : -1) : undefined}
            data-keyboard-drop-target={canKeyboardDropA ? roundIndex : undefined}
            aria-label={`${t('moveParticipant')}: ${name(match.a)}`}
            title={`${t('moveParticipant')}: ${name(match.a)}`}
            aria-pressed={selectedParticipantId === match.a}
            onClick={() => onKeyboardSwap(match.a)}
            onDragStart={(event) => {
              if (!canReorder || keyboardMoveActive) return
              event.stopPropagation()
              event.dataTransfer.effectAllowed = 'move'
              const dragPreview =
                event.currentTarget.querySelector<HTMLElement>('[data-drag-preview]')
              if (dragPreview) {
                event.dataTransfer.setDragImage(
                  dragPreview,
                  dragPreview.offsetWidth / 2,
                  dragPreview.offsetHeight / 2,
                )
              }
              event.dataTransfer.setData('text/plain', match.a)
              event.dataTransfer.setData('application/x-courtly-round', String(roundIndex))
            }}
          >
            <GripVertical size={16} aria-hidden="true" />
            <span
              className={classNames(sharedStyles, 'drag-preview')}
              data-drag-preview
              aria-hidden="true"
            >
              <GripVertical size={16} aria-hidden="true" />
              <span className={classNames(sharedStyles, 'drag-preview-info')}>
                <span className={classNames(sharedStyles, 'drag-preview-name')}>
                  {name(match.a)}
                </span>
                <small className={classNames(sharedStyles, styles, 'player-record')}>
                  {recordA}
                </small>
              </span>
            </span>
          </button>
        )}
        <span className={classNames(sharedStyles, styles, 'player-info')}>
          <button
            type="button"
            className={classNames(sharedStyles, styles, 'match-player-name')}
            title={`${t('history')}: ${name(match.a)}`}
            tabIndex={keyboardMoveActive ? -1 : undefined}
            inert={keyboardMoveActive}
            onClick={() => onPlayerClick(match.a)}
          >
            {name(match.a)}
          </button>
          <small className={classNames(sharedStyles, styles, 'player-record')}>{recordA}</small>
        </span>
      </span>
      {finalScore ? (
        <span
          className={classNames(sharedStyles, styles, 'match-score')}
          aria-label={`${finalScore.a}:${finalScore.b}`}
        >
          {finalScore.a} : {finalScore.b}
        </span>
      ) : (
        <span className={classNames(sharedStyles, styles, 'versus')} aria-hidden="true">
          VS
        </span>
      )}
      <span
        className={classNames(
          styles,
          `drag-hint match-player match-player-b ${matchResult?.winner === match.b ? 'winner' : ''} ${canReorder ? '' : 'locked'}`,
        )}
        draggable={false}
        onDragOver={(event) => canReorder && event.preventDefault()}
        onDrop={(event) => {
          if (
            canReorder &&
            event.dataTransfer.getData('application/x-courtly-round') === String(roundIndex)
          ) {
            onSwap(event.dataTransfer.getData('text/plain'), match.b)
          }
        }}
      >
        {canReorder && (
          <button
            className={classNames(sharedStyles, styles, 'drag-handle-button')}
            type="button"
            draggable={canReorder && !keyboardMoveActive}
            disabled={keyboardMoveActive && !canKeyboardDropB}
            tabIndex={keyboardMoveActive ? (canKeyboardDropB ? 0 : -1) : undefined}
            data-keyboard-drop-target={canKeyboardDropB ? roundIndex : undefined}
            aria-label={`${t('moveParticipant')}: ${name(match.b)}`}
            title={`${t('moveParticipant')}: ${name(match.b)}`}
            aria-pressed={selectedParticipantId === match.b}
            onClick={() => onKeyboardSwap(match.b)}
            onDragStart={(event) => {
              if (!canReorder || keyboardMoveActive) return
              event.stopPropagation()
              event.dataTransfer.effectAllowed = 'move'
              const dragPreview =
                event.currentTarget.querySelector<HTMLElement>('[data-drag-preview]')
              if (dragPreview) {
                event.dataTransfer.setDragImage(
                  dragPreview,
                  dragPreview.offsetWidth / 2,
                  dragPreview.offsetHeight / 2,
                )
              }
              event.dataTransfer.setData('text/plain', match.b)
              event.dataTransfer.setData('application/x-courtly-round', String(roundIndex))
            }}
          >
            <GripVertical size={16} aria-hidden="true" />
            <span
              className={classNames(sharedStyles, 'drag-preview')}
              data-drag-preview
              aria-hidden="true"
            >
              <GripVertical size={16} aria-hidden="true" />
              <span className={classNames(sharedStyles, 'drag-preview-info')}>
                <span className={classNames(sharedStyles, 'drag-preview-name')}>
                  {name(match.b)}
                </span>
                <small className={classNames(sharedStyles, styles, 'player-record')}>
                  {recordB}
                </small>
              </span>
            </span>
          </button>
        )}
        <span className={classNames(sharedStyles, styles, 'player-info')}>
          <button
            type="button"
            className={classNames(sharedStyles, styles, 'match-player-name')}
            title={`${t('history')}: ${name(match.b)}`}
            tabIndex={keyboardMoveActive ? -1 : undefined}
            inert={keyboardMoveActive}
            onClick={() => onPlayerClick(match.b)}
          >
            {name(match.b)}
          </button>
          <small className={classNames(sharedStyles, styles, 'player-record')}>{recordB}</small>
        </span>
      </span>
      <SetScores
        draftSets={draftSets}
        visibleSetCount={visibleSetCount}
        maxSetCount={maxSetCount}
        readOnly={readOnly}
        playerA={name(match.a)}
        playerB={name(match.b)}
        updateSet={updateSet}
        scheduleCommit={scheduleCommit}
        keyboardMoveActive={keyboardMoveActive}
      />
    </fieldset>
  )
})
