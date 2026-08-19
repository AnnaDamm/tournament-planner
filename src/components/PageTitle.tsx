import type { ReactNode } from 'react'

type Props = { eyebrow: string; title: string; children?: ReactNode }

export function PageTitle({ eyebrow, title, children }: Props) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  )
}
