import { AppDialogs } from './AppDialogs'
import { AppRoutes } from './AppRoutes'
import { useTournament } from '../context/TournamentContext'

export function AppContent() {
  const { layout, routes, dialogs } = useTournament()
  return (
    <>
      <AppRoutes {...routes} />
      {!layout.readOnly && (
        <AppDialogs
          participantType={routes.participantType}
          bulkRef={dialogs.bulkRef}
          bulkInputRef={dialogs.bulkInputRef}
          confirmRef={dialogs.confirmRef}
          draft={dialogs.draft}
          setDraft={dialogs.setDraft}
        />
      )}
    </>
  )
}
