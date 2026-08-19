import { AppDialogs } from './AppDialogs'
import { AppRoutes } from './AppRoutes'
import { useTournament } from '../context/TournamentContext'

export function AppContent() {
  const { routes, dialogs } = useTournament()
  return (
    <>
      <AppRoutes {...routes} />
      <AppDialogs
        participantType={routes.participantType}
        bulkRef={dialogs.bulkRef}
        confirmRef={dialogs.confirmRef}
        draft={dialogs.draft}
        setDraft={dialogs.setDraft}
        onAdd={dialogs.onAddParticipants}
        onDeleteAll={dialogs.onDeleteAllConfirmed}
      />
    </>
  )
}
