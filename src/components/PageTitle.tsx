import type { ReactNode } from 'react'

type Props = { title: string; children?: ReactNode }

export function PageTitle({ title, children }: Props) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  )
}
