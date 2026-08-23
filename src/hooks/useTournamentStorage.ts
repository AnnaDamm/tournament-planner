import { useEffect, useRef } from 'react'
import {
  loadParticipantType,
  loadParticipants,
  loadRounds,
  loadCourtCount,
  loadDefaultWinningGames,
  loadDefaultSetPoints,
  loadTournamentName,
  loadScheduledStart,
  saveParticipantType,
  saveParticipants,
  saveRounds,
  saveCourtCount,
  saveDefaultWinningGames,
  saveDefaultSetPoints,
  saveTournamentName,
  saveScheduledStart,
  loadExpectedDurationMinutes,
  saveExpectedDurationMinutes,
  loadBreakBetweenMatchesMinutes,
  saveBreakBetweenMatchesMinutes,
  subscribeToStorage,
  type StorageKey,
} from '../storage'
import type { Participant, Round } from '../tournamentTypes'
import { startReadyRounds } from '../tournament'

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
  defaultSetPoints: number,
  setDefaultSetPoints: (value: number) => void,
  tournamentName: string,
  setTournamentName: (value: string) => void,
  scheduledStart: string,
  setScheduledStart: (value: string) => void,
  expectedDurationMinutes: number,
  setExpectedDurationMinutes: (value: number) => void,
  breakBetweenMatchesMinutes: number,
  setBreakBetweenMatchesMinutes: (value: number) => void,
  enabled = true,
  writable = enabled,
) {
  const skipRemoteSave = useRef<Set<StorageKey>>(new Set())

  useEffect(() => {
    if (!enabled) return
    return subscribeToStorage((key) => {
      skipRemoteSave.current.add(key)
      if (key === 'players') setPlayers(loadParticipants())
      if (key === 'rounds') setRounds(startReadyRounds(loadRounds(), loadCourtCount()))
      if (key === 'participantType') setParticipantType(loadParticipantType())
      if (key === 'courtCount') setCourtCount(loadCourtCount())
      if (key === 'defaultWinningGames') setDefaultWinningGames(loadDefaultWinningGames())
      if (key === 'defaultSetPoints') setDefaultSetPoints(loadDefaultSetPoints())
      if (key === 'tournamentName') setTournamentName(loadTournamentName())
      if (key === 'scheduledStart') setScheduledStart(loadScheduledStart())
      if (key === 'expectedDurationMinutes')
        setExpectedDurationMinutes(loadExpectedDurationMinutes())
      if (key === 'breakBetweenMatchesMinutes')
        setBreakBetweenMatchesMinutes(loadBreakBetweenMatchesMinutes())
    })
  }, [
    setCourtCount,
    setDefaultWinningGames,
    setDefaultSetPoints,
    setParticipantType,
    setPlayers,
    setRounds,
    setTournamentName,
    setScheduledStart,
    setExpectedDurationMinutes,
    setBreakBetweenMatchesMinutes,
    enabled,
  ])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('players')) return
    saveParticipants(players)
  }, [enabled, players, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('rounds')) return
    saveRounds(rounds)
  }, [enabled, rounds, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('participantType')) return
    saveParticipantType(participantType)
  }, [enabled, participantType, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('courtCount')) return
    saveCourtCount(courtCount)
  }, [courtCount, enabled, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('defaultWinningGames')) return
    saveDefaultWinningGames(defaultWinningGames)
  }, [defaultWinningGames, enabled, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('defaultSetPoints')) return
    saveDefaultSetPoints(defaultSetPoints)
  }, [defaultSetPoints, enabled, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('tournamentName')) return
    saveTournamentName(tournamentName)
  }, [enabled, tournamentName, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('scheduledStart')) return
    saveScheduledStart(scheduledStart)
  }, [enabled, scheduledStart, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('expectedDurationMinutes')) return
    saveExpectedDurationMinutes(expectedDurationMinutes)
  }, [enabled, expectedDurationMinutes, writable])
  useEffect(() => {
    if (!enabled || !writable) return
    if (skipRemoteSave.current.delete('breakBetweenMatchesMinutes')) return
    saveBreakBetweenMatchesMinutes(breakBetweenMatchesMinutes)
  }, [breakBetweenMatchesMinutes, enabled, writable])
}
