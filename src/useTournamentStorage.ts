import { useEffect, useRef } from 'react'
import {
  loadParticipantType,
  loadParticipants,
  loadRounds,
  saveParticipantType,
  saveParticipants,
  saveRounds,
  subscribeToStorage,
  type StorageKey,
  type Round,
} from './storage'
import type { Participant } from './components/Players'

export function useTournamentStorage(
  players: Participant[],
  setPlayers: (value: Participant[] | ((current: Participant[]) => Participant[])) => void,
  rounds: Round[],
  setRounds: (value: Round[] | ((current: Round[]) => Round[])) => void,
  participantType: 'players' | 'teams',
  setParticipantType: (value: 'players' | 'teams') => void,
) {
  const skipRemoteSave = useRef<Set<StorageKey>>(new Set())

  useEffect(
    () =>
      subscribeToStorage((key) => {
        skipRemoteSave.current.add(key)
        if (key === 'players') setPlayers(loadParticipants())
        if (key === 'rounds') setRounds(loadRounds())
        if (key === 'participantType') setParticipantType(loadParticipantType())
      }),
    [setParticipantType, setPlayers, setRounds],
  )
  useEffect(() => {
    if (skipRemoteSave.current.delete('players')) return
    saveParticipants(players)
  }, [players])
  useEffect(() => {
    if (skipRemoteSave.current.delete('rounds')) return
    saveRounds(rounds)
  }, [rounds])
  useEffect(() => {
    if (skipRemoteSave.current.delete('participantType')) return
    saveParticipantType(participantType)
  }, [participantType])
}
