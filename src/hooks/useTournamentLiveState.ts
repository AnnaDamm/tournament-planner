import { useMemo, useState } from 'react'
import {
  loadCourtCount,
  loadDefaultWinningGames,
  loadParticipantType,
  loadParticipants,
  loadRounds,
  loadTournamentName,
  loadScheduledStart,
  loadExpectedDurationMinutes,
  loadBreakBetweenMatchesMinutes,
  getDefaultScheduledStart,
} from '../storage'
import { getLocalSession, isReadOnlyTab } from '../liveSharing'
import { startReadyRounds } from '../tournament'
import type { Participant, Round, TournamentSnapshot } from '../tournamentTypes'
import { useLiveTournamentSync } from './useLiveTournamentSync'
import { useTournamentStorage } from './useTournamentStorage'

export function useTournamentLiveState() {
  const localSession = useMemo(() => getLocalSession(), [])
  const readOnlyTab = isReadOnlyTab()
  const localMaster = localSession?.role === 'master' ? localSession : null
  const isViewer = localSession?.role === 'viewer'
  const readOnly = isViewer || readOnlyTab
  const syncSession = readOnlyTab ? null : localSession
  const [players, setPlayers] = useState<Participant[]>(() => (isViewer ? [] : loadParticipants()))
  const [tournamentName, setTournamentName] = useState(() =>
    isViewer ? 'Tourny' : loadTournamentName(),
  )
  const [courtCount, setCourtCount] = useState(() => (isViewer ? 1 : loadCourtCount()))
  const [defaultWinningGames, setDefaultWinningGames] = useState(() =>
    isViewer ? 1 : loadDefaultWinningGames(),
  )
  const initialRounds = useMemo(
    () => (isViewer ? [] : startReadyRounds(loadRounds(), loadCourtCount())),
    [isViewer],
  )
  const [rounds, setRounds] = useState<Round[]>(initialRounds)
  const [participantType, setParticipantType] = useState<'players' | 'teams'>(() =>
    isViewer ? 'players' : loadParticipantType(),
  )
  const [scheduledStart, setScheduledStart] = useState(() => {
    if (isViewer) return ''
    const storedStart = loadScheduledStart()
    return (
      storedStart ||
      (initialRounds.some((round) => round.startedAt) ? '' : getDefaultScheduledStart())
    )
  })
  const [expectedDurationMinutes, setExpectedDurationMinutes] = useState(() =>
    isViewer ? 25 : loadExpectedDurationMinutes(),
  )
  const [breakBetweenMatchesMinutes, setBreakBetweenMatchesMinutes] = useState(() =>
    isViewer ? 5 : loadBreakBetweenMatchesMinutes(),
  )

  useTournamentStorage(
    players,
    setPlayers,
    rounds,
    setRounds,
    participantType,
    setParticipantType,
    courtCount,
    setCourtCount,
    defaultWinningGames,
    setDefaultWinningGames,
    tournamentName,
    setTournamentName,
    scheduledStart,
    setScheduledStart,
    expectedDurationMinutes,
    setExpectedDurationMinutes,
    breakBetweenMatchesMinutes,
    setBreakBetweenMatchesMinutes,
    true,
    !readOnly,
  )

  const snapshot = useMemo<TournamentSnapshot>(
    () => ({
      version: 1,
      tournamentName,
      players,
      rounds,
      participantType,
      courtCount,
      defaultWinningGames,
      scheduledStart,
      expectedDurationMinutes,
      breakBetweenMatchesMinutes,
    }),
    [
      courtCount,
      defaultWinningGames,
      participantType,
      players,
      rounds,
      scheduledStart,
      tournamentName,
      expectedDurationMinutes,
      breakBetweenMatchesMinutes,
    ],
  )

  const isLive = useLiveTournamentSync({
    session: syncSession,
    snapshot,
    onSnapshot: (incoming) => {
      setTournamentName(incoming.tournamentName)
      setPlayers(incoming.players)
      setRounds(startReadyRounds(incoming.rounds, incoming.courtCount))
      setParticipantType(incoming.participantType)
      setCourtCount(incoming.courtCount)
      setDefaultWinningGames(incoming.defaultWinningGames)
      setScheduledStart(incoming.scheduledStart ?? '')
      setExpectedDurationMinutes(incoming.expectedDurationMinutes ?? 25)
      setBreakBetweenMatchesMinutes(incoming.breakBetweenMatchesMinutes ?? 5)
    },
  })

  return {
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
  }
}
