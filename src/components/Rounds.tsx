import { Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { PageTitle } from './PageTitle'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import { RoundSettingsDialog } from './RoundSettingsDialog'
import { RoundSection } from './RoundSection'
import { t } from '../i18n'
import type { Match, Participant, Round } from '../tournamentTypes'
import { getRunningMatchIdsByRound, isUnknownParticipantId } from '../tournament'
import { useIdleRunningMatchScroll } from '../hooks/useIdleRunningMatchScroll'

type Props = {
  rounds: Round[]
  players: Participant[]
  participantOrderByRound: string[][]
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

const getCurrentRoundNumber = (rounds: Round[], runningMatchIdsByRound: Map<number, Set<string>>) =>
  rounds.find((round) => (runningMatchIdsByRound.get(round.number)?.size ?? 0) > 0)?.number

const getFirstRunningMatchId = (
  rounds: Round[],
  runningMatchIdsByRound: Map<number, Set<string>>,
) =>
  rounds
    .flatMap((round) =>
      round.matches.filter((match) => runningMatchIdsByRound.get(round.number)?.has(match.id)),
    )
    .at(0)?.id

export function Rounds({
  rounds,
  players,
  participantOrderByRound,
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
  const currentRoundNumber = getCurrentRoundNumber(rounds, runningMatchIdsByRound)
  const firstRunningMatchId = getFirstRunningMatchId(rounds, runningMatchIdsByRound)
  const runningRoundIndices = new Set(
    rounds.flatMap((round, index) =>
      (runningMatchIdsByRound.get(round.number)?.size ?? 0) > 0 ? [index] : [],
    ),
  )
  const firstRunningRoundIndex = [...runningRoundIndices][0]
  const lastRunningRoundIndex = [...runningRoundIndices].at(-1)
  const groupRunningRounds = readOnly && firstRunningRoundIndex !== undefined
  useIdleRunningMatchScroll(readOnly, firstRunningMatchId)
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
  const renderedRounds = rounds.map((round, roundIndex) => (
    <RoundSection
      key={round.number}
      round={round}
      roundIndex={roundIndex}
      canCalculatePairings={roundIndex === 0 || rounds[roundIndex - 1].matches.length > 0}
      participantOrder={participantOrderByRound[roundIndex] ?? []}
      currentRoundNumber={currentRoundNumber}
      runningMatchIds={runningMatchIdsByRound.get(round.number) ?? new Set<string>()}
      name={name}
      record={(id) => record(roundIndex, id)}
      onPlayerClick={(id) => {
        if (!isUnknownParticipantId(id)) setHistoryPlayerId(id)
      }}
      onUpdate={(matches) => onUpdate(roundIndex, matches)}
      onSettings={() => setSettingsRoundNumber(round.number)}
      onStart={() => onStart(round.number)}
      onFillUnknown={() => onFillUnknown(round.number)}
      onReroll={() => onReroll(round.number)}
      onDelete={() => onDelete(round.number)}
      onSwapPlayers={(draggedId, targetId) => onSwapPlayers(roundIndex, draggedId, targetId)}
      keyboardMove={keyboardMove}
      onKeyboardSwap={(participantId) => handleKeyboardSwap(roundIndex, participantId)}
      readOnly={readOnly}
    />
  ))
  const currentGroupStart = firstRunningRoundIndex ?? 0
  const currentGroupEnd = lastRunningRoundIndex ?? -1
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
          {groupRunningRounds ? (
            <>
              {renderedRounds.slice(0, currentGroupStart)}
              <div className="current-round-group">
                {renderedRounds.slice(currentGroupStart, currentGroupEnd + 1)}
              </div>
              {renderedRounds.slice(currentGroupEnd + 1)}
            </>
          ) : (
            renderedRounds
          )}
        </div>
      )}
      {!readOnly && (
        <button className="button primary" onClick={onCreate} title={t('create')}>
          <Plus size={16} aria-hidden="true" /> {t('create')}
        </button>
      )}
      <p className="sr-only" aria-live="polite">
        {keyboardMove ? t('moveInstructions') : ''}
      </p>
      <PlayerHistoryDialog
        player={historyPlayer}
        players={players}
        rounds={rounds}
        defaultCourtCount={defaultCourtCount}
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
