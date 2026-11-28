import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'
import type { MessageKey } from '../../../i18n'
import {
  defaultEliminationConfig,
  parseEliminationConfig,
  trimFormatOverrides,
  type EliminationConfig,
} from '../../../domain/phases/elimination/config'
import type { MatchFormat } from '../../../domain/types'
import { useAppSelector } from '../../../storeHooks'
import { selectScoring } from '../../../tournamentSelectors'
import { RoundFormatField } from './RoundFormatField'

type Props = {
  config: unknown
  onChange: (config: unknown) => void
  disabled: boolean
}

/** The rounds counted from the end that can have an own format; the rest uses the phase format. */
const formatRounds: MessageKey[] = [
  'eliminationFinal',
  'eliminationSemifinal',
  'eliminationQuarterfinal',
]

export function EliminationConfigEditor({ config, onChange, disabled }: Props) {
  const value = parseEliminationConfig(config) ?? defaultEliminationConfig()
  const defaultWinningGames = useAppSelector(selectScoring).format.winningGames
  const update = (patch: Partial<EliminationConfig>) => onChange({ ...value, ...patch })
  const setOverride = (index: number, override: Partial<MatchFormat>) => {
    const formats = Array.from(
      { length: Math.max(value.formatByRoundFromEnd.length, index + 1) },
      (_, position) => value.formatByRoundFromEnd[position] ?? {},
    )
    formats[index] = override
    update({ formatByRoundFromEnd: trimFormatOverrides(formats) })
  }
  const idPrefix = 'elimination-config'
  return (
    <>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor={`${idPrefix}-seeding`}>
          <b>{t('eliminationSeeding')}</b>
          <small>{t('eliminationSeedingHelp')}</small>
        </label>
        <select
          id={`${idPrefix}-seeding`}
          value={value.seeding}
          disabled={disabled}
          onChange={(event) =>
            update({ seeding: event.target.value as EliminationConfig['seeding'] })
          }
        >
          <option value="standard">{t('eliminationSeedingStandard')}</option>
          <option value="random">{t('eliminationSeedingRandom')}</option>
        </select>
      </div>
      <label htmlFor={`${idPrefix}-third`} className={classNames(sharedStyles, 'check')}>
        <input
          id={`${idPrefix}-third`}
          type="checkbox"
          disabled={disabled}
          checked={value.thirdPlaceMatch}
          onChange={(event) => update({ thirdPlaceMatch: event.currentTarget.checked })}
        />{' '}
        {t('eliminationThirdPlaceMatch')}
      </label>
      <fieldset className={classNames(sharedStyles, 'settings-field')} disabled={disabled}>
        <legend>
          <b>{t('eliminationFormats')}</b>
        </legend>
        <small>{t('eliminationFormatsHelp')}</small>
        {formatRounds.map((roundKey, index) => (
          <RoundFormatField
            key={roundKey}
            idPrefix={`${idPrefix}-format-${index}`}
            roundKey={roundKey}
            override={value.formatByRoundFromEnd[index]}
            defaultWinningGames={defaultWinningGames}
            disabled={disabled}
            onChange={(override) => setOverride(index, override)}
          />
        ))}
      </fieldset>
    </>
  )
}
