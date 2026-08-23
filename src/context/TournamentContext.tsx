import { createContext, useContext, type ReactNode } from 'react'
import type { RefObject } from 'react'
import { useTournamentController } from '../hooks/useTournamentController'
import type { LocalMasterConfig } from '../liveSharing'

export type TournamentSession = {
  localMaster: LocalMasterConfig | null
  readOnly: boolean
  isLive: boolean
}

export type TournamentDialogRefs = {
  bulkRef: RefObject<HTMLDialogElement | null>
  bulkInputRef: RefObject<HTMLTextAreaElement | null>
  confirmRef: RefObject<HTMLDialogElement | null>
}

export type TournamentDraft = {
  draft: string
  setDraft: (value: string) => void
}

type TournamentContexts = {
  session: TournamentSession
  dialogRefs: TournamentDialogRefs
  draft: TournamentDraft
}

const TournamentSessionContext = createContext<TournamentSession | null>(null)
const TournamentDialogRefsContext = createContext<TournamentDialogRefs | null>(null)
const TournamentDraftContext = createContext<TournamentDraft | null>(null)

export function useTournament() {
  const session = useContext(TournamentSessionContext)
  if (!session) throw new Error('useTournament must be used inside TournamentProvider')
  return session
}

export function useTournamentDialogRefs() {
  const dialogRefs = useContext(TournamentDialogRefsContext)
  if (!dialogRefs) throw new Error('useTournamentDialogRefs must be used inside TournamentProvider')
  return dialogRefs
}

export function useTournamentDraft() {
  const draft = useContext(TournamentDraftContext)
  if (!draft) throw new Error('useTournamentDraft must be used inside TournamentProvider')
  return draft
}

export function TournamentContextBridge({ children }: { children: ReactNode }) {
  const { session, dialogRefs, draft } = useTournamentController()
  const contexts: TournamentContexts = { session, dialogRefs, draft }

  return (
    <TournamentSessionContext.Provider value={contexts.session}>
      <TournamentDialogRefsContext.Provider value={contexts.dialogRefs}>
        <TournamentDraftContext.Provider value={contexts.draft}>
          {children}
        </TournamentDraftContext.Provider>
      </TournamentDialogRefsContext.Provider>
    </TournamentSessionContext.Provider>
  )
}
