import styles from './PhasesSection.module.css'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { t, tf } from '../../../i18n'
import { phaseModes } from '../../../domain/phases/registry'
import { transitionResolvers } from '../../../domain/phases/transitions'
import type { SportId } from '../../../domain/sports/types'
import type { Phase, PhaseModeId, PhaseTransition } from '../../../domain/types'
import { MatchFormatFields } from '../../../shared/form/MatchFormatFields'
import { NumberField } from '../../../shared/form/NumberField'
import { phaseViews } from '../../phaseViews/registry'
import { getPhaseName } from '../../phaseViews/phaseName'

type Props = {
  phase: Phase
  index: number
  sportId: SportId
  defaultFormat: NonNullable<Phase['format']>
  locked: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  canRemove: boolean
  onChange: (phase: Phase) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

const entryLabels: Record<PhaseTransition['kind'], Parameters<typeof t>[0]> = {
  all: 'phasesEntryAll',
  topN: 'phasesEntryTopN',
  topNPerGroup: 'phasesEntryTopNPerGroup',
}

const entryKinds = Object.keys(transitionResolvers) as PhaseTransition['kind'][]

const createTransition = (kind: PhaseTransition['kind'], previous: PhaseTransition) => {
  const count = 'count' in previous ? previous.count : 4
  return kind === 'all' ? { kind } : { kind, count }
}

// oxlint-disable-next-line eslint/max-lines-per-function
export function PhaseCard({
  phase,
  index,
  sportId,
  defaultFormat,
  locked,
  canMoveUp,
  canMoveDown,
  canRemove,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const cn = (...values: string[]) => classNames(sharedStyles, styles, ...values)
  const mode = phaseModes[phase.mode]
  const ConfigEditor = phaseViews[phase.mode]?.ConfigEditor
  const id = `phase-${phase.id}`
  const title = tf('phasesPhaseLabel', { number: index + 1 })
  const hasCount = phase.entry.kind === 'topN' || phase.entry.kind === 'topNPerGroup'
  const kinds = entryKinds.includes(phase.entry.kind)
    ? entryKinds
    : [...entryKinds, phase.entry.kind]

  return (
    <fieldset className={cn('phase-card')} disabled={locked} aria-labelledby={`${id}-title`}>
      <div className={cn('phase-card-head')}>
        <h3 id={`${id}-title`}>
          {title}
          <small>{getPhaseName(phase)}</small>
        </h3>
        <div className={cn('phase-card-actions')}>
          <button
            id={`${id}-up`}
            className={cn('icon-btn')}
            type="button"
            disabled={!canMoveUp}
            aria-label={`${t('phasesMoveUp')}: ${title}`}
            title={`${t('phasesMoveUp')}: ${title}`}
            onClick={() => onMove(-1)}
          >
            <ChevronUp size={16} aria-hidden="true" />
          </button>
          <button
            id={`${id}-down`}
            className={cn('icon-btn')}
            type="button"
            disabled={!canMoveDown}
            aria-label={`${t('phasesMoveDown')}: ${title}`}
            title={`${t('phasesMoveDown')}: ${title}`}
            onClick={() => onMove(1)}
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <button
            className={cn('icon-btn')}
            type="button"
            disabled={!canRemove}
            aria-label={`${t('phasesRemove')}: ${title}`}
            title={`${t('phasesRemove')}: ${title}`}
            onClick={onRemove}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {locked && <p className={cn('setting-status')}>{t('phasesLocked')}</p>}
      <div className={cn('settings-field')}>
        <label htmlFor={`${id}-name`}>
          <b>{t('phasesName')}</b>
          <small>{t('phasesNameHelp')}</small>
        </label>
        <input
          id={`${id}-name`}
          type="text"
          maxLength={60}
          value={phase.name}
          onChange={(event) => onChange({ ...phase, name: event.target.value })}
        />
      </div>
      <div className={cn('settings-field')}>
        <label htmlFor={`${id}-mode`}>
          <b>{t('phasesMode')}</b>
        </label>
        <select
          id={`${id}-mode`}
          value={phase.mode}
          onChange={(event) => {
            const next = phaseModes[event.target.value as PhaseModeId]
            onChange({
              ...phase,
              mode: event.target.value as PhaseModeId,
              config: next ? next.defaultConfig() : undefined,
            })
          }}
        >
          {!mode && <option value={phase.mode}>{phase.mode}</option>}
          {Object.values(phaseModes).map((item) => (
            <option key={item.id} value={item.id}>
              {t(item.labelKey)}
            </option>
          ))}
        </select>
      </div>
      {ConfigEditor && (
        <ConfigEditor
          config={phase.config}
          disabled={locked}
          onChange={(config) => onChange({ ...phase, config })}
        />
      )}
      {index === 0 ? (
        <p className={cn('setting-status')}>{t('phasesEntryFirst')}</p>
      ) : (
        <>
          <div className={cn('settings-field')}>
            <label htmlFor={`${id}-entry`}>
              <b>{t('phasesEntry')}</b>
            </label>
            <select
              id={`${id}-entry`}
              value={phase.entry.kind}
              onChange={(event) =>
                onChange({
                  ...phase,
                  entry: createTransition(
                    event.target.value as PhaseTransition['kind'],
                    phase.entry,
                  ),
                })
              }
            >
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {t(entryLabels[kind])}
                </option>
              ))}
            </select>
          </div>
          {hasCount && 'count' in phase.entry && (
            <div className={cn('settings-field')}>
              <label htmlFor={`${id}-entry-count`}>
                <b>{t('phasesEntryCount')}</b>
              </label>
              <NumberField
                id={`${id}-entry-count`}
                value={phase.entry.count}
                onChange={(count) =>
                  onChange({ ...phase, entry: { ...phase.entry, count } as PhaseTransition })
                }
              />
            </div>
          )}
        </>
      )}
      <label htmlFor={`${id}-own-format`} className={cn('check')}>
        <input
          id={`${id}-own-format`}
          type="checkbox"
          checked={phase.format !== undefined}
          onChange={(event) => {
            const { format: _format, ...rest } = phase
            onChange(event.currentTarget.checked ? { ...rest, format: { ...defaultFormat } } : rest)
          }}
        />{' '}
        {t('phasesOwnFormat')}
      </label>
      {phase.format && (
        <div className={cn('round-settings-fields')}>
          <MatchFormatFields
            idPrefix={`${id}-format`}
            sportId={sportId}
            format={phase.format}
            variant="dialog"
            onChange={(format) => onChange({ ...phase, format })}
          />
        </div>
      )}
    </fieldset>
  )
}
