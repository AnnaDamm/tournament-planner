import styles from './RoundSection.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import type { CSSProperties } from 'react'
import { t } from '../../i18n'

type Props = {
  maxSetCount: number
}

export function RoundMatchesHeader({ maxSetCount }: Props) {
  const setHeadersStyle = { '--set-count': maxSetCount } as CSSProperties

  return (
    <div className={classNames(sharedStyles, styles, 'matches-header')} aria-hidden="true" inert>
      <span className={classNames(sharedStyles, styles, 'match-heading match-heading-court')}>
        {t('court')}
      </span>
      <span className={classNames(sharedStyles, styles, 'match-heading match-heading-start')}>
        {t('start')}
      </span>
      <span className={classNames(sharedStyles, styles, 'match-heading match-heading-player-a')}>
        {t('players')}
      </span>
      <span className={classNames(sharedStyles, styles, 'match-heading match-heading-versus')}>
        VS
      </span>
      <span className={classNames(sharedStyles, styles, 'match-heading match-heading-player-b')}>
        {t('players')}
      </span>
      <div className={classNames(sharedStyles, styles, 'set-headers')} style={setHeadersStyle}>
        {Array.from({ length: maxSetCount }, (_, setIndex) => (
          <span className={classNames(sharedStyles, styles, 'set-label set-header')} key={setIndex}>
            {setIndex + 1}
          </span>
        ))}
      </div>
    </div>
  )
}
