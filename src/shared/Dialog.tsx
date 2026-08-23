import styles from './Dialog.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { useEffect, type ReactNode, type RefObject } from 'react'

type Props = {
  dialogRef: RefObject<HTMLDialogElement | null>
  children: ReactNode
  labelledBy: string
  describedBy?: string
}

export function Dialog({ dialogRef, children, labelledBy, describedBy }: Props) {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close()
    }
    dialog.addEventListener('click', handleBackdropClick)
    return () => dialog.removeEventListener('click', handleBackdropClick)
  }, [dialogRef])

  return (
    <dialog
      ref={dialogRef}
      className={classNames(sharedStyles, styles, 'dialog')}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {children}
    </dialog>
  )
}
