import styles from './SetScores.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useId, type CSSProperties } from 'react'
import type { SetScore } from '../../tournamentTypes'
import { useTerm } from '../../i18n/useTerm'

type Props = {
  draftSets: SetScore[]
  visibleSetCount: number
  setCount: number
  readOnly: boolean
  playerA: string
  playerB: string
  /** Validation message per game (rules like darts reject some entries). */
  gameErrors?: Array<string | null>
  updateSet: (setIndex: number, side: 'a' | 'b', value: string) => void
  scheduleCommit: () => void
  keyboardMoveActive?: boolean
}

export function SetScores({
  draftSets,
  visibleSetCount,
  setCount,
  readOnly,
  playerA,
  playerB,
  gameErrors = [],
  updateSet,
  scheduleCommit,
  keyboardMoveActive = false,
}: Props) {
  const term = useTerm()
  const errorId = useId()
  const setScoresStyle = { '--set-count': setCount } as CSSProperties

  return (
    <div
      className={classNames(sharedStyles, styles, 'set-scores')}
      style={setScoresStyle}
      inert={keyboardMoveActive}
    >
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
              aria-label={`${term('gameScore')} ${setIndex + 1}: ${playerA}`}
              aria-invalid={gameErrors[setIndex] ? true : undefined}
              aria-describedby={gameErrors[setIndex] ? `${errorId}-${setIndex}` : undefined}
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
              aria-label={`${term('gameScore')} ${setIndex + 1}: ${playerB}`}
              aria-invalid={gameErrors[setIndex] ? true : undefined}
              aria-describedby={gameErrors[setIndex] ? `${errorId}-${setIndex}` : undefined}
              value={set.b}
              onChange={(event) => updateSet(setIndex, 'b', event.target.value)}
              onKeyUp={scheduleCommit}
              onBlur={scheduleCommit}
            />
          )}
        </div>
      ))}
      {gameErrors.map(
        (error, index) =>
          error && (
            <p
              key={index}
              id={`${errorId}-${index}`}
              className={classNames(sharedStyles, styles, 'score-error')}
              role="alert"
            >
              {term('gameScore')} {index + 1}: {error}
            </p>
          ),
      )}
    </div>
  )
}
