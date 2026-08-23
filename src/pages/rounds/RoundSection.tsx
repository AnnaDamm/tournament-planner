import styles from './RoundSection.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { CalendarClock, Clock } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { MatchRow } from './MatchRow'
import { RoundBye } from './RoundBye'
import { RoundMatchesHeader } from './RoundMatchesHeader'
import { RoundActions } from './RoundActions'
import { t } from '../../i18n'
import {
  getMaxSetCount,
  getVisibleSetCount,
  isRoundComplete,
  sortMatchesByParticipantOrder,
} from '../../tournament'
import type { Match, Round } from '../../tournamentTypes'

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
  const keyboardMoveActive = keyboardMove !== null
  const isKeyboardMoveRound = keyboardMove?.roundIndex === roundIndex
  const selectedParticipantId = isKeyboardMoveRound ? keyboardMove.participantId : null
  const orderedMatches = useMemo(
    () => sortMatchesByParticipantOrder(round.matches, participantOrder),
    [participantOrder, round.matches],
  )
  const maxSetCount = getMaxSetCount(round.winningGames)
  const setCount = readOnly
    ? Math.max(1, ...orderedMatches.map((match) => getVisibleSetCount(match, round.winningGames)))
    : maxSetCount
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
      inert={keyboardMoveActive && !isKeyboardMoveRound}
    >
      <div className={classNames(sharedStyles, styles, 'round-head')}>
        <div className={classNames(sharedStyles, styles, 'round-head-main')}>
          <div className={classNames(sharedStyles, styles, 'round-head-copy')}>
            {round.number === currentRoundNumber && (
              <div className={classNames(sharedStyles, styles, 'current-round-label')}>
                {t('currentRound')}
              </div>
            )}
            <div className={classNames(sharedStyles, styles, 'round-title-line')}>
              <h2 id={`round-${round.number}-title`}>
                <span className={classNames(sharedStyles, styles, 'sr-only')}>
                  {t('round')} {round.number} –
                </span>
              </h2>
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
            </div>
          </div>
          {round.bye && (
            <RoundBye
              bye={round.bye}
              canReorder={canReorderBye}
              roundIndex={roundIndex}
              isSelected={selectedParticipantId === round.bye}
              selectedParticipantId={selectedParticipantId}
              keyboardMoveActive={keyboardMoveActive}
              name={name}
              record={getRecord(round.bye)}
              onPlayerClick={onPlayerClick}
              onKeyboardSwap={handleKeyboardSwap}
              onSwap={handleSwapPlayers}
            />
          )}
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
            keyboardMoveActive={keyboardMoveActive}
          />
        )}
      </div>
      {round.matches.length === 0 ? (
        <div className={classNames(sharedStyles, styles, 'round-pairings-pending')}>
          <p>{t('pairingsPending')}</p>
        </div>
      ) : (
        <div className={classNames(sharedStyles, styles, 'matches')}>
          <RoundMatchesHeader setCount={setCount} />
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
              setCount={setCount}
              isRunning={runningMatchIds.has(match.id)}
              onSwap={handleSwapPlayers}
              selectedParticipantId={selectedParticipantId}
              onKeyboardSwap={handleKeyboardSwap}
              keyboardMoveActive={keyboardMoveActive}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  )
})

const formatStartTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}
