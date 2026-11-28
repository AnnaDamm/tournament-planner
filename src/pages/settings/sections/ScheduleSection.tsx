import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'
import { NumberField } from '../../../shared/form/NumberField'
import type { SettingsSectionProps } from './types'

export function ScheduleSection({ draft, setDraft }: SettingsSectionProps) {
  return (
    <>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="scheduled-start">
          <b>{t('scheduledStart')}</b>
          <small>{t('scheduledStartHelp')}</small>
        </label>
        <input
          id="scheduled-start"
          type="datetime-local"
          value={draft.scheduledStart}
          onChange={(event) =>
            setDraft((current) => ({ ...current, scheduledStart: event.target.value }))
          }
        />
      </div>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="expected-duration">
          <b>{t('expectedDuration')}</b>
          <small>{t('expectedDurationHelp')}</small>
        </label>
        <NumberField
          id="expected-duration"
          value={draft.expectedDurationMinutes}
          onChange={(value) =>
            setDraft((current) => ({ ...current, expectedDurationMinutes: value }))
          }
        />
      </div>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="break-between-matches">
          <b>{t('breakBetweenMatches')}</b>
          <small>{t('breakBetweenMatchesHelp')}</small>
        </label>
        <NumberField
          id="break-between-matches"
          min={0}
          value={draft.breakBetweenMatchesMinutes}
          onChange={(value) =>
            setDraft((current) => ({ ...current, breakBetweenMatchesMinutes: value }))
          }
        />
      </div>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="court-count">
          <b>{t('courts')}</b>
          <small>{t('courtsHelp')}</small>
        </label>
        <NumberField
          id="court-count"
          value={draft.courtCount}
          onChange={(value) => setDraft((current) => ({ ...current, courtCount: value }))}
        />
      </div>
    </>
  )
}
