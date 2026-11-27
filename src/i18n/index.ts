import { de } from './de'
import { en } from './en'

export const locale: 'en' | 'de' = (navigator.language || 'en').toLowerCase().startsWith('de')
  ? 'de'
  : 'en'
const messages = { en, de }

export type MessageKey = keyof typeof en

export const t = (key: MessageKey) => messages[locale][key]

/** Translates a key and replaces `{name}` placeholders with the given parameters. */
export const tf = (key: MessageKey, params: Record<string, string | number> = {}) =>
  t(key).replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
