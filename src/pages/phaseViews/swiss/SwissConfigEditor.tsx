import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { t } from '../../../i18n'

/** Stub: the Swiss variants (accelerated, Danish) add their options here. */
export function SwissConfigEditor() {
  return <p className={classNames(sharedStyles, 'setting-status')}>{t('phasesSwissConfigHelp')}</p>
}
