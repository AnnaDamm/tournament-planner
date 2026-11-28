import { useId } from 'react'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t, type MessageKey } from '../../../i18n'
import { DEFAULT_ACCELERATED_ROUNDS } from '../../../domain/phases/swiss/accelerated'
import { parseSwissConfig, type SwissConfig } from '../../../domain/phases/swiss/config'
import { NumberField } from '../../../shared/form/NumberField'

type Props = { config: unknown; onChange: (config: unknown) => void; disabled: boolean }

const variants: Array<{ id: SwissConfig['variant']; label: MessageKey; help: MessageKey }> = [
  { id: 'standard', label: 'swissVariantStandard', help: 'swissVariantStandardHelp' },
  { id: 'accelerated', label: 'swissVariantAccelerated', help: 'swissVariantAcceleratedHelp' },
  { id: 'danish', label: 'swissVariantDanish', help: 'swissVariantDanishHelp' },
]

export function SwissConfigEditor({ config, onChange, disabled }: Props) {
  const cn = (...values: string[]) => classNames(sharedStyles, ...values)
  const value = parseSwissConfig(config) ?? { variant: 'standard' as const }
  const current = variants.find((item) => item.id === value.variant) ?? variants[0]
  const id = useId()
  return (
    <>
      <div className={cn('settings-field')}>
        <label htmlFor={`${id}-variant`}>
          <b>{t('swissVariant')}</b>
        </label>
        <select
          id={`${id}-variant`}
          value={value.variant}
          disabled={disabled}
          aria-describedby={`${id}-variant-help`}
          onChange={(event) => {
            const variant = event.target.value as SwissConfig['variant']
            onChange(
              variant === 'accelerated'
                ? {
                    variant,
                    acceleratedRounds: value.acceleratedRounds ?? DEFAULT_ACCELERATED_ROUNDS,
                  }
                : { variant },
            )
          }}
        >
          {variants.map((item) => (
            <option key={item.id} value={item.id}>
              {t(item.label)}
            </option>
          ))}
        </select>
      </div>
      <p id={`${id}-variant-help`} className={cn('setting-status')}>
        {t(current.help)}
      </p>
      {value.variant === 'accelerated' && (
        <div className={cn('settings-field')}>
          <label htmlFor={`${id}-rounds`}>
            <b>{t('swissAcceleratedRounds')}</b>
            <small>{t('swissAcceleratedRoundsHelp')}</small>
          </label>
          <NumberField
            id={`${id}-rounds`}
            min={1}
            disabled={disabled}
            value={value.acceleratedRounds ?? DEFAULT_ACCELERATED_ROUNDS}
            onChange={(acceleratedRounds) => onChange({ ...value, acceleratedRounds })}
          />
        </div>
      )}
    </>
  )
}
