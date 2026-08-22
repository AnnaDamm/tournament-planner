import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppRoutesProps } from '../components/AppRoutes'
import type { Participant, Round } from '../tournamentTypes'
import { parseTournamentSnapshot } from '../tournamentSnapshot'
import {
  createParticipant,
  swapRoundPlayers as swapRoundPlayersInRounds,
  toggleParticipantWithdrawal,
  updateRoundsForCourtCount,
} from '../tournamentActions'
import { downloadTournament } from '../tournamentExport'
import {
  createRoundPlan,
  fillUnknownRound,
  getCurrentRoundNumber,
  getMatchResult,
  hasEnteredScore,
  getRunningMatchIdsByRound,
  isUnknownParticipantId,
  rerollRound,
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  startReadyRounds,
  startRoundInRounds,
} from '../tournament'
import { t } from '../i18n'
import type { TournamentContextValue } from '../context/TournamentContext'
import { useTournamentDerivedState } from './useTournamentDerivedState'
import { useTournamentLiveState } from './useTournamentLiveState'

const buildRoundWithResult = (
  rounds: Round[],
  number: number,
  winningGames: number,
  courtCount: number,
) =>
  rounds.map((round) => (round.number === number ? { ...round, winningGames, courtCount } : round))

const updateRoundSettings = (
  rounds: Round[],
  number: number,
  winningGames: number,
  roundCourtCount: number,
  defaultCourtCount: number,
) =>
  startReadyRounds(
    buildRoundWithResult(rounds, number, winningGames, roundCourtCount),
    defaultCourtCount,
  )

const deleteRoundAndStartReadyRounds = (rounds: Round[], number: number, courtCount: number) =>
  startReadyRounds(
    rounds
      .filter((round) => round.number !== number)
      .map((round) => (round.number > number ? { ...round, number: round.number - 1 } : round)),
    courtCount,
  )

const rerollRoundAndStartReadyRounds = (
  players: Participant[],
  rounds: Round[],
  number: number,
  courtCount: number,
) => startReadyRounds(rerollRound(players, rounds, number), courtCount)

