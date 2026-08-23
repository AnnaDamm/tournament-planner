import styles from './RoundSection.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { CalendarClock, Clock, GripVertical } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { MatchRow } from './MatchRow'
import { RoundActions } from './RoundActions'
import { t } from '../i18n'
import { isRoundComplete, sortMatchesByParticipantOrder } from '../tournament'
import type { Match, Round } from '../tournamentTypes'

type Props = {
  round: Round
  roundIndex: number
  nextRoundStarted: boolean
  canCalculatePairings: boolean
  participantOrder: string[]
  currentRoundNumber: number | undefined
  runningMatchIds: Set<string>
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  onPlayerClick: (id: string) => void
  onCompare: (firstId: string, secondId: string, roundIndex: number) => void
  onUpdate: (roundIndex: number, match: Match) => void
  onSettings: (roundNumber: number) => void
  onStart: (roundNumber: number) => void
  onFillUnknown: (roundNumber: number) => void
  onReroll: (roundNumber: number) => void
  onRerollBye: (roundNumber: number) => void
  onDelete: (roundNumber: number) => void
  onSwapPlayers: (roundIndex: number, draggedId: string, targetId: string) => void
  keyboardMove: { roundIndex: number; participantId: string } | null
  onKeyboardSwap: (roundIndex: number, participantId: string) => void
  readOnly: boolean
}

