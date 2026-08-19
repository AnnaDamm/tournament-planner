import { de } from './de'
import { en } from './en'

export const locale: 'en' | 'de' = (navigator.language || 'en').toLowerCase().startsWith('de')
  ? 'de'
  : 'en'
const messages = { en, de }

export const t = (key: keyof typeof en) => messages[locale][key]
