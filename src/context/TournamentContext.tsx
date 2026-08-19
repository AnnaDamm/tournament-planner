import { createContext, useContext, type ReactNode } from 'react'
import type { RefObject } from 'react'
import type { AppRoutesProps } from '../components/AppRoutes'
import { useTournamentController } from '../hooks/useTournamentController'
import type { LocalMasterConfig } from '../liveSharing'

type LayoutState = {
  tournamentName: string
  localMaster: LocalMasterConfig | null
  readOnly: boolean
  isLive: boolean
  participantNames: string[]
  participantTargets: { participantName: string; participantId: string }[]
  nextMatchTargets: { participantName: string; matchId: string }[]
  roundCount: number
  currentRound: number
}

type DialogState = {
  bulkRef: RefObject<HTMLDialogElement | null>
  bulkInputRef: RefObject<HTMLTextAreaElement | null>
  confirmRef: RefObject<HTMLDialogElement | null>
  draft: string
  setDraft: (value: string) => void
  onAddParticipants: () => void
  onDeleteAllConfirmed: () => void
}

export type TournamentContextValue = {
  layout: LayoutState
  routes: AppRoutesProps
  dialogs: DialogState
}

const TournamentContext = createContext<TournamentContextValue | null>(null)

export function useTournament() {
  const context = useContext(TournamentContext)
  if (!context) throw new Error('useTournament must be used inside TournamentProvider')
  return context
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const value = useTournamentController()
  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}
