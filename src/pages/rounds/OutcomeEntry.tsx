import styles from './OutcomeEntry.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { t, tf } from '../../i18n'
import type { MatchOutcome } from '../../domain/types'

type Props = {
  outcome: MatchOutcome | undefined
  allowsDraw: boolean
  readOnly: boolean
  playerA: string
  playerB: string
  onChange: (outcome: MatchOutcome | undefined) => void
  keyboardMoveActive?: boolean
}

/** Score-less result entry: "A wins", "Draw", "B wins"; pressing the chosen one again clears it. */
export function OutcomeEntry({
  outcome,
  allowsDraw,
  readOnly,
  playerA,
  playerB,
  onChange,
  keyboardMoveActive = false,
}: Props) {
  const options: Array<{ value: MatchOutcome; label: string; short: string }> = [
    { value: 'a', label: tf('sportsOutcomeWins', { name: playerA }), short: '1' },
    ...(allowsDraw ? [{ value: 'draw' as const, label: t('draw'), short: t('draw') }] : []),
    { value: 'b', label: tf('sportsOutcomeWins', { name: playerB }), short: '2' },
  ]
  const current = options.find((option) => option.value === outcome)
  if (readOnly) {
    return (
      <div className={classNames(sharedStyles, styles, 'outcome-entry')}>
        <span className={classNames(sharedStyles, styles, 'outcome-value')}>
          {current ? current.label : '–'}
        </span>
      </div>
    )
  }
  return (
    <fieldset
      className={classNames(sharedStyles, styles, 'outcome-entry')}
      inert={keyboardMoveActive}
    >
      <legend className={classNames(sharedStyles, 'sr-only')}>
        {tf('sportsOutcomeLegend', { a: playerA, b: playerB })}
      </legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={classNames(sharedStyles, styles, 'outcome-button')}
          aria-pressed={outcome === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(outcome === option.value ? undefined : option.value)}
        >
          {option.short}
        </button>
      ))}
    </fieldset>
  )
}
