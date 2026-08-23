import { useTournament } from '../context/TournamentContext'
import { useAppSelector } from '../storeHooks'
import {
  selectCurrentRoundNumber,
  selectNextMatchTargets,
  selectParticipantNames,
  selectParticipantTargets,
  selectRoundCount,
  selectTournamentName,
} from '../tournamentSelectors'
import { AppContent } from './AppContent'
import { AppLayout } from './AppLayout'
import { useState } from 'react'

export function TournamentApp() {
  const { localMaster, readOnly, isLive } = useTournament()
  const [keyboardMoveActive, setKeyboardMoveActive] = useState(false)
  const tournamentName = useAppSelector(selectTournamentName)
  const participantNames = useAppSelector(selectParticipantNames)
  const participantTargets = useAppSelector(selectParticipantTargets)
  const nextMatchTargets = useAppSelector(selectNextMatchTargets)
  const roundCount = useAppSelector(selectRoundCount)
  const currentRound = useAppSelector(selectCurrentRoundNumber)

  return (
    <AppLayout
      tournamentName={tournamentName}
      localMaster={localMaster}
      readOnly={readOnly}
      isLive={isLive}
      participantNames={participantNames}
      participantTargets={participantTargets}
      nextMatchTargets={nextMatchTargets}
      roundCount={roundCount}
      currentRound={currentRound}
      keyboardMoveActive={keyboardMoveActive}
    >
      <AppContent onKeyboardMoveActiveChange={setKeyboardMoveActive} />
    </AppLayout>
  )
}
