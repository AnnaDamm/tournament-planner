import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppRoutesProps } from '../components/AppRoutes'
import type { Participant, Round, TournamentSettings } from '../tournamentTypes'
import { parseTournamentSnapshot } from '../tournamentSnapshot'
import { downloadTournament } from '../tournamentExport'
import {
  getCurrentRoundNumber,
  getRunningMatchIdsByRound,
  getMatchResult,
  isUnknownParticipantId,
} from '../tournament'
import { t } from '../i18n'
import type { TournamentContextValue } from '../context/TournamentContext'
import { getLocalSession, isReadOnlyTab } from '../liveSharing'
import { useAppDispatch, useAppSelector } from '../storeHooks'
import { selectTournamentSnapshot } from '../tournamentSelectors'
import {
  getScheduledRounds,
  importTournamentSnapshot,
  startScheduledRound,
  updatePredictedStarts,
} from '../tournamentCommands'
import { useTournamentDerivedState } from './useTournamentDerivedState'
import { useLiveTournamentSync } from './useLiveTournamentSync'

const openBulkDialog = (dialog: HTMLDialogElement | null, input: HTMLTextAreaElement | null) => {
  if (!dialog) return
  dialog.showModal()
  setTimeout(() => {
    if (dialog.open) input?.focus()
  })
}

const getNextMatchTargets = (players: Participant[], rounds: Round[], courtCount: number) => {
  const runningMatchIds = new Set(
    [...getRunningMatchIdsByRound(rounds, courtCount).values()].flatMap((ids) => [...ids]),
  )
  const targetsByParticipant = new Map(players.map((player) => [player.id, [] as string[]]))

  rounds.forEach((round) => {
    const winningGames = Math.max(1, round.winningGames || 1)
    round.matches.forEach((match) => {
      if (getMatchResult(match, winningGames) || runningMatchIds.has(match.id)) return
      targetsByParticipant.get(match.a)?.push(match.id)
      targetsByParticipant.get(match.b)?.push(match.id)
    })
  })

  return players.flatMap((player) =>
    (targetsByParticipant.get(player.id) ?? []).map((matchId) => ({
      participantName: player.name,
      matchId,
    })),
  )
}

// oxlint-disable-next-line eslint/max-lines-per-function
export function useTournamentController(): TournamentContextValue {
  const dispatch = useAppDispatch()
  const snapshot = useAppSelector(selectTournamentSnapshot)
  const localSession = useMemo(() => getLocalSession(), [])
  const readOnlyTab = isReadOnlyTab()
  const localMaster = localSession?.role === 'master' ? localSession : null
  const readOnly = localSession?.role === 'viewer' || readOnlyTab
  const syncSession = readOnlyTab ? null : localSession
  const [sort, setSort] = useState('position')
  const [desc, setDesc] = useState(true)
  const [draft, setDraft] = useState('')
  const bulkRef = useRef<HTMLDialogElement>(null)
  const bulkInputRef = useRef<HTMLTextAreaElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)
  const {
    players,
    rounds,
    tournamentName,
    courtCount,
    defaultWinningGames,
    defaultSetPoints,
    participantType,
    scheduledStart,
    expectedDurationMinutes,
    breakBetweenMatchesMinutes,
  } = snapshot

  useEffect(() => {
    document.title = `${tournamentName} — Tournament Manager`
  }, [tournamentName])

  useEffect(() => {
    if (readOnly || !scheduledStart) return
    const startAt = new Date(scheduledStart).getTime()
    if (!Number.isFinite(startAt)) return
    const checkScheduledRound = () => {
      if (Date.now() < startAt) return
      dispatch(startScheduledRound(startAt))
    }
    checkScheduledRound()
    const timer = window.setInterval(checkScheduledRound, 1000)
    return () => window.clearInterval(timer)
  }, [dispatch, readOnly, scheduledStart])

  const { standingsBeforeRounds, participantOrderByRound, sorted } = useTournamentDerivedState(
    players,
    rounds,
    defaultSetPoints,
    sort,
    desc,
  )
  const scheduledRounds = useMemo(
    () => getScheduledRounds(snapshot, scheduledStart),
    [snapshot, scheduledStart],
  )

  useEffect(() => {
    dispatch(updatePredictedStarts(scheduledRounds))
  }, [dispatch, scheduledRounds])

  const isLive = useLiveTournamentSync({
    session: syncSession,
    snapshot,
    onSnapshot: (incoming) => dispatch(importTournamentSnapshot(incoming)),
  })
  const nextMatchTargets = useMemo(
    () => getNextMatchTargets(players, rounds, courtCount),
    [courtCount, players, rounds],
  )
  const participantLabel = participantType === 'teams' ? t('teams') : t('players')
  const name = (id: string) =>
    isUnknownParticipantId(id)
      ? t('notYetKnown')
      : players.find((player) => player.id === id)?.name || t('unknown')
  const recordBeforeRound = (roundIndex: number, id: string) => {
    const player = standingsBeforeRounds[roundIndex]?.find((item) => item.id === id)
    if (!player) return '—'

    const round = rounds[roundIndex]
    const match = round?.matches.find((item) => item.a === id || item.b === id)
    const result = match ? getMatchResult(match, Math.max(1, round.winningGames || 1)) : null
    const nextWins = result?.winner === id ? player.wins + 1 : player.wins

    return result ? `${player.wins} → ${nextWins}` : String(player.wins)
  }
  const toggleSort = (key: string) =>
    sort === key ? setDesc((value) => !value) : (setSort(key), setDesc(key !== 'name'))
  const settings = useMemo<TournamentSettings>(
    () => ({
      tournamentName,
      participantType,
      courtCount,
      defaultWinningGames,
      defaultSetPoints,
      expectedDurationMinutes,
      breakBetweenMatchesMinutes,
      scheduledStart,
    }),
    [
      breakBetweenMatchesMinutes,
      courtCount,
      defaultSetPoints,
      defaultWinningGames,
      expectedDurationMinutes,
      participantType,
      scheduledStart,
      tournamentName,
    ],
  )
  const exportTournament = () => downloadTournament(snapshot)
  const importTournament = async (file: File) => {
    try {
      const imported = parseTournamentSnapshot(JSON.parse(await file.text()))
      if (!imported) return false
      dispatch(importTournamentSnapshot(imported))
      return true
    } catch {
      return false
    }
  }
  const recordRoute = (roundIndex: number, id: string) => recordBeforeRound(roundIndex, id)
  const routes: AppRoutesProps = {
    localMaster,
    readOnly,
    players,
    participantLabel,
    rounds: scheduledRounds,
    participantType,
    courtCount,
    defaultWinningGames,
    settings,
    name,
    record: recordRoute,
    participantOrderByRound,
    sorted,
    sort,
    desc,
    onAdd: () => openBulkDialog(bulkRef.current, bulkInputRef.current),
    onToggleSort: toggleSort,
    onExport: exportTournament,
    onImport: importTournament,
    onDeleteAll: () => confirmRef.current?.showModal(),
  }
  return {
    layout: {
      tournamentName,
      localMaster,
      readOnly,
      isLive,
      participantNames: players.map((player) => player.name),
      participantTargets: players.map((player) => ({
        participantName: player.name,
        participantId: player.id,
      })),
      nextMatchTargets,
      roundCount: rounds.length,
      currentRound: getCurrentRoundNumber(rounds, courtCount),
    },
    routes,
    dialogs: {
      bulkRef,
      bulkInputRef,
      confirmRef,
      draft,
      setDraft,
    },
  }
}
