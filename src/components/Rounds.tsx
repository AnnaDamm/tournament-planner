import { Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { PageTitle } from './PageTitle'
import { PlayerComparisonDialog } from './PlayerComparisonDialog'
import { PlayerHistoryDialog } from './PlayerHistoryDialog'
import { RoundSettingsDialog } from './RoundSettingsDialog'
import { RoundSection } from './RoundSection'
import { t } from '../i18n'
import type { Participant, Round } from '../tournamentTypes'
import { getRunningMatchIdsByRound, isUnknownParticipantId } from '../tournament'
import { useIdleRunningMatchScroll } from '../hooks/useIdleRunningMatchScroll'
import {
  createRound,
  deleteRound,
  fillUnknown,
  reroll,
  rerollByeCommand,
  setRoundSettings,
  startRound,
  swapPlayers,
  updateRoundMatches,
} from '../tournamentCommands'
import { useAppDispatch } from '../storeHooks'

type Props = {
  rounds: Round[]
  players: Participant[]
  participantOrderByRound: string[][]
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  defaultCourtCount: number
  defaultWinningGames: number
  defaultSetPoints: number
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

type ComparisonSelection = {
  playerIds: [string, string]
  roundIndex: number
}

export function Rounds({
  rounds,
  players,
  participantOrderByRound,
  name,
  record,
  defaultCourtCount,
  defaultWinningGames,
  defaultSetPoints,
  readOnly = false,
}: Props) {
  const dispatch = useAppDispatch()
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null)
  const [comparisonSelection, setComparisonSelection] = useState<ComparisonSelection | null>(null)
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
      dispatch(swapPlayers(roundIndex, keyboardMove.participantId, participantId))
    }
    setKeyboardMove(null)
  }
  const renderedRounds = rounds.map((round, roundIndex) => (
    <RoundSection
      key={round.number}
      round={round}
      roundIndex={roundIndex}
      nextRoundStarted={Boolean(rounds[roundIndex + 1]?.startedAt)}
      canCalculatePairings={roundIndex === 0 || rounds[roundIndex - 1].matches.length > 0}
      participantOrder={participantOrderByRound[roundIndex] ?? []}
      currentRoundNumber={currentRoundNumber}
      runningMatchIds={runningMatchIdsByRound.get(round.number) ?? new Set<string>()}
      name={name}
      record={(id) => record(roundIndex, id)}
      onPlayerClick={(id) => {
        if (!isUnknownParticipantId(id)) setHistoryPlayerId(id)
      }}
      onCompare={(firstId, secondId) =>
        setComparisonSelection({ playerIds: [firstId, secondId], roundIndex })
      }
      onUpdate={(matches) => dispatch(updateRoundMatches(roundIndex, matches))}
      onSettings={() => setSettingsRoundNumber(round.number)}
      onStart={() => dispatch(startRound(round.number))}
      onFillUnknown={() => dispatch(fillUnknown(round.number))}
      onReroll={() => dispatch(reroll(round.number))}
      onRerollBye={() => dispatch(rerollByeCommand(round.number))}
      onDelete={() => dispatch(deleteRound(round.number))}
      onSwapPlayers={(draggedId, targetId) =>
        dispatch(swapPlayers(roundIndex, draggedId, targetId))
      }
      keyboardMove={keyboardMove}
      onKeyboardSwap={(participantId) => handleKeyboardSwap(roundIndex, participantId)}
      readOnly={readOnly}
    />
  ))
  const currentGroupStart = firstRunningRoundIndex ?? 0
  const currentGroupEnd = lastRunningRoundIndex ?? -1
  return (
    <>
      <PageTitle title={t('rounds')} />
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
        <button
          className="button primary"
          onClick={() => dispatch(createRound())}
          title={t('create')}
        >
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
        defaultSetPoints={defaultSetPoints}
        name={name}
        onClose={() => setHistoryPlayerId(null)}
      />
      <PlayerComparisonDialog
        playerIds={comparisonSelection?.playerIds ?? null}
        roundIndex={comparisonSelection?.roundIndex ?? null}
        players={players}
        rounds={rounds}
        defaultSetPoints={defaultSetPoints}
        name={name}
        onClose={() => setComparisonSelection(null)}
      />
      {!readOnly && (
        <RoundSettingsDialog
          round={settingsRound}
          defaultCourtCount={defaultCourtCount}
          defaultWinningGames={defaultWinningGames}
          onSave={(number, winningGames, courtCount) =>
            dispatch(setRoundSettings(number, winningGames, courtCount))
          }
          onClose={() => setSettingsRoundNumber(null)}
        />
      )}
    </>
  )
}
