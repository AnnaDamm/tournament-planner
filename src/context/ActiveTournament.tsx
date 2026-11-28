import { useMemo, type ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { TournamentContextBridge } from './TournamentContext'
import { useTournamentPersistence } from '../hooks/useTournamentPersistence'
import type { PersistedTournamentState } from '../storage'
import { createTournamentStore } from '../store'

type Props = {
  loaded: PersistedTournamentState
  writable: boolean
  children: ReactNode
}

/** Holds the store of one tournament; the provider remounts it (key = id) when the active one changes. */
export function ActiveTournament({ loaded, writable, children }: Props) {
  const store = useMemo(() => createTournamentStore(loaded.snapshot), [loaded.snapshot])
  useTournamentPersistence({ store, initialRevision: loaded.revision, writable })

  return (
    <ReduxProvider store={store}>
      <TournamentContextBridge>{children}</TournamentContextBridge>
    </ReduxProvider>
  )
}
