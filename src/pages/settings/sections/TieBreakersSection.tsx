import styles from './TieBreakerListEditor.module.css'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'
import { TieBreakerListEditor } from './TieBreakerListEditor'
import type { SettingsSectionProps } from './types'

export function TieBreakersSection({ draft, setDraft }: SettingsSectionProps) {
  return (
    <section
      className={classNames(sharedStyles, styles, 'tie-breakers-section')}
      aria-labelledby="tie-breakers-title"
    >
      <h2 id="tie-breakers-title">{t('tieBreakersTitle')}</h2>
      <p className={classNames(sharedStyles, styles, 'setting-status')}>{t('tieBreakersIntro')}</p>
      <TieBreakerListEditor
        idPrefix="tie-breakers"
        value={draft.tieBreakers}
        onChange={(tieBreakers) => setDraft((current) => ({ ...current, tieBreakers }))}
      />
    </section>
  )
}
