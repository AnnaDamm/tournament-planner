import { useMemo, type ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { TournamentContextBridge } from './TournamentContext'
import { useTournamentPersistence } from '../hooks/useTournamentPersistence'
import { loadTournamentState } from '../storage'
import { createTournamentStore } from '../store'
import { getLocalSession, isReadOnlyTab } from '../liveSharing'

export function TournamentProvider({ children }: { children: ReactNode }) {
  const localSession = useMemo(() => getLocalSession(), [])
  const readOnly = localSession?.role === 'viewer' || isReadOnlyTab()
  const isViewer = localSession?.role === 'viewer'
  const loaded = useMemo(() => loadTournamentState(isViewer), [isViewer])
  const store = useMemo(() => createTournamentStore(loaded.snapshot), [loaded.snapshot])
  useTournamentPersistence({ store, initialRevision: loaded.revision, writable: !readOnly })

  return (
    <ReduxProvider store={store}>
      <TournamentContextBridge>{children}</TournamentContextBridge>
    </ReduxProvider>
  )
}
