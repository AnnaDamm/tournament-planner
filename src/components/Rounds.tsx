import {
  Clock,
  Dices,
  GripVertical,
  ListPlus,
  Play,
  Plus,
  Settings2,
  Trophy,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { MatchRow } from './MatchRow'
import { PageTitle } from './PageTitle'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import { RoundSettingsDialog } from './RoundSettingsDialog'
import { t } from '../i18n'
import type { Match, Round } from '../storage'
import type { Participant } from './Participant'
import {
  getRunningMatchIdsByRound,
  hasEnteredScore,
  isRoundComplete,
  isUnknownParticipantId,
} from '../tournament'

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
}: Props) {
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null)
  const [settingsRoundNumber, setSettingsRoundNumber] = useState<number | null>(null)
  const historyPlayer = players.find((player) => player.id === historyPlayerId) ?? null
  const settingsRound = rounds.find((round) => round.number === settingsRoundNumber) ?? null
  const runningMatchIdsByRound = getRunningMatchIdsByRound(rounds, defaultCourtCount)
  const formatStartTime = (startedAt: string) => {
    const date = new Date(startedAt)
    return Number.isNaN(date.getTime())
      ? startedAt
      : new Intl.DateTimeFormat(undefined, {
          timeStyle: 'short',
        }).format(date)
  }
  return (
    <>
      <PageTitle eyebrow={t('schedule')} title={t('rounds')} />
      {rounds.length === 0 ? (
        <div className="empty">
          <Trophy size={30} />
          <h2>{t('noRounds')}</h2>
          <p>{t('firstRound')}</p>
        </div>
      ) : (
        <div className="round-list">
          {rounds.map((round, roundIndex) => {
            const canReorderBye = !isRoundComplete(round)
            const isUnstarted = round.matches.every((match) => !hasEnteredScore(match))
            const runningMatchIds = runningMatchIdsByRound.get(round.number) ?? new Set<string>()
            return (
              <div className="round-card" key={round.number}>
                <div className="round-head">
                  <div>
                    <span className="round-kicker">
                      {t('round')} {String(round.number).padStart(2, '0')}
                      {round.startedAt && (
                        <time className="round-started" dateTime={round.startedAt}>
                          <Clock size={12} /> {formatStartTime(round.startedAt)}
                        </time>
                      )}
                    </span>
                    <div className="round-title-line">
                      <h2>
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
                          {canReorderBye && <GripVertical size={14} />}
                          {t('bye')}: {name(round.bye)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="round-actions">
                    <button
                      className="button ghost"
                      type="button"
                      aria-label={t('roundSettings')}
                      title={t('roundSettings')}
                      onClick={() => setSettingsRoundNumber(round.number)}
                    >
                      <Settings2 size={16} />
                    </button>
                    {!round.startedAt && (
                      <button
                        className="button ghost"
                        type="button"
                        aria-label={t('startRound')}
                        title={t('startRound')}
                        onClick={() => onStart(round.number)}
                      >
                        <Play size={14} />
                      </button>
                    )}
                    {round.matches.some(
                      (match) => isUnknownParticipantId(match.a) || isUnknownParticipantId(match.b),
                    ) && (
                      <button
                        className="button ghost"
                        type="button"
                        aria-label={t('fillMore')}
                        title={t('fillMore')}
                        onClick={() => onFillUnknown(round.number)}
                      >
                        <ListPlus size={16} />
                      </button>
                    )}
                    {isUnstarted && (
                      <button
                        className="button ghost"
                        type="button"
                        aria-label={t('reroll')}
                        title={t('reroll')}
                        onClick={() => onReroll(round.number)}
                      >
                        <Dices size={16} />
                      </button>
                    )}
                    {!round.matches.some((match) => match.scoreA || match.scoreB) && (
                      <button
                        className="button danger"
                        type="button"
                        aria-label={t('deleteRound')}
                        onClick={() => onDelete(round.number)}
                        title={t('deleteRound')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
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
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <button className="button primary" onClick={onCreate}>
        <Plus size={16} /> {t('create')}
      </button>
      <PlayerHistoryDialog
        player={historyPlayer}
        rounds={rounds}
        name={name}
        onClose={() => setHistoryPlayerId(null)}
      />
      <RoundSettingsDialog
        round={settingsRound}
        defaultCourtCount={defaultCourtCount}
        defaultWinningGames={defaultWinningGames}
        onSave={onSetRoundSettings}
        onClose={() => setSettingsRoundNumber(null)}
      />
    </>
  )
}
