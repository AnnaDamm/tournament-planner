import { useTournament } from '../context/TournamentContext'
import { AppContent } from './AppContent'
import { AppLayout } from './AppLayout'

export function TournamentApp() {
  const { layout } = useTournament()
  return (
    <AppLayout {...layout}>
      <AppContent />
    </AppLayout>
  )
}
