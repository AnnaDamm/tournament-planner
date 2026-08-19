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
  getRunningMatchIdsByRound,
  isUnknownParticipantId,
  rerollRound,
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

  const { standingsBeforeRounds, sorted } = useTournamentDerivedState(players, rounds, sort, desc)
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
    return player ? `${player.wins}:${player.losses}` : '—'
  }
  const toggleSort = (key: string) =>
    sort === key ? setDesc((value) => !value) : (setSort(key), setDesc(key !== 'name'))
  const updateRound = (index: number, matches: Round['matches']) =>
    setRounds((current) =>
      startReadyRounds(
        current.map((round, roundIndex) => (roundIndex === index ? { ...round, matches } : round)),
        courtCount,
      ),
    )
  const startRound = (number: number) => setRounds((current) => startRoundInRounds(current, number))
  const swapRoundPlayers = (roundIndex: number, draggedId: string, targetId: string) =>
    setRounds((current) => swapRoundPlayersInRounds(current, roundIndex, draggedId, targetId))
  const makeRound = () => {
    if (players.filter((player) => !player.withdrawn).length < 2) return
    setRounds((current) => {
      const number = current.length + 1
      const plan = createRoundPlan(players, current, number)
      const previousRound = current.at(-1)
      return startReadyRounds(
        [
          ...current,
          {
            number,
            bye: plan.bye,
            winningGames: previousRound?.winningGames ?? defaultWinningGames,
            courtCount: previousRound?.courtCount ?? courtCount,
            matches: plan.matches,
            standings: plan.standings,
          },
        ],
        courtCount,
      )
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
    })
  const importTournament = async (file: File) => {
    try {
      const snapshot = parseTournamentSnapshot(JSON.parse(await file.text()))
      if (!snapshot) return false
      setTournamentName(snapshot.tournamentName)
      setPlayers(snapshot.players)
      setRounds(snapshot.rounds)
      setParticipantType(snapshot.participantType)
      setCourtCount(snapshot.courtCount)
      setDefaultWinningGames(snapshot.defaultWinningGames)
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
    rounds,
    participantType,
    courtCount,
    defaultWinningGames,
    name,
    record: recordBeforeRound,
    sorted,
    sort,
    desc,
    onAdd: () => openBulkDialog(bulkRef.current, bulkInputRef.current),
    onDeleteParticipant: (id) =>
      setPlayers((current) => current.filter((player) => player.id !== id)),
    onRename: rename,
    onToggleWithdraw: (id) => setPlayers((current) => toggleParticipantWithdrawal(current, id)),
    onToggleSort: toggleSort,
    onCreateRound: makeRound,
    onStartRound: startRound,
    onUpdateRound: updateRound,
    onSetRoundSettings: (number, winningGames, roundCourtCount) =>
      setRounds((current) => buildRoundWithResult(current, number, winningGames, roundCourtCount)),
    onDeleteRound: (number) =>
      setRounds((current) => current.filter((round) => round.number !== number)),
    onFillUnknown: (number) =>
      setRounds((current) => {
        const index = current.findIndex((round) => round.number === number)
        if (index < 0) return current
        const previousRounds = current.slice(0, index)
        const filled = fillUnknownRound(current[index], players, previousRounds)
        return current.map((round, roundIndex) => (roundIndex === index ? filled : round))
      }),
    onReroll: (number) => setRounds((current) => rerollRound(players, current, number)),
    onSwapPlayers: swapRoundPlayers,
    setParticipantType,
    setCourtCount: (value) => {
      setCourtCount(value)
      setRounds((current) => updateRoundsForCourtCount(current, value))
    },
    setDefaultWinningGames,
    setTournamentName,
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
