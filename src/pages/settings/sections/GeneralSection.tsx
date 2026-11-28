import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'
import type { SettingsSectionProps } from './types'

export function GeneralSection({ draft, setDraft }: SettingsSectionProps) {
  return (
    <>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="tournament-name">
          <b>{t('tournamentName')}</b>
          <small>{t('tournamentNameHelp')}</small>
        </label>
        <input
          id="tournament-name"
          type="text"
          value={draft.tournamentName}
          onChange={(event) =>
            setDraft((current) => ({ ...current, tournamentName: event.target.value }))
          }
          maxLength={80}
        />
      </div>
      <div className={classNames(sharedStyles, 'settings-field')}>
        <label htmlFor="participant-type">
          <b>{t('type')}</b>
          <small>{t('typeHelp')}</small>
        </label>
        <select
          id="participant-type"
          value={draft.participantType}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              participantType: event.target.value as typeof draft.participantType,
            }))
          }
        >
          <option value="players">{t('players')}</option>
          <option value="teams">{t('teams')}</option>
        </select>
      </div>
    </>
  )
}
