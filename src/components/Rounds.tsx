import { Clock, GripVertical, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { MatchRow } from './MatchRow'
import { PageTitle } from './PageTitle'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import { RoundSettingsDialog } from './RoundSettingsDialog'
import { RoundActions } from './RoundActions'
import { t } from '../i18n'
import type { Match, Participant, Round } from '../tournamentTypes'
import { getRunningMatchIdsByRound, isRoundComplete, isUnknownParticipantId } from '../tournament'

type Props = {
  rounds: Round[]
  players: Participant[]
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  defaultCourtCount: number
  defaultWinningGames: number
  onCreate: () => void
  onStart: (number: number) => void
  onUpdate: (index: number, matches: Match[]) => void
  onSetRoundSettings: (number: number, winningGames: number, courtCount: number) => void
  onDelete: (number: number) => void
  onFillUnknown: (number: number) => void
  onReroll: (number: number) => void
  onSwapPlayers: (roundIndex: number, draggedId: string, targetId: string) => void
  readOnly?: boolean
}

const formatStartTime = (startedAt: string) => {
  const date = new Date(startedAt)
  return Number.isNaN(date.getTime())
    ? startedAt
    : new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}

export function Rounds({
  rounds,
  players,
  name,
  record,
  defaultCourtCount,
  defaultWinningGames,
  onCreate,
  onStart,
  onUpdate,
  onSetRoundSettings,
  onDelete,
  onFillUnknown,
  onReroll,
  onSwapPlayers,
  readOnly = false,
}: Props) {
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null)
  const [settingsRoundNumber, setSettingsRoundNumber] = useState<number | null>(null)
  const [keyboardMove, setKeyboardMove] = useState<{
    roundIndex: number
    participantId: string
  } | null>(null)
  const historyPlayer = players.find((player) => player.id === historyPlayerId) ?? null
  const settingsRound = rounds.find((round) => round.number === settingsRoundNumber) ?? null
  const runningMatchIdsByRound = getRunningMatchIdsByRound(rounds, defaultCourtCount)
  const handleKeyboardSwap = (roundIndex: number, participantId: string) => {
    if (!keyboardMove || keyboardMove.roundIndex !== roundIndex) {
      setKeyboardMove({ roundIndex, participantId })
      return
    }
    if (keyboardMove.participantId !== participantId) {
      onSwapPlayers(roundIndex, keyboardMove.participantId, participantId)
    }
    setKeyboardMove(null)
  }
  return (
    <>
      <PageTitle eyebrow={t('schedule')} title={t('rounds')} />
      {rounds.length === 0 ? (
        <div className="empty">
          <Trophy size={30} aria-hidden="true" />
          <h2>{t('noRounds')}</h2>
          <p>{t('firstRound')}</p>
        </div>
      ) : (
        <div className="round-list">
          {rounds.map((round, roundIndex) => {
            const canReorderBye = !readOnly && !isRoundComplete(round)
            const runningMatchIds = runningMatchIdsByRound.get(round.number) ?? new Set<string>()
            return (
              <section
                className="round-card"
                key={round.number}
                aria-labelledby={`round-${round.number}-title`}
              >
                <div className="round-head">
                  <div>
                    <span className="round-kicker">
                      <span aria-hidden="true">
                        {t('round')} {String(round.number).padStart(2, '0')}
                      </span>
                      {round.startedAt && (
                        <time className="round-started" dateTime={round.startedAt}>
                          <Clock size={12} aria-hidden="true" /> {formatStartTime(round.startedAt)}
                        </time>
                      )}
                    </span>
                    <div className="round-title-line">
                      <h2 id={`round-${round.number}-title`}>
                        <span className="sr-only">
                          {t('round')} {round.number} –
                        </span>
                        {round.matches.length} {t('match')}
                      </h2>
                      {round.bye && (
                        <span
                          className={`bye-pill ${canReorderBye ? '' : 'locked'}`}
                          draggable={canReorderBye}
                          onDragStart={(event) => {
                            if (!canReorderBye) return
                            event.dataTransfer.setData('text/plain', round.bye ?? '')
                            event.dataTransfer.setData(
                              'application/x-courtly-round',
                              String(roundIndex),
                            )
                          }}
                          onDragOver={(event) => canReorderBye && event.preventDefault()}
                          onDrop={(event) => {
                            if (
                              canReorderBye &&
                              event.dataTransfer.getData('application/x-courtly-round') ===
                                String(roundIndex)
                            ) {
                              onSwapPlayers(
                                roundIndex,
                                event.dataTransfer.getData('text/plain'),
                                round.bye ?? '',
                              )
                            }
                          }}
                        >
                          {canReorderBye && (
                            <button
                              className="drag-handle-button"
                              type="button"
                              aria-label={`${t('moveParticipant')}: ${name(round.bye)}`}
                              aria-pressed={
                                keyboardMove?.roundIndex === roundIndex &&
                                keyboardMove.participantId === round.bye
                              }
                              onClick={() => handleKeyboardSwap(roundIndex, round.bye ?? '')}
                            >
                              <GripVertical size={14} aria-hidden="true" />
                            </button>
                          )}
                          {t('bye')}: {name(round.bye)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <RoundActions
                      round={round}
                      onSettings={() => setSettingsRoundNumber(round.number)}
                      onStart={() => onStart(round.number)}
                      onFillUnknown={() => onFillUnknown(round.number)}
                      onReroll={() => onReroll(round.number)}
                      onDelete={() => onDelete(round.number)}
                    />
                  )}
                </div>
                <div className="matches">
                  {round.matches.map((match, matchIndex) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      matchIndex={matchIndex}
                      roundIndex={roundIndex}
                      name={name}
                      record={(id) => record(roundIndex, id)}
                      onPlayerClick={(id) => {
                        if (!isUnknownParticipantId(id)) setHistoryPlayerId(id)
                      }}
                      onUpdate={(matches) => onUpdate(roundIndex, matches)}
                      allMatches={round.matches}
                      winningGames={round.winningGames ?? 1}
                      isRunning={runningMatchIds.has(match.id)}
                      onSwap={(draggedId, targetId) =>
                        onSwapPlayers(roundIndex, draggedId, targetId)
                      }
                      selectedParticipantId={
                        keyboardMove?.roundIndex === roundIndex ? keyboardMove.participantId : null
                      }
                      onKeyboardSwap={(participantId) =>
                        handleKeyboardSwap(roundIndex, participantId)
                      }
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
      {!readOnly && (
        <button className="button primary" onClick={onCreate}>
          <Plus size={16} aria-hidden="true" /> {t('create')}
        </button>
      )}
      <p className="sr-only" aria-live="polite">
        {keyboardMove ? t('moveInstructions') : ''}
      </p>
      <PlayerHistoryDialog
        player={historyPlayer}
        rounds={rounds}
        name={name}
        onClose={() => setHistoryPlayerId(null)}
      />
      {!readOnly && (
        <RoundSettingsDialog
          round={settingsRound}
          defaultCourtCount={defaultCourtCount}
          defaultWinningGames={defaultWinningGames}
          onSave={onSetRoundSettings}
          onClose={() => setSettingsRoundNumber(null)}
        />
      )}
    </>
  )
}
