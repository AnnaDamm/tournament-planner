import { useCallback } from 'react'
import { getPhaseScope } from '../domain/phases/scope'
import type { Participant, Round } from '../domain/types'
import { useAppSelector } from '../storeHooks'
import { selectPhases, selectScoring, selectTieBreakers } from '../tournamentSelectors'

/** Looks up entrants, rounds and evaluation context of a phase for the given players and rounds. */
export const usePhaseScopes = (players: Participant[], rounds: Round[]) => {
  const phases = useAppSelector(selectPhases)
  const scoring = useAppSelector(selectScoring)
  const tieBreakers = useAppSelector(selectTieBreakers)
  return useCallback(
    (phaseId: string) => getPhaseScope({ players, rounds, scoring, tieBreakers, phases }, phaseId),
    [phases, players, rounds, scoring, tieBreakers],
  )
}
