import type { ReactNode, RefObject } from 'react'

type Props = {
  dialogRef: RefObject<HTMLDialogElement | null>
  children: ReactNode
  labelledBy: string
  describedBy?: string
}

export function Dialog({ dialogRef, children, labelledBy, describedBy }: Props) {
  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {children}
    </dialog>
  )
}
