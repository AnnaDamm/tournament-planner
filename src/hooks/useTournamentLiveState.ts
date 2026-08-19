import { useMemo, useState } from 'react'
import {
  loadCourtCount,
  loadDefaultWinningGames,
  loadParticipantType,
  loadParticipants,
  loadRounds,
  loadTournamentName,
} from '../storage'
import { getLocalSession } from '../liveSharing'
import { startReadyRounds } from '../tournament'
import type { Participant, Round, TournamentSnapshot } from '../tournamentTypes'
import { useLiveTournamentSync } from './useLiveTournamentSync'
import { useTournamentStorage } from './useTournamentStorage'

export function useTournamentLiveState() {
  const localSession = useMemo(() => getLocalSession(), [])
  const localMaster = localSession?.role === 'master' ? localSession : null
  const readOnly = localSession?.role === 'viewer'
  const [players, setPlayers] = useState<Participant[]>(() => (readOnly ? [] : loadParticipants()))
  const [tournamentName, setTournamentName] = useState(() =>
    readOnly ? 'Tourny' : loadTournamentName(),
  )
  const [courtCount, setCourtCount] = useState(() => (readOnly ? 1 : loadCourtCount()))
  const [defaultWinningGames, setDefaultWinningGames] = useState(() =>
    readOnly ? 1 : loadDefaultWinningGames(),
  )
  const [rounds, setRounds] = useState<Round[]>(() =>
    readOnly ? [] : startReadyRounds(loadRounds(), loadCourtCount()),
  )
  const [participantType, setParticipantType] = useState<'players' | 'teams'>(() =>
    readOnly ? 'players' : loadParticipantType(),
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
    }),
    [courtCount, defaultWinningGames, participantType, players, rounds, tournamentName],
  )

  const isLive = useLiveTournamentSync({
    session: localSession,
    snapshot,
    onSnapshot: (incoming) => {
      setTournamentName(incoming.tournamentName)
      setPlayers(incoming.players)
      setRounds(incoming.rounds)
      setParticipantType(incoming.participantType)
      setCourtCount(incoming.courtCount)
      setDefaultWinningGames(incoming.defaultWinningGames)
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
  }
}
