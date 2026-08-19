import { PageTitle } from './PageTitle'
import { t } from '../i18n'

type Props = {
  participantType: 'players' | 'teams'
  setParticipantType: (value: 'players' | 'teams') => void
  onDeleteAll: () => void
}

export function SettingsPage({ participantType, setParticipantType, onDeleteAll }: Props) {
  return (
    <>
      <PageTitle eyebrow={t('tournament')} title={t('settings')} />
      <div className="round-card settings-card">
        <label htmlFor="participant-type">
          <b>{t('type')}</b>
          <small>{t('typeHelp')}</small>
        </label>
        <select
          id="participant-type"
          value={participantType}
          onChange={(event) => setParticipantType(event.target.value as 'players' | 'teams')}
        >
          <option value="players">{t('players')}</option>
          <option value="teams">{t('teams')}</option>
        </select>
      </div>
      <button className="button danger delete-all-button" onClick={onDeleteAll}>
        {t('deleteAll')}
      </button>
    </>
  )
}
