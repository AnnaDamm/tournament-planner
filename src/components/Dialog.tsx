import type { ReactNode, RefObject } from 'react'

type Props = { dialogRef: RefObject<HTMLDialogElement | null>; children: ReactNode }

export function Dialog({ dialogRef, children }: Props) {
  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
    >
      {children}
    </dialog>
  )
}
