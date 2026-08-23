import { useCallback } from 'react'
import { AppDialogs } from './AppDialogs'
import { AppRoutes } from './AppRoutes'
import { useTournament, useTournamentDialogRefs } from '../context/TournamentContext'

type Props = {
  onKeyboardMoveActiveChange: (active: boolean) => void
}

export function AppContent({ onKeyboardMoveActiveChange }: Props) {
  const { localMaster, readOnly } = useTournament()
  const { bulkRef, bulkInputRef, confirmRef } = useTournamentDialogRefs()
  const onAdd = useCallback(() => {
    const dialog = bulkRef.current
    if (!dialog) return
    dialog.showModal()
    window.setTimeout(() => {
      if (dialog.open) bulkInputRef.current?.focus()
    }, 0)
  }, [bulkInputRef, bulkRef])
  const onDeleteAll = useCallback(() => confirmRef.current?.showModal(), [confirmRef])

  return (
    <>
      <AppRoutes
        localMaster={localMaster}
        readOnly={readOnly}
        onAdd={onAdd}
        onDeleteAll={onDeleteAll}
        onKeyboardMoveActiveChange={onKeyboardMoveActiveChange}
      />
      {!readOnly && <AppDialogs />}
    </>
  )
}
