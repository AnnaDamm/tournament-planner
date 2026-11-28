import styles from './PhasesSection.module.css'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { t, tf } from '../../../i18n'
import { createId } from '../../../domain/ids'
import { phaseModes } from '../../../domain/phases/registry'
import { isPhaseLocked } from '../../../domain/phases/scope'
import type { Phase } from '../../../domain/types'
import { useAppSelector } from '../../../storeHooks'
import { selectRounds } from '../../../tournamentSelectors'
import { getPhaseName } from '../../phaseViews/phaseName'
import { PhaseCard } from './PhaseCard'
import type { SettingsSectionProps } from './types'

const createPhase = (): Phase => ({
  id: createId(),
  name: '',
  mode: 'swiss',
  config: phaseModes.swiss?.defaultConfig(),
  entry: { kind: 'all' },
})

export function PhasesSection({ draft, setDraft }: SettingsSectionProps) {
  const rounds = useAppSelector(selectRounds)
  const [announcement, setAnnouncement] = useState('')
  const [focusRequest, setFocusRequest] = useState<
    { id: string; direction: -1 | 1 } | { id: string | null; direction: 0 } | null
  >(null)
  const { phases } = draft
  const setPhases = (update: (phases: Phase[]) => Phase[]) =>
    setDraft((current) => ({ ...current, phases: update(current.phases) }))
  const locked = (phase: Phase) => isPhaseLocked(phase, rounds)

  useEffect(() => {
    if (!focusRequest) return
    const { id, direction } = focusRequest
    if (direction === 0) {
      // After a removal: the neighbouring remove button, otherwise "Add phase".
      const remove = id && document.getElementById(`phase-${id}-remove`)
      const target = remove && !(remove as HTMLButtonElement).disabled ? remove : null
      ;(target ?? document.getElementById('phase-add'))?.focus()
      // oxlint-disable-next-line react/set-state-in-effect
      setFocusRequest(null)
      return
    }
    const first = document.getElementById(`phase-${id}-${direction < 0 ? 'up' : 'down'}`)
    const other = document.getElementById(`phase-${id}-${direction < 0 ? 'down' : 'up'}`)
    const target = first && !(first as HTMLButtonElement).disabled ? first : other
    target?.focus()
    // Focus is restored once per move.
    // oxlint-disable-next-line react/set-state-in-effect
    setFocusRequest(null)
  }, [focusRequest, phases])

  const move = (phase: Phase, direction: -1 | 1) => {
    const from = phases.findIndex((item) => item.id === phase.id)
    const to = from + direction
    if (to < 0 || to >= phases.length) return
    setPhases((current) => {
      const next = [...current]
      next.splice(to, 0, ...next.splice(from, 1))
      return next
    })
    setFocusRequest({ id: phase.id, direction })
    setAnnouncement(
      tf('phasesMoved', {
        name: getPhaseName(phase),
        position: to + 1,
        count: phases.length,
      }),
    )
  }

  const remove = (phase: Phase) => {
    const index = phases.findIndex((item) => item.id === phase.id)
    const neighbour = phases[index + 1] ?? phases[index - 1]
    setPhases((current) => current.filter((item) => item.id !== phase.id))
    setFocusRequest({ id: neighbour?.id ?? null, direction: 0 })
    setAnnouncement(tf('phasesRemoved', { name: getPhaseName(phase) }))
  }

  const add = () => {
    const phase = createPhase()
    setPhases((current) => [...current, phase])
    setAnnouncement(tf('phasesAdded', { name: getPhaseName(phase) }))
  }

  return (
    <section
      className={classNames(sharedStyles, styles, 'phases-section')}
      aria-labelledby="phases-title"
    >
      <h2 id="phases-title">{t('phasesTitle')}</h2>
      <p className={classNames(sharedStyles, styles, 'setting-status')}>{t('phasesHelp')}</p>
      {phases.map((phase, index) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          index={index}
          sportId={draft.scoring.sport}
          defaultFormat={draft.scoring.format}
          locked={locked(phase)}
          canMoveUp={index > 0 && !locked(phase) && !locked(phases[index - 1])}
          canMoveDown={index < phases.length - 1 && !locked(phase) && !locked(phases[index + 1])}
          canRemove={phases.length > 1 && !locked(phase)}
          onChange={(next) =>
            setPhases((current) => current.map((item) => (item.id === phase.id ? next : item)))
          }
          onMove={(direction) => move(phase, direction)}
          onRemove={() => remove(phase)}
        />
      ))}
      <button
        id="phase-add"
        className={classNames(sharedStyles, styles, 'button ghost')}
        type="button"
        title={t('phasesAdd')}
        onClick={add}
      >
        <Plus size={16} aria-hidden="true" /> {t('phasesAdd')}
      </button>
      <output className={classNames(sharedStyles, styles, 'sr-only')} aria-live="polite">
        {announcement}
      </output>
    </section>
  )
}
