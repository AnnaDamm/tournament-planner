import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  TournamentDialogRefs,
  TournamentDraft,
  TournamentSession,
} from '../context/TournamentContext'
import { getLocalSession, isReadOnlyTab } from '../liveSharing'
import { useAppDispatch, useAppSelector } from '../storeHooks'
import {
  selectScheduledRounds,
  selectScheduledStart,
  selectTournamentSnapshot,
} from '../tournamentSelectors'
import {
  importTournamentSnapshot,
  startScheduledRound,
  updatePredictedStarts,
} from '../tournamentCommands'
import { useLiveTournamentSync } from './useLiveTournamentSync'

type TournamentControllerState = {
  session: TournamentSession
  dialogRefs: TournamentDialogRefs
  draft: TournamentDraft
}

export function useTournamentController(): TournamentControllerState {
  const dispatch = useAppDispatch()
  const snapshot = useAppSelector(selectTournamentSnapshot)
  const scheduledRounds = useAppSelector(selectScheduledRounds)
  const scheduledStart = useAppSelector(selectScheduledStart)
  const localSession = useMemo(() => getLocalSession(), [])
  const readOnlyTab = isReadOnlyTab()
  const localMaster = localSession?.role === 'master' ? localSession : null
  const readOnly = localSession?.role === 'viewer' || readOnlyTab
  const syncSession = readOnlyTab ? null : localSession
  const [draft, setDraft] = useState('')
  const bulkRef = useRef<HTMLDialogElement>(null)
  const bulkInputRef = useRef<HTMLTextAreaElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    document.title = `${snapshot.tournamentName} — Tournament Manager`
  }, [snapshot.tournamentName])

  useEffect(() => {
    if (readOnly || !scheduledStart) return
    const startAt = new Date(scheduledStart).getTime()
    if (!Number.isFinite(startAt)) return
    const checkScheduledRound = () => {
      if (Date.now() < startAt) return
      dispatch(startScheduledRound(startAt))
    }
    checkScheduledRound()
    const timer = window.setInterval(checkScheduledRound, 1000)
    return () => window.clearInterval(timer)
  }, [dispatch, readOnly, scheduledStart])

  useEffect(() => {
    dispatch(updatePredictedStarts(scheduledRounds))
  }, [dispatch, scheduledRounds])

  const isLive = useLiveTournamentSync({
    session: syncSession,
    snapshot,
    onSnapshot: (incoming) => dispatch(importTournamentSnapshot(incoming)),
  })

  const session = useMemo(
    () => ({ localMaster, readOnly, isLive }),
    [isLive, localMaster, readOnly],
  )
  const dialogRefs = useMemo(
    () => ({ bulkRef, bulkInputRef, confirmRef }),
    [bulkInputRef, bulkRef, confirmRef],
  )
  const draftState = useMemo(() => ({ draft, setDraft }), [draft])

  return { session, dialogRefs, draft: draftState }
}
