import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { tf } from '../../i18n'
import { getTerm } from '../../i18n/useTerm'
import type { ScoringRuleId } from '../../domain/scoring/types'
import { getSport, resolveScoringRules } from '../../domain/sports/registry'
import type { SportId } from '../../domain/sports/types'
import type { MatchFormat } from '../../domain/types'
import { NumberField } from './NumberField'

type Props = {
  idPrefix: string
  sportId: SportId
  /** The rules the settings select for the sport (scoring.rules). */
  rulesId?: ScoringRuleId
  format: MatchFormat
  onChange: (format: MatchFormat) => void
  /** 'settings': labelled fields with help text; 'dialog': compact labels without points. */
  variant?: 'settings' | 'dialog'
  disabled?: boolean
}

/** The format fields the sport allows to edit, labelled with the terms of the sport. */
export function MatchFormatFields({
  idPrefix,
  sportId,
  rulesId,
  format,
  onChange,
  variant = 'settings',
  disabled = false,
}: Props) {
  const sport = getSport(sportId)
  const term = (key: Parameters<typeof getTerm>[1]) => getTerm(sportId, key)
  const rules = resolveScoringRules({ sport: sportId, rules: rulesId })
  // Score-less rules (football, no sets) have no games to configure.
  const has = (key: keyof MatchFormat) =>
    rules.entry !== 'outcome' && rules.entry !== 'single' && sport.editable.includes(key)
  const supportsFixed = rules.supportsFixedGames && has('fixedGames')
  const games = term('gamesHeader').toLocaleLowerCase()
  const field = (
    key: 'winningGames' | 'gamePoints',
    label: string,
    help: string | undefined,
    max?: number,
  ) => {
    const id = `${idPrefix}-${key}`
    const input = (
      <NumberField
        id={id}
        value={format[key] ?? (key === 'gamePoints' ? 21 : 1)}
        max={max}
        disabled={disabled}
        onChange={(value) => onChange({ ...format, [key]: value })}
      />
    )
    return variant === 'settings' ? (
      <div className={classNames(sharedStyles, 'settings-field')} key={key}>
        <label htmlFor={id}>
          <b>{label}</b>
          {help && <small>{help}</small>}
        </label>
        {input}
      </div>
    ) : (
      <label htmlFor={id} key={key}>
        <span>{label}</span>
        {input}
      </label>
    )
  }

  return (
    <>
      {has('winningGames') &&
        field(
          'winningGames',
          term(variant === 'settings' ? 'defaultWinningGames' : 'winningGames'),
          variant === 'settings' ? term('defaultWinningGamesHelp') : undefined,
          99,
        )}
      {variant === 'settings' &&
        has('gamePoints') &&
        field('gamePoints', term('gamePoints'), term('gamePointsHelp'))}
      {supportsFixed && (
        <>
          <label htmlFor={`${idPrefix}-fixed-toggle`} className={classNames(sharedStyles, 'check')}>
            <input
              id={`${idPrefix}-fixed-toggle`}
              type="checkbox"
              disabled={disabled}
              checked={format.fixedGames !== undefined}
              onChange={(event) => {
                const { fixedGames: _fixed, ...rest } = format
                onChange(event.currentTarget.checked ? { ...rest, fixedGames: 2 } : rest)
              }}
            />{' '}
            {tf('phasesFixedGames', { games })}
          </label>
          {format.fixedGames !== undefined && (
            <label htmlFor={`${idPrefix}-fixed-games`}>
              <span>{tf('phasesFixedGamesCount', { games })}</span>
              <NumberField
                id={`${idPrefix}-fixed-games`}
                value={format.fixedGames}
                max={99}
                disabled={disabled}
                onChange={(value) => onChange({ ...format, fixedGames: value })}
              />
            </label>
          )}
        </>
      )}
    </>
  )
}
