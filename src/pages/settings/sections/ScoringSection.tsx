import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'
import { resolveScoringRules, getSport, sports } from '../../../domain/sports/registry'
import type { SportId } from '../../../domain/sports/types'
import type { ScoringRuleId } from '../../../domain/scoring/types'
import { MatchFormatFields } from '../../../shared/form/MatchFormatFields'
import type { SettingsSectionProps } from './types'

const rulesOptionKeys = {
  sets: 'sportsRulesSets',
  outcomeOnly: 'sportsRulesOutcome',
} as const

export function ScoringSection({ draft, setDraft, started }: SettingsSectionProps) {
  const sport = getSport(draft.scoring.sport)
  const rules = resolveScoringRules(draft.scoring)
  const rulesChoices = [sport.rules, ...(sport.alternativeRules ?? [])].filter(
    (id): id is keyof typeof rulesOptionKeys => id in rulesOptionKeys,
  )
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
  const changeRules = (id: ScoringRuleId) =>
    setDraft((current) => {
      const { rules: _previous, ...scoring } = current.scoring
      return { ...current, scoring: id === sport.rules ? scoring : { ...scoring, rules: id } }
    })
  const changePoints = (key: 'win' | 'draw', value: string) => {
    const points = Number(value)
    if (value.trim() === '' || !Number.isFinite(points) || points < 0) return
    setDraft((current) => ({
      ...current,
      scoring: {
        ...current.scoring,
        matchPoints: { ...current.scoring.matchPoints, [key]: points },
      },
    }))
  }

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
          {sports.map((item) => (
            <option key={item.id} value={item.id}>
              {t(item.labelKey)}
            </option>
          ))}
        </select>
      </div>
      {rulesChoices.length > 1 && (
        <div className={classNames(sharedStyles, 'settings-field')}>
          <label htmlFor="scoring-rules">
            <b>{t('sportsRulesType')}</b>
            <small>{t('sportsRulesTypeHelp')}</small>
          </label>
          <select
            id="scoring-rules"
            value={rules.id}
            disabled={started}
            onChange={(event) => changeRules(event.target.value as ScoringRuleId)}
          >
            {rulesChoices.map((id) => (
              <option key={id} value={id}>
                {t(rulesOptionKeys[id])}
              </option>
            ))}
          </select>
        </div>
      )}
      <MatchFormatFields
        idPrefix="default-format"
        sportId={draft.scoring.sport}
        rulesId={draft.scoring.rules}
        format={draft.scoring.format}
        onChange={(format) =>
          setDraft((current) => ({ ...current, scoring: { ...current.scoring, format } }))
        }
      />
      {(['win', 'draw'] as const).map((key) => (
        <div className={classNames(sharedStyles, 'settings-field')} key={key}>
          <label htmlFor={`match-points-${key}`}>
            <b>{t(key === 'win' ? 'sportsMatchPointsWin' : 'sportsMatchPointsDraw')}</b>
            {key === 'win' && <small>{t('sportsMatchPointsHelp')}</small>}
          </label>
          <input
            id={`match-points-${key}`}
            type="number"
            min="0"
            step="0.5"
            // Keyed by sport and rules so a change of the preset shows its default again.
            key={`${draft.scoring.sport}-${rules.id}`}
            defaultValue={draft.scoring.matchPoints[key]}
            onChange={(event) => changePoints(key, event.currentTarget.value)}
          />
        </div>
      ))}
    </>
  )
}
