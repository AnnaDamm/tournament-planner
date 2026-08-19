import { useEffect, useRef, useState } from 'react'
import type { LocalSession } from '../liveSharing'
import { parseTournamentSnapshot } from '../tournamentSnapshot'
import type { TournamentSnapshot } from '../tournamentTypes'

type Props = {
  session: LocalSession | null
  snapshot: TournamentSnapshot
  onSnapshot: (snapshot: TournamentSnapshot) => void
}

const snapshotRefreshInterval = 5_000

export function useLiveTournamentSync({ session, snapshot, onSnapshot }: Props) {
  const onSnapshotRef = useRef(onSnapshot)
  const publicationId = useRef(0)
  const [isLive, setIsLive] = useState(false)
  const masterSession = session?.role === 'master' ? session : null

  useEffect(() => {
    onSnapshotRef.current = onSnapshot
  }, [onSnapshot])

  useEffect(() => {
    if (!masterSession) return

    const controller = new AbortController()
    const publishSnapshot = () => {
      const currentPublicationId = ++publicationId.current
      void fetch('/api/snapshot', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(masterSession.relayToken ? { 'x-tourny-master': masterSession.relayToken } : {}),
        },
        body: JSON.stringify(snapshot),
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Snapshot publication failed')
          if (!controller.signal.aborted && currentPublicationId === publicationId.current) {
            setIsLive(true)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted && currentPublicationId === publicationId.current) {
            setIsLive(false)
          }
        })
    }

    publishSnapshot()
    const refresh = window.setInterval(publishSnapshot, snapshotRefreshInterval)

    return () => {
      window.clearInterval(refresh)
      controller.abort()
    }
  }, [masterSession, snapshot])

  useEffect(() => {
    if (session?.role !== 'viewer') return

    const events = new EventSource('/api/events')
    events.onmessage = (event) => {
      try {
        const incoming = parseTournamentSnapshot(JSON.parse(event.data))
        if (incoming) onSnapshotRef.current(incoming)
      } catch {
        // Invalid broadcasts are ignored; the next complete snapshot will replace them.
      }
    }

    return () => events.close()
  }, [session?.role])

  return isLive
}
