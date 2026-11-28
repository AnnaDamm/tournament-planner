import styles from './TieBreakerListEditor.module.css'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { t, tf } from '../../../i18n'
import { getAvailableTieBreakers, moveTieBreaker } from '../../../domain/ranking/list'
import { DEFAULT_TIE_BREAKERS, tieBreakers } from '../../../domain/ranking/registry'
import type { TieBreakerId } from '../../../domain/ranking/types'

type Props = {
  idPrefix: string
  value: TieBreakerId[]
  onChange: (value: TieBreakerId[]) => void
}

const getLabel = (id: TieBreakerId) => {
  const labelKey = tieBreakers[id]?.labelKey
  return labelKey ? t(labelKey) : id
}

/** An ordered, editable list of tie-breakers (the match points always come first). */
// oxlint-disable-next-line eslint/max-lines-per-function
export function TieBreakerListEditor({ idPrefix, value, onChange }: Props) {
  const cn = (...values: string[]) => classNames(sharedStyles, styles, ...values)
  const [announcement, setAnnouncement] = useState('')
  const [selected, setSelected] = useState('')
  const focusTarget = useRef<(() => HTMLElement | null) | null>(null)
  const available = getAvailableTieBreakers(value)
  const addId = available.includes(selected as TieBreakerId) ? selected : (available[0] ?? '')
  const isDefault =
    value.length === DEFAULT_TIE_BREAKERS.length &&
    value.every((id, index) => id === DEFAULT_TIE_BREAKERS[index])

  useEffect(() => {
    // Restore keyboard focus after a change; React may have re-created the buttons.
    const find = focusTarget.current
    focusTarget.current = null
    find?.()?.focus()
  }, [value])

  const byId = (id: string) => document.getElementById(`${idPrefix}-${id}`)
  const enabled = (element: HTMLElement | null) =>
    element && !(element as HTMLButtonElement).disabled ? element : null

  const move = (index: number, direction: -1 | 1) => {
    const id = value[index]
    const next = moveTieBreaker(value, index, direction)
    const position = index + direction + 1
    // At the list edge the opposite button takes over.
    focusTarget.current = () =>
      enabled(byId(`${id}-${direction < 0 ? 'up' : 'down'}`)) ??
      byId(`${id}-${direction < 0 ? 'down' : 'up'}`)
    setAnnouncement(
      tf('tieBreakersAnnounceMoved', { name: getLabel(id), position, total: value.length }),
    )
    onChange(next)
  }

  return (
    <div className={cn('tie-breaker-editor')}>
      {value.length === 0 ? (
        <p className={cn('setting-status')}>{t('tieBreakersEmpty')}</p>
      ) : (
        <ol className={cn('tie-breaker-list')} aria-label={t('tieBreakersListLabel')}>
          {value.map((id, index) => {
            const label = getLabel(id)
            const helpKey = tieBreakers[id]?.descriptionKey
            return (
              <li key={id} className={cn('tie-breaker-item')}>
                <span className={cn('tie-breaker-text')}>
                  <b>{label}</b>
                  {helpKey && <small>{t(helpKey)}</small>}
                </span>
                <span className={cn('tie-breaker-actions')}>
                  <button
                    id={`${idPrefix}-${id}-up`}
                    className={cn('icon-btn')}
                    type="button"
                    disabled={index === 0}
                    aria-label={`${t('tieBreakersMoveUp')}: ${label}`}
                    title={`${t('tieBreakersMoveUp')}: ${label}`}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    id={`${idPrefix}-${id}-down`}
                    className={cn('icon-btn')}
                    type="button"
                    disabled={index === value.length - 1}
                    aria-label={`${t('tieBreakersMoveDown')}: ${label}`}
                    title={`${t('tieBreakersMoveDown')}: ${label}`}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                  <button
                    id={`${idPrefix}-${id}-remove`}
                    className={cn('icon-btn')}
                    type="button"
                    aria-label={`${t('tieBreakersRemove')}: ${label}`}
                    title={`${t('tieBreakersRemove')}: ${label}`}
                    onClick={() => {
                      setAnnouncement(tf('tieBreakersAnnounceRemoved', { name: label }))
                      // The neighbour that takes the place, else the add or reset control.
                      const neighbour = value[index + 1] ?? value[index - 1]
                      focusTarget.current = () =>
                        (neighbour ? byId(`${neighbour}-remove`) : null) ??
                        enabled(byId('add')) ??
                        enabled(byId('reset'))
                      onChange(value.filter((item) => item !== id))
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <div className={cn('tie-breaker-add')}>
        {available.length > 0 && (
          <>
            <label className={cn('sr-only')} htmlFor={`${idPrefix}-add`}>
              {t('tieBreakersAddLabel')}
            </label>
            <select
              id={`${idPrefix}-add`}
              value={addId}
              onChange={(event) => setSelected(event.target.value)}
            >
              {available.map((id) => (
                <option key={id} value={id}>
                  {getLabel(id)}
                </option>
              ))}
            </select>
            <button
              id={`${idPrefix}-add-button`}
              className={cn('button ghost')}
              type="button"
              title={t('tieBreakersAdd')}
              onClick={() => {
                setAnnouncement(
                  tf('tieBreakersAnnounceAdded', {
                    name: getLabel(addId as TieBreakerId),
                    position: value.length + 1,
                  }),
                )
                // The add control disappears with the last entry: focus the new entry instead.
                if (available.length === 1) focusTarget.current = () => byId(`${addId}-up`)
                onChange([...value, addId as TieBreakerId])
              }}
            >
              {t('tieBreakersAdd')}
            </button>
          </>
        )}
        <button
          id={`${idPrefix}-reset`}
          className={cn('button ghost')}
          type="button"
          disabled={isDefault}
          title={t('tieBreakersReset')}
          onClick={() => {
            setAnnouncement(t('tieBreakersAnnounceReset'))
            onChange([...DEFAULT_TIE_BREAKERS])
          }}
        >
          {t('tieBreakersReset')}
        </button>
      </div>
      <output className={cn('sr-only')} aria-live="polite">
        {announcement}
      </output>
    </div>
  )
}
