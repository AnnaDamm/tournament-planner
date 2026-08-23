import styles from './SetScores.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import type { CSSProperties } from 'react'
import type { SetScore } from '../tournamentTypes'
import { t } from '../i18n'

type Props = {
  draftSets: SetScore[]
  visibleSetCount: number
  maxSetCount: number
  readOnly: boolean
  playerA: string
  playerB: string
  updateSet: (setIndex: number, side: 'a' | 'b', value: string) => void
  scheduleCommit: () => void
}

export function SetScores({
  draftSets,
  visibleSetCount,
  maxSetCount,
  readOnly,
  playerA,
  playerB,
  updateSet,
  scheduleCommit,
}: Props) {
  const setScoresStyle = { '--set-count': maxSetCount } as CSSProperties

  return (
    <div className={classNames(sharedStyles, styles, 'set-scores')} style={setScoresStyle}>
      {Array.from(
        { length: visibleSetCount },
        (_, setIndex) => draftSets[setIndex] ?? { a: '', b: '' },
      ).map((set, setIndex) => (
        <div
          className={classNames(sharedStyles, styles, `score${readOnly ? ' score-readonly' : ''}`)}
          key={setIndex}
        >
          {readOnly ? (
            <span className={classNames(sharedStyles, styles, 'score-value')}>{set.a || '–'}</span>
          ) : (
            <input
              type="number"
              min="0"
              aria-label={`${t('setScore')} ${setIndex + 1}: ${playerA}`}
              value={set.a}
              onChange={(event) => updateSet(setIndex, 'a', event.target.value)}
              onKeyUp={scheduleCommit}
              onBlur={scheduleCommit}
            />
          )}
          <b aria-hidden="true">:</b>
          {readOnly ? (
            <span className={classNames(sharedStyles, styles, 'score-value')}>{set.b || '–'}</span>
          ) : (
            <input
              type="number"
              min="0"
              aria-label={`${t('setScore')} ${setIndex + 1}: ${playerB}`}
              value={set.b}
              onChange={(event) => updateSet(setIndex, 'b', event.target.value)}
              onKeyUp={scheduleCommit}
              onBlur={scheduleCommit}
            />
          )}
        </div>
      ))}
    </div>
  )
}
