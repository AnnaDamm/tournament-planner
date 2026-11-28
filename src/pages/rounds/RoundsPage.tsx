import styles from './RoundsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { ArrowRight, Plus, Trophy } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageTitle } from '../../shared/PageTitle'
import { PlayerComparisonDialog } from './PlayerComparisonDialog'
import { PlayerHistoryDialog } from '../../shared/PlayerHistoryDialog'
import { MatchSettingsDialog } from './MatchSettingsDialog'
import { RoundSettingsDialog } from './RoundSettingsDialog'
import { RoundSection } from './RoundSection'
import { t, tf } from '../../i18n'
import { getPhaseMode } from '../../domain/phases/registry'
import { noCapabilities } from '../../domain/phases/types'
import { phaseViews } from '../phaseViews/registry'
import { getPhaseName } from '../phaseViews/phaseName'
import { getSideLabel } from './sideLabel'
import type { Match, MatchFormat, Participant, Round } from '../../tournamentTypes'
import {
  getRunningMatchIdsByRound,
  isUnknownParticipantId,
  type EvaluationContext,
} from '../../tournament'
import { useIdleRunningMatchScroll } from '../../hooks/useIdleRunningMatchScroll'
import {
  createRound,
  deleteRound,
  fillUnknown,
  reroll,
  rerollByeCommand,
  setMatchFormat,
  setRoundFormat,
  startNextPhase,
  startRound,
  swapPlayers,
  updateRoundMatch,
} from '../../tournamentCommands'
import { useAppDispatch, useAppSelector } from '../../storeHooks'
import {
  selectActivePhaseId,
  selectPhases,
  selectScoring,
  selectStartablePhase,
} from '../../tournamentSelectors'

