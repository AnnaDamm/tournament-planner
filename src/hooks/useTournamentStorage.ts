import { useEffect, useRef } from 'react'
import {
  loadParticipantType,
  loadParticipants,
  loadRounds,
  loadCourtCount,
  loadDefaultWinningGames,
  loadTournamentName,
  saveParticipantType,
  saveParticipants,
  saveRounds,
  saveCourtCount,
  saveDefaultWinningGames,
  saveTournamentName,
  subscribeToStorage,
  type StorageKey,
} from '../storage'
import type { Participant, Round } from '../tournamentTypes'

export function useTournamentStorage(
  players: Participant[],
  setPlayers: (value: Participant[] | ((current: Participant[]) => Participant[])) => void,
  rounds: Round[],
  setRounds: (value: Round[] | ((current: Round[]) => Round[])) => void,
  participantType: 'players' | 'teams',
  setParticipantType: (value: 'players' | 'teams') => void,
  courtCount: number,
  setCourtCount: (value: number) => void,
  defaultWinningGames: number,
  setDefaultWinningGames: (value: number) => void,
  tournamentName: string,
  setTournamentName: (value: string) => void,
  enabled = true,
) {
  const skipRemoteSave = useRef<Set<StorageKey>>(new Set())

  useEffect(() => {
    if (!enabled) return
    return subscribeToStorage((key) => {
      skipRemoteSave.current.add(key)
      if (key === 'players') setPlayers(loadParticipants())
      if (key === 'rounds') setRounds(loadRounds())
      if (key === 'participantType') setParticipantType(loadParticipantType())
      if (key === 'courtCount') setCourtCount(loadCourtCount())
      if (key === 'defaultWinningGames') setDefaultWinningGames(loadDefaultWinningGames())
      if (key === 'tournamentName') setTournamentName(loadTournamentName())
    })
  }, [
    setCourtCount,
    setDefaultWinningGames,
    setParticipantType,
    setPlayers,
    setRounds,
    setTournamentName,
    enabled,
  ])
  useEffect(() => {
    if (!enabled) return
    if (skipRemoteSave.current.delete('players')) return
    saveParticipants(players)
  }, [enabled, players])
  useEffect(() => {
    if (!enabled) return
    if (skipRemoteSave.current.delete('rounds')) return
    saveRounds(rounds)
  }, [enabled, rounds])
  useEffect(() => {
    if (!enabled) return
    if (skipRemoteSave.current.delete('participantType')) return
    saveParticipantType(participantType)
  }, [enabled, participantType])
  useEffect(() => {
    if (!enabled) return
    if (skipRemoteSave.current.delete('courtCount')) return
    saveCourtCount(courtCount)
  }, [courtCount, enabled])
  useEffect(() => {
    if (!enabled) return
    if (skipRemoteSave.current.delete('defaultWinningGames')) return
    saveDefaultWinningGames(defaultWinningGames)
  }, [defaultWinningGames, enabled])
  useEffect(() => {
    if (!enabled) return
    if (skipRemoteSave.current.delete('tournamentName')) return
    saveTournamentName(tournamentName)
  }, [enabled, tournamentName])
}
