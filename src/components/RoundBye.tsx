import styles from './RoundSection.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { GripVertical } from 'lucide-react'
import { t } from '../i18n'

type Props = {
  bye: string
  canReorder: boolean
  roundIndex: number
  isSelected: boolean
  name: (id: string) => string
  record: string
  onPlayerClick: (id: string) => void
  onKeyboardSwap: (participantId: string) => void
  onSwap: (draggedId: string, targetId: string) => void
}

export function RoundBye({
  bye,
  canReorder,
  roundIndex,
  isSelected,
  name,
  record,
  onPlayerClick,
  onKeyboardSwap,
  onSwap,
}: Props) {
  return (
    <span
      className={classNames(sharedStyles, styles, `bye-pill ${canReorder ? '' : 'locked'}`)}
      draggable={false}
      onDragOver={(event) => canReorder && event.preventDefault()}
      onDrop={(event) => {
        if (
          canReorder &&
          event.dataTransfer.getData('application/x-courtly-round') === String(roundIndex)
        ) {
          onSwap(event.dataTransfer.getData('text/plain'), bye)
        }
      }}
    >
      {canReorder && (
        <button
          className={classNames(sharedStyles, styles, 'drag-handle-button')}
          type="button"
          draggable={canReorder}
          aria-label={`${t('moveParticipant')}: ${name(bye)}`}
          title={`${t('moveParticipant')}: ${name(bye)}`}
          aria-pressed={isSelected}
          onClick={() => onKeyboardSwap(bye)}
          onDragStart={(event) => {
            event.stopPropagation()
            event.dataTransfer.effectAllowed = 'move'
            const dragPreview =
              event.currentTarget.querySelector<HTMLElement>('[data-drag-preview]')
            if (dragPreview) {
              event.dataTransfer.setDragImage(
                dragPreview,
                dragPreview.offsetWidth / 2,
                dragPreview.offsetHeight / 2,
              )
            }
            event.dataTransfer.setData('text/plain', bye)
            event.dataTransfer.setData('application/x-courtly-round', String(roundIndex))
          }}
        >
          <GripVertical size={14} aria-hidden="true" />
          <span
            className={classNames(sharedStyles, 'drag-preview')}
            data-drag-preview
            aria-hidden="true"
          >
            <GripVertical size={14} aria-hidden="true" />
            <span className={classNames(sharedStyles, 'drag-preview-info')}>
              <span className={classNames(sharedStyles, 'drag-preview-name')}>
                {t('bye')}: {name(bye)}
              </span>
              <small className={classNames(sharedStyles, styles, 'player-record')}>{record}</small>
            </span>
          </span>
        </button>
      )}
      <button
        className={classNames(sharedStyles, styles, 'match-player-name')}
        type="button"
        title={`${t('history')}: ${name(bye)}`}
        onClick={() => onPlayerClick(bye)}
      >
        {t('bye')}: {name(bye)}
      </button>
      <small className={classNames(sharedStyles, styles, 'player-record')}>{record}</small>
    </span>
  )
}