export const RoundSection = memo(function RoundSection({
  round,
  roundIndex,
  nextRoundStarted,
  canCalculatePairings,
  participantOrder,
  currentRoundNumber,
  runningMatchIds,
  name,
  record,
  onPlayerClick,
  onCompare,
  onUpdate,
  onSettings,
  onStart,
  onFillUnknown,
  onReroll,
  onRerollBye,
  onDelete,
  onSwapPlayers,
  keyboardMove,
  onKeyboardSwap,
  readOnly,
}: Props) {
  const canReorderBye = !readOnly && !nextRoundStarted && !isRoundComplete(round)
  const isCurrentRound = runningMatchIds.size > 0
  const orderedMatches = useMemo(
    () => sortMatchesByParticipantOrder(round.matches, participantOrder),
    [participantOrder, round.matches],
  )
  const getRecord = useCallback((id: string) => record(roundIndex, id), [record, roundIndex])
  const handleCompare = useCallback(
    (firstId: string, secondId: string) => onCompare(firstId, secondId, roundIndex),
    [onCompare, roundIndex],
  )
  const handleUpdate = useCallback(
    (match: Match) => onUpdate(roundIndex, match),
    [onUpdate, roundIndex],
  )
  const handleSettings = useCallback(() => onSettings(round.number), [onSettings, round.number])
  const handleStart = useCallback(() => onStart(round.number), [onStart, round.number])
  const handleFillUnknown = useCallback(
    () => onFillUnknown(round.number),
    [onFillUnknown, round.number],
  )
  const handleReroll = useCallback(() => onReroll(round.number), [onReroll, round.number])
  const handleRerollBye = useCallback(() => onRerollBye(round.number), [onRerollBye, round.number])
  const handleDelete = useCallback(() => onDelete(round.number), [onDelete, round.number])
  const handleSwapPlayers = useCallback(
    (draggedId: string, targetId: string) => onSwapPlayers(roundIndex, draggedId, targetId),
    [onSwapPlayers, roundIndex],
  )
  const handleKeyboardSwap = useCallback(
    (participantId: string) => onKeyboardSwap(roundIndex, participantId),
    [onKeyboardSwap, roundIndex],
  )

  return (
    <section
      className={classNames(
        sharedStyles,
        styles,
        `round-card ${isCurrentRound ? 'current-round' : ''}`,
      )}
      aria-labelledby={`round-${round.number}-title`}
    >
      <div className={classNames(sharedStyles, styles, 'round-head')}>
        <div>
          {round.number === currentRoundNumber && (
            <div className={classNames(sharedStyles, styles, 'current-round-label')}>
              {t('currentRound')}
            </div>
          )}
          <span className={classNames(sharedStyles, styles, 'round-kicker')}>
            <span aria-hidden="true">
              {t('round')} {String(round.number).padStart(2, '0')}
            </span>
            {(round.startedAt || round.predictedStart) && (
              <time
                className={classNames(sharedStyles, styles, 'round-started')}
                dateTime={round.startedAt ?? round.predictedStart}
                title={t(round.startedAt ? 'startedAt' : 'expectedStart')}
              >
                {round.startedAt ? (
                  <Clock size={12} aria-hidden="true" />
                ) : (
                  <CalendarClock size={12} aria-hidden="true" />
                )}{' '}
                {formatStartTime(round.startedAt ?? round.predictedStart!)}
              </time>
            )}
          </span>
          <div className={classNames(sharedStyles, styles, 'round-title-line')}>
            <h2 id={`round-${round.number}-title`}>
              <span className={classNames(sharedStyles, styles, 'sr-only')}>
                {t('round')} {round.number} –
              </span>
            </h2>
            {round.bye && (
              <span
                className={classNames(
                  sharedStyles,
                  styles,
                  `bye-pill ${canReorderBye ? '' : 'locked'}`,
                )}
                draggable={canReorderBye}
                onDragStart={(event) => {
                  if (!canReorderBye) return
                  event.dataTransfer.setData('text/plain', round.bye ?? '')
                  event.dataTransfer.setData('application/x-courtly-round', String(roundIndex))
                }}
                onDragOver={(event) => canReorderBye && event.preventDefault()}
                onDrop={(event) => {
                  if (
                    canReorderBye &&
                    event.dataTransfer.getData('application/x-courtly-round') === String(roundIndex)
                  ) {
                    handleSwapPlayers(event.dataTransfer.getData('text/plain'), round.bye ?? '')
                  }
                }}
              >
                {canReorderBye && (
                  <button
                    className={classNames(sharedStyles, styles, 'drag-handle-button')}
                    type="button"
                    aria-label={`${t('moveParticipant')}: ${name(round.bye)}`}
                    title={`${t('moveParticipant')}: ${name(round.bye)}`}
                    aria-pressed={
                      keyboardMove?.roundIndex === roundIndex &&
                      keyboardMove.participantId === round.bye
                    }
                    onClick={() => handleKeyboardSwap(round.bye ?? '')}
                  >
                    <GripVertical size={14} aria-hidden="true" />
                  </button>
                )}
                <button
                  className={classNames(sharedStyles, styles, 'match-player-name')}
                  type="button"
                  title={`${t('history')}: ${name(round.bye)}`}
                  onClick={() => onPlayerClick(round.bye ?? '')}
                >
                  {t('bye')}: {name(round.bye)}
                </button>
              </span>
            )}
          </div>
        </div>
        {!readOnly && (
          <RoundActions
            round={round}
            canCalculatePairings={canCalculatePairings}
            onSettings={handleSettings}
            onStart={handleStart}
            onFillUnknown={handleFillUnknown}
            onReroll={handleReroll}
            onRerollBye={handleRerollBye}
            onDelete={handleDelete}
          />
        )}
      </div>
      {round.matches.length === 0 ? (
        <div className={classNames(sharedStyles, styles, 'round-pairings-pending')}>
          <p>{t('pairingsPending')}</p>
        </div>
      ) : (
        <div className={classNames(sharedStyles, styles, 'matches')}>
          {orderedMatches.map((match, matchIndex) => (
            <MatchRow
              key={match.id}
              match={match}
              matchIndex={matchIndex}
              roundIndex={roundIndex}
              name={name}
              recordA={getRecord(match.a)}
              recordB={getRecord(match.b)}
              onPlayerClick={onPlayerClick}
              onCompare={handleCompare}
              onUpdate={handleUpdate}
              winningGames={round.winningGames ?? 1}
              isRunning={runningMatchIds.has(match.id)}
              onSwap={handleSwapPlayers}
              selectedParticipantId={
                keyboardMove?.roundIndex === roundIndex ? keyboardMove.participantId : null
              }
              onKeyboardSwap={handleKeyboardSwap}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  )
})

const formatStartTime = (startedAt: string) => {
  const date = new Date(startedAt)
  return Number.isNaN(date.getTime())
    ? startedAt
    : new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}
