import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ActiveTournament } from './ActiveTournament'
import { loadTournamentState, subscribeToLibrary } from '../storage'
import { getLocalSession, isReadOnlyTab } from '../liveSharing'

export function TournamentProvider({ children }: { children: ReactNode }) {
  const localSession = useMemo(() => getLocalSession(), [])
  const readOnly = localSession?.role === 'viewer' || isReadOnlyTab()
  const isViewer = localSession?.role === 'viewer'
  const [loaded, setLoaded] = useState(() => loadTournamentState(isViewer))
  const activeIdRef = useRef(loaded.snapshot.id)

  useEffect(() => {
    // Viewers show the published tournament; everyone else follows the globally active one.
    if (isViewer) return
    return subscribeToLibrary((activeId) => {
      if (activeId === activeIdRef.current) return
      const next = loadTournamentState()
      activeIdRef.current = next.snapshot.id
      setLoaded(next)
    })
  }, [isViewer])

  return (
    <ActiveTournament key={loaded.snapshot.id} loaded={loaded} writable={!readOnly}>
      {children}
    </ActiveTournament>
  )
}
