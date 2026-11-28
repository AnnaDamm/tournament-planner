import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t, tf } from '../../../i18n'
import { useTerm } from '../../../i18n/useTerm'
import type { MessageKey } from '../../../i18n'
import type { MatchFormat } from '../../../domain/types'
import { NumberField } from '../../../shared/form/NumberField'

type Props = {
  idPrefix: string
  roundKey: MessageKey
  override: Partial<MatchFormat> | undefined
  defaultWinningGames: number
  disabled: boolean
  onChange: (override: Partial<MatchFormat>) => void
}

/** The own number of games to win for one knockout round (final, semifinals ...). */
export function RoundFormatField({
  idPrefix,
  roundKey,
  override,
  defaultWinningGames,
  disabled,
  onChange,
}: Props) {
  const term = useTerm()
  const round = t(roundKey)
  const hasOverride = override?.winningGames !== undefined
  return (
    <div className={classNames(sharedStyles, 'settings-field')}>
      <label htmlFor={`${idPrefix}-own`} className={classNames(sharedStyles, 'check')}>
        <input
          id={`${idPrefix}-own`}
          type="checkbox"
          disabled={disabled}
          checked={hasOverride}
          onChange={(event) =>
            onChange(event.currentTarget.checked ? { winningGames: defaultWinningGames } : {})
          }
        />{' '}
        {tf('eliminationOwnFormat', { round })}
      </label>
      {hasOverride && (
        <label htmlFor={`${idPrefix}-games`}>
          <span>
            {round}: {term('winningGames')}
          </span>
          <NumberField
            id={`${idPrefix}-games`}
            value={override.winningGames!}
            max={99}
            disabled={disabled}
            onChange={(winningGames) => onChange({ ...override, winningGames })}
          />
        </label>
      )}
    </div>
  )
}
