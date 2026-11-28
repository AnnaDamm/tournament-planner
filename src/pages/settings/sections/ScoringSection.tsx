import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'
import { getSport, sports } from '../../../domain/sports/registry'
import type { SportId } from '../../../domain/sports/types'
import { MatchFormatFields } from '../../../shared/form/MatchFormatFields'
import type { SettingsSectionProps } from './types'

export function ScoringSection({ draft, setDraft, started }: SettingsSectionProps) {
  const changeSport = (id: SportId) =>
    setDraft((current) => {
      const { defaults } = getSport(id)
      return {
        ...current,
        scoring: {
          sport: id,
          format: { ...defaults.format },
          matchPoints: { ...defaults.matchPoints },
        },
      }
    })

  return (
    <>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="sport">
          <b>{t('sport')}</b>
          <small>{t('sportHelp')}</small>
        </label>
        <select
          id="sport"
          value={draft.scoring.sport}
          disabled={started}
          onChange={(event) => changeSport(event.target.value as SportId)}
        >
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {t(sport.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <MatchFormatFields
        idPrefix="default-format"
        sportId={draft.scoring.sport}
        format={draft.scoring.format}
        onChange={(format) =>
          setDraft((current) => ({ ...current, scoring: { ...current.scoring, format } }))
        }
      />
    </>
  )
}
