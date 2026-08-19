import { useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import type { Match, SetScore } from '../tournamentTypes'
import { t } from '../i18n'
import { getMatchResult, hasEnteredScore } from '../tournament'

type Props = {
  match: Match
  matchIndex: number
  roundIndex: number
  name: (id: string) => string
  record: (id: string) => string
  onPlayerClick: (id: string) => void
  onUpdate: (matches: Match[]) => void
  allMatches: Match[]
  onSwap?: (draggedId: string, targetId: string) => void
  selectedParticipantId?: string | null
  onKeyboardSwap?: (participantId: string) => void
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

export function MatchRow({
  match,
  matchIndex,
  roundIndex,
  name,
  record,
  onPlayerClick,
  onUpdate,
  allMatches,
  onSwap,
  selectedParticipantId = null,
  onKeyboardSwap,
  winningGames,
  isRunning = false,
  readOnly = false,
}: Props) {
  const swapPlayers = (draggedId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    onUpdate(
      allMatches.map((item) => ({
        ...item,
        a: item.a === draggedId ? targetId : item.a === targetId ? draggedId : item.a,
        b: item.b === draggedId ? targetId : item.b === targetId ? draggedId : item.b,
      })),
    )
  }
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
  const targetWins = Math.max(1, Math.min(9, Number(winningGames) || 1))
  const matchResult = getMatchResult(match, targetWins)
  const canReorder = !readOnly && !hasEnteredScore(match)
  const { completedSets, winnerAt } = useMemo(
    () => getSetStats(draftSets, targetWins),
    [draftSets, targetWins],
  )
  const visibleSetCount = Math.max(
    targetWins,
    Math.min(
      targetWins * 2 - 1,
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
      onUpdate(
        allMatches.map((item) =>
          item.id === match.id
            ? { ...item, sets: nextSets, scoreA: firstSet.a, scoreB: firstSet.b }
            : item,
        ),
      )
    }, 200)
  }
  return (
    <fieldset id={`match-${match.id}`} className={`match ${isRunning ? 'running' : ''}`}>
      <legend className="sr-only">
        {t('matchLabel')} {matchIndex + 1}: {name(match.a)} {t('versus')} {name(match.b)}
        {isRunning ? `, ${t('running')}` : ''}
      </legend>
      <span className="match-no" aria-hidden="true">
        {String(matchIndex + 1).padStart(2, '0')}
      </span>
      <span
        className={`drag-hint match-player match-player-a ${matchResult?.winner === match.a ? 'winner' : ''} ${canReorder ? '' : 'locked'}`}
        draggable={canReorder}
        onDragStart={(event) => {
          if (canReorder) {
            event.dataTransfer.setData('text/plain', match.a)
            event.dataTransfer.setData('application/x-courtly-round', String(roundIndex))
          }
        }}
        onDragOver={(event) => canReorder && event.preventDefault()}
        onDrop={(event) => {
          if (
            canReorder &&
            event.dataTransfer.getData('application/x-courtly-round') === String(roundIndex)
          ) {
            ;(onSwap ?? swapPlayers)(event.dataTransfer.getData('text/plain'), match.a)
          }
        }}
      >
        {canReorder && (
          <button
            className="drag-handle-button"
            type="button"
            aria-label={`${t('moveParticipant')}: ${name(match.a)}`}
            aria-pressed={selectedParticipantId === match.a}
            onClick={() => onKeyboardSwap?.(match.a)}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="match-player-name" onClick={() => onPlayerClick(match.a)}>
          {name(match.a)}
        </button>
        <small className="player-record">{record(match.a)}</small>
      </span>
      <span className="versus" aria-hidden="true">
        VS
      </span>
      <span
        className={`drag-hint match-player match-player-b ${matchResult?.winner === match.b ? 'winner' : ''} ${canReorder ? '' : 'locked'}`}
        draggable={canReorder}
        onDragStart={(event) => {
          if (canReorder) {
            event.dataTransfer.setData('text/plain', match.b)
            event.dataTransfer.setData('application/x-courtly-round', String(roundIndex))
          }
        }}
        onDragOver={(event) => canReorder && event.preventDefault()}
        onDrop={(event) => {
          if (
            canReorder &&
            event.dataTransfer.getData('application/x-courtly-round') === String(roundIndex)
          ) {
            ;(onSwap ?? swapPlayers)(event.dataTransfer.getData('text/plain'), match.b)
          }
        }}
      >
        {canReorder && (
          <button
            className="drag-handle-button"
            type="button"
            aria-label={`${t('moveParticipant')}: ${name(match.b)}`}
            aria-pressed={selectedParticipantId === match.b}
            onClick={() => onKeyboardSwap?.(match.b)}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="match-player-name" onClick={() => onPlayerClick(match.b)}>
          {name(match.b)}
        </button>
        <small className="player-record">{record(match.b)}</small>
      </span>
      <div className="set-scores">
        {Array.from(
          { length: visibleSetCount },
          (_, setIndex) => draftSets[setIndex] ?? { a: '', b: '' },
        ).map((set, setIndex) => (
          <div className="score" key={setIndex}>
            <span className="set-label" aria-hidden="true">
              {setIndex + 1}
            </span>
            {readOnly ? (
              <span className="score-value">{set.a || '–'}</span>
            ) : (
              <input
                type="number"
                min="0"
                aria-label={`${t('setScore')} ${setIndex + 1}: ${name(match.a)}`}
                value={set.a}
                onChange={(event) => updateSet(setIndex, 'a', event.target.value)}
                onKeyUp={scheduleCommit}
                onBlur={scheduleCommit}
              />
            )}
            <b aria-hidden="true">:</b>
            {readOnly ? (
              <span className="score-value">{set.b || '–'}</span>
            ) : (
              <input
                type="number"
                min="0"
                aria-label={`${t('setScore')} ${setIndex + 1}: ${name(match.b)}`}
                value={set.b}
                onChange={(event) => updateSet(setIndex, 'b', event.target.value)}
                onKeyUp={scheduleCommit}
                onBlur={scheduleCommit}
              />
            )}
          </div>
        ))}
      </div>
    </fieldset>
  )
}
