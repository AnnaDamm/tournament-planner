import { Dices, GripVertical, RefreshCw, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { MatchRow } from './MatchRow'
import { PageTitle } from './PageTitle'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import { t } from '../i18n'
import type { Match, Round } from '../storage'
import type { Participant } from './Players'
import { hasEnteredScore, isRoundComplete, isUnknownParticipantId } from '../tournament'

type Props = {
  rounds: Round[]
  players: Participant[]
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  onCreate: () => void
  onUpdate: (index: number, matches: Match[]) => void
  onSetWinningGames: (number: number, value: number) => void
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
  onCreate,
  onUpdate,
  onSetWinningGames,
  onDelete,
  onFillUnknown,
  onReroll,
  onSwapPlayers,
}: Props) {
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null)
  const historyPlayer = players.find((player) => player.id === historyPlayerId) ?? null
  return (
    <>
      <PageTitle eyebrow={t('schedule')} title={t('rounds')}>
        <button className="button primary" onClick={onCreate}>
          <RefreshCw size={16} /> {t('create')}
        </button>
      </PageTitle>
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
            return (
              <div className="round-card" key={round.number}>
                <div className="round-head">
                  <div>
                    <span className="round-kicker">
                      {t('round')} {String(round.number).padStart(2, '0')}
                    </span>
                    <h2>
                      {round.matches.length} {t('match')}
                    </h2>
                  </div>
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
                  {round.matches.some(
                    (match) => isUnknownParticipantId(match.a) || isUnknownParticipantId(match.b),
                  ) && (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => onFillUnknown(round.number)}
                    >
                      {t('fillMore')}
                    </button>
                  )}
                  {isUnstarted && (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => onReroll(round.number)}
                    >
                      <Dices size={16} /> {t('reroll')}
                    </button>
                  )}
                  <label className="round-games">
                    <span>{t('winningGames')}</span>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={round.winningGames ?? 1}
                      onChange={(event) =>
                        onSetWinningGames(
                          round.number,
                          Math.min(9, Math.max(1, Number(event.target.value) || 1)),
                        )
                      }
                    />
                  </label>
                  {!round.matches.some((match) => match.scoreA || match.scoreB) && (
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => onDelete(round.number)}
                      title={t('deleteRound')}
                    >
                      <X size={16} />
                    </button>
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
      <PlayerHistoryDialog
        player={historyPlayer}
        rounds={rounds}
        name={name}
        onClose={() => setHistoryPlayerId(null)}
      />
    </>
  )
}
