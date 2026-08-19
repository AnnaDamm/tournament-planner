import type { RefObject } from 'react'
import { AppDialogs } from './AppDialogs'
import { AppRoutes, type AppRoutesProps } from './AppRoutes'

type Props = AppRoutesProps & {
  bulkRef: RefObject<HTMLDialogElement | null>
  confirmRef: RefObject<HTMLDialogElement | null>
  draft: string
  setDraft: (value: string) => void
  onAddParticipants: () => void
  onDeleteAllConfirmed: () => void
}

export function AppContent({
  bulkRef,
  confirmRef,
  draft,
  setDraft,
  onAddParticipants,
  onDeleteAllConfirmed,
  ...routeProps
}: Props) {
  return (
    <>
      <AppRoutes {...routeProps} />
      <AppDialogs
        participantType={routeProps.participantType}
        bulkRef={bulkRef}
        confirmRef={confirmRef}
        draft={draft}
        setDraft={setDraft}
        onAdd={onAddParticipants}
        onDeleteAll={onDeleteAllConfirmed}
      />
    </>
  )
}
