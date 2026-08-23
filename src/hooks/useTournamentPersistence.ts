import { useEffect, useRef } from 'react'
import {
  createNextRevision,
  isNewerRevision,
  persistTournamentState,
  subscribeToTournamentState,
  type StateRevision,
} from '../storage'
import { type AppStore } from '../store'
import { snapshotHydrated } from '../tournamentSlice'

type Props = {
  store: AppStore
  initialRevision: StateRevision
  writable: boolean
}

export function useTournamentPersistence({ store, initialRevision, writable }: Props) {
  const revisionRef = useRef(initialRevision)
  const applyingRemoteRef = useRef(false)

  useEffect(() => {
    let previousSnapshot = store.getState().tournament
    const unsubscribeStore = store.subscribe(() => {
      const nextSnapshot = store.getState().tournament
      if (nextSnapshot === previousSnapshot) return
      previousSnapshot = nextSnapshot
      if (!writable || applyingRemoteRef.current) return

      const revision = createNextRevision(revisionRef.current)
      revisionRef.current = revision
      persistTournamentState(nextSnapshot, revision)
    })
    const unsubscribeExternal = subscribeToTournamentState((incoming) => {
      if (!isNewerRevision(incoming.revision, revisionRef.current)) return
      revisionRef.current = incoming.revision
      applyingRemoteRef.current = true
      store.dispatch(snapshotHydrated(incoming.snapshot))
      applyingRemoteRef.current = false
      if (writable) persistTournamentState(incoming.snapshot, incoming.revision, false)
    })

    return () => {
      unsubscribeStore()
      unsubscribeExternal()
    }
  }, [initialRevision, store, writable])
}
