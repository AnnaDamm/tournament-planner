import { CalendarClock, Clock, GripVertical } from 'lucide-react'
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
  record: (id: string) => string
  onPlayerClick: (id: string) => void
  onCompare: (firstId: string, secondId: string) => void
  onUpdate: (matches: Match[]) => void
  onSettings: () => void
  onStart: () => void
  onFillUnknown: () => void
  onReroll: () => void
  onRerollBye: () => void
  onDelete: () => void
  onSwapPlayers: (draggedId: string, targetId: string) => void
  keyboardMove: { roundIndex: number; participantId: string } | null
  onKeyboardSwap: (participantId: string) => void
  readOnly: boolean
}

export function RoundSection({
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
  const orderedMatches = sortMatchesByParticipantOrder(round.matches, participantOrder)

  return (
    <section
      className={`round-card ${isCurrentRound ? 'current-round' : ''}`}
      aria-labelledby={`round-${round.number}-title`}
    >
      <div className="round-head">
        <div>
          {round.number === currentRoundNumber && (
            <div className="current-round-label">{t('currentRound')}</div>
          )}
          <span className="round-kicker">
            <span aria-hidden="true">
              {t('round')} {String(round.number).padStart(2, '0')}
            </span>
            {(round.startedAt || round.predictedStart) && (
              <time
                className="round-started"
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
          <div className="round-title-line">
            <h2 id={`round-${round.number}-title`}>
              <span className="sr-only">
                {t('round')} {round.number} –
              </span>
            </h2>
            {round.bye && (
              <span
                className={`bye-pill ${canReorderBye ? '' : 'locked'}`}
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
                    onSwapPlayers(event.dataTransfer.getData('text/plain'), round.bye ?? '')
                  }
                }}
              >
                {canReorderBye && (
                  <button
                    className="drag-handle-button"
                    type="button"
                    aria-label={`${t('moveParticipant')}: ${name(round.bye)}`}
                    title={`${t('moveParticipant')}: ${name(round.bye)}`}
                    aria-pressed={
                      keyboardMove?.roundIndex === roundIndex &&
                      keyboardMove.participantId === round.bye
                    }
                    onClick={() => onKeyboardSwap(round.bye ?? '')}
                  >
                    <GripVertical size={14} aria-hidden="true" />
                  </button>
                )}
                <button
                  className="match-player-name"
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
            onSettings={onSettings}
            onStart={onStart}
            onFillUnknown={onFillUnknown}
            onReroll={onReroll}
            onRerollBye={onRerollBye}
            onDelete={onDelete}
          />
        )}
      </div>
      {round.matches.length === 0 ? (
        <div className="round-pairings-pending">
          <p>{t('pairingsPending')}</p>
        </div>
      ) : (
        <div className="matches">
          {orderedMatches.map((match, matchIndex) => (
            <MatchRow
              key={match.id}
              match={match}
              matchIndex={matchIndex}
              roundIndex={roundIndex}
              name={name}
              record={record}
              onPlayerClick={onPlayerClick}
              onCompare={onCompare}
              onUpdate={onUpdate}
              allMatches={round.matches}
              winningGames={round.winningGames ?? 1}
              isRunning={runningMatchIds.has(match.id)}
              onSwap={onSwapPlayers}
              selectedParticipantId={
                keyboardMove?.roundIndex === roundIndex ? keyboardMove.participantId : null
              }
              onKeyboardSwap={onKeyboardSwap}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const formatStartTime = (startedAt: string) => {
  const date = new Date(startedAt)
  return Number.isNaN(date.getTime())
    ? startedAt
    : new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}