const fillRoundAndStartReadyRounds = (
  rounds: Round[],
  number: number,
  players: Participant[],
  courtCount: number,
) => {
  const index = rounds.findIndex((round) => round.number === number)
  if (index < 0) return rounds
  const filled = fillUnknownRound(rounds[index], players, rounds.slice(0, index))
  return startReadyRounds(
    rounds.map((round, roundIndex) => (roundIndex === index ? filled : round)),
    courtCount,
  )
}

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
  const {
    localMaster,
    readOnly,
    isLive,
    players,
    setPlayers,
    tournamentName,
    setTournamentName,
    courtCount,
    setCourtCount,
    defaultWinningGames,
    setDefaultWinningGames,
    rounds,
    setRounds,
    participantType,
    setParticipantType,
    scheduledStart,
    setScheduledStart,
    expectedDurationMinutes,
    setExpectedDurationMinutes,
    breakBetweenMatchesMinutes,
    setBreakBetweenMatchesMinutes,
  } = useTournamentLiveState()
  const [sort, setSort] = useState('position')
  const [desc, setDesc] = useState(true)
  const [draft, setDraft] = useState('')
  const bulkRef = useRef<HTMLDialogElement>(null)
  const bulkInputRef = useRef<HTMLTextAreaElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    document.title = `${tournamentName} — Tournament Manager`
  }, [tournamentName])
  useEffect(() => {
    if (readOnly || !scheduledStart) return
    const startAt = new Date(scheduledStart).getTime()
    if (!Number.isFinite(startAt)) return
    const startScheduledRound = () => {
      if (Date.now() < startAt) return
      if (players.filter((player) => !player.withdrawn).length < 2) return
      setRounds((current) => {
        if (current.some((round) => round.startedAt)) return current
        const existing = current[0]
        const plan = createRoundPlan(players, [], 1)
        const firstRound = existing
          ? {
              ...existing,
              bye: plan.bye,
              matches: existing.matches.length ? existing.matches : plan.matches,
              standings: plan.standings,
            }
          : {
              number: 1,
              bye: plan.bye,
              winningGames: defaultWinningGames,
              courtCount,
              matches: plan.matches,
              standings: plan.standings,
            }
        const next = existing ? [firstRound, ...current.slice(1)] : [firstRound]
        return assignCourtsToMatches(
          startRoundInRounds(next, 1, new Date(startAt).toISOString()),
          courtCount,
          new Date(startAt).toISOString(),
        )
      })
      setScheduledStart('')
    }
    startScheduledRound()
    const timer = window.setInterval(startScheduledRound, 1000)
    return () => window.clearInterval(timer)
  }, [
    courtCount,
    defaultWinningGames,
    players,
    readOnly,
    scheduledStart,
    setRounds,
    setScheduledStart,
  ])

  const { standingsBeforeRounds, participantOrderByRound, sorted } = useTournamentDerivedState(
    players,
    rounds,
    sort,
    desc,
  )
  const scheduledRounds = useMemo(
    () =>
      calculateExpectedMatchStarts(
        rounds,
        courtCount,
        expectedDurationMinutes,
        breakBetweenMatchesMinutes,
        scheduledStart,
        Math.floor(players.filter((player) => !player.withdrawn).length / 2),
      ),
    [
      breakBetweenMatchesMinutes,
      courtCount,
      expectedDurationMinutes,
      players,
      rounds,
      scheduledStart,
    ],
  )
  useEffect(() => {
    setRounds((current) => {
      let changed = false
      const next = current.map((round, index) => {
        const scheduledRound = scheduledRounds[index]
        if (!scheduledRound) return round
        const matchesChanged = round.matches.some(
          (match, matchIndex) =>
            match.predictedStart !== scheduledRound.matches[matchIndex]?.predictedStart,
        )
        if (!matchesChanged && round.predictedStart === scheduledRound.predictedStart) {
          return round
        }
        changed = true
        return {
          ...round,
          predictedStart: scheduledRound.predictedStart,
          matches: round.matches.map((match, matchIndex) => ({
            ...match,
            predictedStart: scheduledRound.matches[matchIndex]?.predictedStart,
          })),
        }
      })
      return changed ? next : current
    })
  }, [scheduledRounds, setRounds])
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

    return `${t('roundPoints')}: ${player.wins}${result ? ` -> ${nextWins}` : ''}`
  }
  const toggleSort = (key: string) =>
    sort === key ? setDesc((value) => !value) : (setSort(key), setDesc(key !== 'name'))
  const updateRound = (index: number, matches: Round['matches']) =>
    setRounds((current) => {
      const previousMatches = current[index]?.matches ?? []
      const completedMatch = matches.some((match) => {
        const previousMatch = previousMatches.find((item) => item.id === match.id)
        const winningGames = Math.max(1, current[index]?.winningGames || 1)
        return (
          getMatchResult(match, winningGames) &&
          !getMatchResult(previousMatch ?? match, winningGames)
        )
      })
      const nextStart = new Date(
        Date.now() + (completedMatch ? breakBetweenMatchesMinutes * 60_000 : 0),
      ).toISOString()
      return startReadyRounds(
        current.map((round, roundIndex) => (roundIndex === index ? { ...round, matches } : round)),
        courtCount,
        nextStart,
      )
    })
  const startRound = (number: number) =>
    setRounds((current) => assignCourtsToMatches(startRoundInRounds(current, number), courtCount))
  const swapRoundPlayers = (roundIndex: number, draggedId: string, targetId: string) =>
    setRounds((current) => swapRoundPlayersInRounds(current, roundIndex, draggedId, targetId))
  const updateParticipantOrder = (ordered: Participant[]) => {
    setPlayers(ordered)
    setRounds((current) =>
      current.some((round) => round.matches.some((match) => hasEnteredScore(match)))
        ? current
        : rerollRound(ordered, current, 1),
    )
  }
  const reorderParticipants = (draggedId: string, targetId: string) => {
    const next = [...players]
    const from = next.findIndex((player) => player.id === draggedId)
    const to = next.findIndex((player) => player.id === targetId)
    if (from < 0 || to < 0) return
    const [dragged] = next.splice(from, 1)
    next.splice(to, 0, dragged)
    updateParticipantOrder(next)
  }
  const shuffleParticipants = () => {
    const next = [...players]
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    }
    updateParticipantOrder(next)
  }
  const makeRound = () => {
    if (players.filter((player) => !player.withdrawn).length < 2) return
    setRounds((current) => {
      const number = current.length + 1
      const previousRound = current.at(-1)
      return [
        ...current,
        {
          number,
          bye: null,
          winningGames: previousRound?.winningGames ?? defaultWinningGames,
          courtCount: previousRound?.courtCount ?? courtCount,
          matches: [],
        },
      ]
    })
  }
  const addBulk = () => {
    const names = draft
      .split('\n')
      .map((nameValue) => nameValue.trim())
      .filter(Boolean)
    setPlayers((current) => [...current, ...names.map(createParticipant)])
    setDraft('')
    bulkRef.current?.close()
  }
  const rename = (player: Participant, value: string) =>
    setPlayers((current) =>
      current.map((item) => (item.id === player.id ? { ...item, name: value } : item)),
    )
  const deleteAll = () => {
    setPlayers([])
    setRounds([])
    confirmRef.current?.close()
  }
  const exportTournament = () =>
    downloadTournament({
      version: 1,
      tournamentName,
      players,
      rounds,
      participantType,
      courtCount,
      defaultWinningGames,
      expectedDurationMinutes,
      breakBetweenMatchesMinutes,
      scheduledStart,
    })
  const importTournament = async (file: File) => {
    try {
      const snapshot = parseTournamentSnapshot(JSON.parse(await file.text()))
      if (!snapshot) return false
      setTournamentName(snapshot.tournamentName)
      setPlayers(snapshot.players)
      setRounds(startReadyRounds(snapshot.rounds, snapshot.courtCount))
      setParticipantType(snapshot.participantType)
      setCourtCount(snapshot.courtCount)
      setDefaultWinningGames(snapshot.defaultWinningGames)
      setExpectedDurationMinutes(snapshot.expectedDurationMinutes ?? 25)
      setBreakBetweenMatchesMinutes(snapshot.breakBetweenMatchesMinutes ?? 5)
      setScheduledStart(snapshot.scheduledStart ?? '')
      return true
    } catch {
      return false
    }
  }
  const routes: AppRoutesProps = {
    tournamentName,
    localMaster,
    readOnly,
    players,
    participantLabel,
    rounds: scheduledRounds,
    participantType,
    courtCount,
    defaultWinningGames,
    scheduledStart,
    name,
    record: recordBeforeRound,
    participantOrderByRound,
    sorted,
    sort,
    desc,
    onAdd: () => openBulkDialog(bulkRef.current, bulkInputRef.current),
    onDeleteParticipant: (id) =>
      setPlayers((current) => current.filter((player) => player.id !== id)),
    onRename: rename,
    onToggleWithdraw: (id) => setPlayers((current) => toggleParticipantWithdrawal(current, id)),
    onReorderParticipants: reorderParticipants,
    onShuffleParticipants: shuffleParticipants,
    onToggleSort: toggleSort,
    onCreateRound: makeRound,
    onStartRound: startRound,
    onUpdateRound: updateRound,
    onSetRoundSettings: (number, winningGames, roundCourtCount) =>
      setRounds((current) =>
        updateRoundSettings(current, number, winningGames, roundCourtCount, courtCount),
      ),
    onDeleteRound: (number) =>
      setRounds((current) => deleteRoundAndStartReadyRounds(current, number, courtCount)),
    onFillUnknown: (number) =>
      setRounds((current) => fillRoundAndStartReadyRounds(current, number, players, courtCount)),
    onReroll: (number) =>
      setRounds((current) => rerollRoundAndStartReadyRounds(players, current, number, courtCount)),
    onSwapPlayers: swapRoundPlayers,
    setParticipantType,
    setCourtCount: (value) => {
      setCourtCount(value)
      setRounds((current) => updateRoundsForCourtCount(current, value))
    },
    setDefaultWinningGames,
    setTournamentName,
    setScheduledStart,
    expectedDurationMinutes,
    breakBetweenMatchesMinutes,
    setExpectedDurationMinutes,
    setBreakBetweenMatchesMinutes,
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
      onAddParticipants: addBulk,
      onDeleteAllConfirmed: deleteAll,
    },
  }
}
