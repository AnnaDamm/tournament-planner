import styles from './PageTitle.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import type { ReactNode } from 'react'

type Props = { title: string; children?: ReactNode }

export function PageTitle({ title, children }: Props) {
  return (
    <div className={classNames(sharedStyles, styles, 'page-title')}>
      <div>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  )
}