type Props = {
  rounds: Round[]
  players: Participant[]
  participantOrderByRound: string[][]
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  defaultCourtCount: number
  ctx: EvaluationContext
  onKeyboardMoveActiveChange: (active: boolean) => void
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

const emptyRunningMatchIds = new Set<string>()

type ListItem = { key: string; roundIndex?: number; node: ReactNode }

type ComparisonSelection = {
  playerIds: [string, string]
  roundIndex: number
}

// oxlint-disable-next-line eslint/max-lines-per-function
export const RoundsPage = memo(function RoundsPage({
  rounds,
  players,
  participantOrderByRound,
  name,
  record,
  defaultCourtCount,
  ctx,
  onKeyboardMoveActiveChange,
  readOnly = false,
}: Props) {
  const dispatch = useAppDispatch()
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null)
  const [comparisonSelection, setComparisonSelection] = useState<ComparisonSelection | null>(null)
  const [settingsRoundNumber, setSettingsRoundNumber] = useState<number | null>(null)
  const [settingsMatch, setSettingsMatch] = useState<{ round: number; match: string } | null>(null)
  const phases = useAppSelector(selectPhases)
  const activePhaseId = useAppSelector(selectActivePhaseId)
  const startablePhase = useAppSelector(selectStartablePhase)
  const scoring = useAppSelector(selectScoring)
  const sportId = scoring.sport
  const capabilitiesByPhase = useMemo(
    () =>
      new Map(
        phases.map((phase) => [phase.id, getPhaseMode(phase.mode)?.capabilities ?? noCapabilities]),
      ),
    [phases],
  )
  const activeCapabilities = capabilitiesByPhase.get(activePhaseId) ?? noCapabilities
  const matchLabels = useMemo(
    () =>
      new Map(
        rounds.flatMap((round) =>
          round.matches.map((match) => [match.id, match.label ?? match.id]),
        ),
      ),
    [rounds],
  )
  const [keyboardMove, setKeyboardMove] = useState<{
    roundIndex: number
    participantId: string
  } | null>(null)
  const historyPlayer = players.find((player) => player.id === historyPlayerId) ?? null
  const settingsRound = rounds.find((round) => round.number === settingsRoundNumber) ?? null
  const matchRound = rounds.find((round) => round.number === settingsMatch?.round) ?? null
  const matchForSettings =
    matchRound?.matches.find((match) => match.id === settingsMatch?.match) ?? null
  const runningMatchIdsByRound = useMemo(
    () => getRunningMatchIdsByRound(ctx.rules, rounds, defaultCourtCount),
    [ctx.rules, defaultCourtCount, rounds],
  )
  const currentRoundNumber = getCurrentRoundNumber(rounds, runningMatchIdsByRound)
  const firstRunningMatchId = getFirstRunningMatchId(rounds, runningMatchIdsByRound)
  useEffect(() => {
    onKeyboardMoveActiveChange(keyboardMove !== null)
  }, [keyboardMove, onKeyboardMoveActiveChange])
  useEffect(() => () => onKeyboardMoveActiveChange(false), [onKeyboardMoveActiveChange])
  useEffect(() => {
    if (!keyboardMove) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setKeyboardMove(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    document
      .querySelector<HTMLButtonElement>(`[data-keyboard-drop-target="${keyboardMove.roundIndex}"]`)
      ?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [keyboardMove])
  const runningRoundIndices = useMemo(
    () =>
      new Set(
        rounds.flatMap((round, index) =>
          (runningMatchIdsByRound.get(round.number)?.size ?? 0) > 0 ? [index] : [],
        ),
      ),
    [rounds, runningMatchIdsByRound],
  )
  const firstRunningRoundIndex = [...runningRoundIndices][0]
  const lastRunningRoundIndex = [...runningRoundIndices].at(-1)
  const groupRunningRounds = readOnly && firstRunningRoundIndex !== undefined
  useIdleRunningMatchScroll(readOnly, firstRunningMatchId)

  const handleKeyboardSwap = useCallback(
    (roundIndex: number, participantId: string) => {
      if (!keyboardMove || keyboardMove.roundIndex !== roundIndex) {
        setKeyboardMove({ roundIndex, participantId })
        return
      }
      if (keyboardMove.participantId !== participantId) {
        dispatch(swapPlayers(roundIndex, keyboardMove.participantId, participantId))
      }
      setKeyboardMove(null)
    },
    [dispatch, keyboardMove],
  )
  const handlePlayerClick = useCallback((id: string) => {
    if (!isUnknownParticipantId(id)) setHistoryPlayerId(id)
  }, [])
  const handleCompare = useCallback((firstId: string, secondId: string, roundIndex: number) => {
    setComparisonSelection({ playerIds: [firstId, secondId], roundIndex })
  }, [])
  const handleUpdate = useCallback(
    (roundIndex: number, match: Match) => dispatch(updateRoundMatch(roundIndex, match)),
    [dispatch],
  )
  const handleSettings = useCallback((number: number) => setSettingsRoundNumber(number), [])
  const handleMatchSettings = useCallback(
    (round: number, match: string) => setSettingsMatch({ round, match }),
    [],
  )
  const closeMatchSettings = useCallback(() => setSettingsMatch(null), [])
  const handleStart = useCallback((number: number) => dispatch(startRound(number)), [dispatch])
  const handleFillUnknown = useCallback(
    (number: number) => dispatch(fillUnknown(number)),
    [dispatch],
  )
  const handleReroll = useCallback((number: number) => dispatch(reroll(number)), [dispatch])
  const handleRerollBye = useCallback(
    (number: number) => dispatch(rerollByeCommand(number)),
    [dispatch],
  )
  const handleDelete = useCallback((number: number) => dispatch(deleteRound(number)), [dispatch])
  const handleSwapPlayers = useCallback(
    (roundIndex: number, draggedId: string, targetId: string) =>
      dispatch(swapPlayers(roundIndex, draggedId, targetId)),
    [dispatch],
  )
  const renderedRounds = useMemo(
    () =>
      rounds.map((round, roundIndex) => (
        <RoundSection
          key={round.number}
          round={round}
          roundIndex={roundIndex}
          nextRoundStarted={Boolean(rounds[roundIndex + 1]?.startedAt)}
          canCalculatePairings={roundIndex === 0 || rounds[roundIndex - 1].matches.length > 0}
          capabilities={
            capabilitiesByPhase.get(round.phaseId) ??
            capabilitiesByPhase.get(phases[0]?.id ?? '') ??
            noCapabilities
          }
          matchLabels={matchLabels}
          participantOrder={participantOrderByRound[roundIndex] ?? []}
          currentRoundNumber={currentRoundNumber}
          runningMatchIds={runningMatchIdsByRound.get(round.number) ?? emptyRunningMatchIds}
          name={name}
          record={record}
          onPlayerClick={handlePlayerClick}
          onCompare={handleCompare}
          onUpdate={handleUpdate}
          onSettings={handleSettings}
          onStart={handleStart}
          onFillUnknown={handleFillUnknown}
          onReroll={handleReroll}
          onRerollBye={handleRerollBye}
          onDelete={handleDelete}
          onSwapPlayers={handleSwapPlayers}
          onMatchSettings={handleMatchSettings}
          keyboardMove={keyboardMove}
          onKeyboardSwap={handleKeyboardSwap}
          readOnly={readOnly}
          headingLevel={phases.length >= 2 ? 3 : 2}
        />
      )),
    [
      capabilitiesByPhase,
      currentRoundNumber,
      handleCompare,
      handleDelete,
      handleFillUnknown,
      handleKeyboardSwap,
      handleMatchSettings,
      handlePlayerClick,
      handleReroll,
      handleRerollBye,
      handleSettings,
      handleStart,
      handleSwapPlayers,
      handleUpdate,
      keyboardMove,
      matchLabels,
      name,
      participantOrderByRound,
      phases,
      readOnly,
      record,
      rounds,
      runningMatchIdsByRound,
    ],
  )
  const matchLabelContext = {
    name,
    matchLabel: (id: string) => matchLabels.get(id) ?? id,
  }
  const items = useMemo(() => {
    if (phases.length < 2) {
      return renderedRounds.map<ListItem>((node, roundIndex) => ({
        key: String(rounds[roundIndex].number),
        roundIndex,
        node,
      }))
    }
    return phases.flatMap<ListItem>((phase, phaseIndex) => {
      const phaseRounds = rounds.flatMap((round, roundIndex) =>
        round.phaseId === phase.id ||
        (phaseIndex === 0 && !phases.some((item) => item.id === round.phaseId))
          ? [roundIndex]
          : [],
      )
      if (phaseRounds.length === 0 && !phase.startedAt) return []
      const RoundsView = phaseViews[phase.mode]?.RoundsView
      return [
        {
          key: `phase-${phase.id}`,
          node: (
            <div key={`phase-${phase.id}`}>
              <h2 className={classNames(sharedStyles, styles, 'phase-heading')}>
                {tf('phasesHeading', { number: phaseIndex + 1, name: getPhaseName(phase) })}
              </h2>
              {RoundsView && <RoundsView phaseId={phase.id} />}
              {phaseRounds.length === 0 && (
                <p className={classNames(sharedStyles, styles, 'setting-status')}>
                  {t('phasesNoRounds')}
                </p>
              )}
            </div>
          ),
        },
        ...phaseRounds.map<ListItem>((roundIndex) => ({
          key: String(rounds[roundIndex].number),
          roundIndex,
          node: renderedRounds[roundIndex],
        })),
      ]
    })
  }, [phases, renderedRounds, rounds])
  const itemStart = items.findIndex((item) => item.roundIndex === firstRunningRoundIndex)
  const itemEnd = items.map((item) => item.roundIndex).lastIndexOf(lastRunningRoundIndex)

  return (
    <>
      <PageTitle title={t('rounds')} />
      {rounds.length === 0 ? (
        <div className={classNames(sharedStyles, styles, 'empty')}>
          <Trophy size={30} aria-hidden="true" />
          <h2>{t('noRounds')}</h2>
          <p>{t('firstRound')}</p>
        </div>
      ) : (
        <div className={classNames(sharedStyles, styles, 'round-list')}>
          {groupRunningRounds && itemStart >= 0 ? (
            <>
              {items.slice(0, itemStart).map((item) => item.node)}
              <div className={classNames(sharedStyles, styles, 'current-round-group')}>
                {items.slice(itemStart, itemEnd + 1).map((item) => item.node)}
              </div>
              {items.slice(itemEnd + 1).map((item) => item.node)}
            </>
          ) : (
            items.map((item) => item.node)
          )}
        </div>
      )}
      <div className={classNames(sharedStyles, styles, 'round-list-actions')}>
        {!readOnly && startablePhase && (
          <button
            className={classNames(sharedStyles, styles, 'button primary')}
            inert={keyboardMove !== null}
            onClick={() => dispatch(startNextPhase())}
          >
            <ArrowRight size={16} aria-hidden="true" />{' '}
            {tf('phasesStartNext', { name: getPhaseName(startablePhase) })}
          </button>
        )}
        {!readOnly && activeCapabilities.manualRounds && (
          <button
            className={classNames(sharedStyles, styles, 'button primary')}
            inert={keyboardMove !== null}
            onClick={() => dispatch(createRound())}
            title={t('create')}
          >
            <Plus size={16} aria-hidden="true" /> {t('create')}
          </button>
        )}
      </div>
      <p className={classNames(sharedStyles, styles, 'sr-only')} aria-live="polite">
        {keyboardMove ? t('moveInstructions') : ''}
      </p>
      <PlayerHistoryDialog
        player={historyPlayer}
        players={players}
        rounds={rounds}
        defaultCourtCount={defaultCourtCount}
        ctx={ctx}
        name={name}
        onClose={() => setHistoryPlayerId(null)}
      />
      <PlayerComparisonDialog
        playerIds={comparisonSelection?.playerIds ?? null}
        roundIndex={comparisonSelection?.roundIndex ?? null}
        players={players}
        rounds={rounds}
        ctx={ctx}
        name={name}
        onClose={() => setComparisonSelection(null)}
      />
      {!readOnly && (
        <RoundSettingsDialog
          key={settingsRound?.number}
          round={settingsRound}
          sportId={sportId}
          rulesId={scoring.rules}
          defaultCourtCount={defaultCourtCount}
          onSave={(number: number, format: MatchFormat, courtCount: number) =>
            dispatch(setRoundFormat(number, format, courtCount))
          }
          onClose={() => setSettingsRoundNumber(null)}
        />
      )}
      {!readOnly && (
        <MatchSettingsDialog
          key={`${settingsMatch?.round}-${settingsMatch?.match}`}
          round={matchRound}
          match={matchForSettings}
          title={
            matchForSettings
              ? `${getSideLabel(matchForSettings, 'a', matchLabelContext)} ${t('versus')} ${getSideLabel(matchForSettings, 'b', matchLabelContext)}`
              : ''
          }
          sportId={sportId}
          rulesId={scoring.rules}
          onSave={(number, matchId, format) => dispatch(setMatchFormat(number, matchId, format))}
          onClose={closeMatchSettings}
        />
      )}
    </>
  )
})
