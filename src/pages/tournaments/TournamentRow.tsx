import styles from './TournamentsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { Download, FolderOpen, Pencil, Trash2 } from 'lucide-react'
import { locale, t, tf } from '../../i18n'

type Props = {
  id: string
  name: string
  updatedAt: number
  active: boolean
  onOpen: (id: string) => void
  onRename: (id: string) => void
  onExport: (id: string) => void
  onDelete: (id: string) => void
}

export function TournamentRow({
  id,
  name,
  updatedAt,
  active,
  onOpen,
  onRename,
  onExport,
  onDelete,
}: Props) {
  const params = { name }
  return (
    <li className={classNames(sharedStyles, styles, 'tournament-row')} data-active={active}>
      <div className={classNames(sharedStyles, styles, 'tournament-info')}>
        <b>{name}</b>
        {active && (
          <span className={classNames(sharedStyles, styles, 'tournament-badge')}>
            {t('libraryActive')}
          </span>
        )}
        <small>{tf('libraryUpdated', { date: new Date(updatedAt).toLocaleString(locale) })}</small>
      </div>
      <div className={classNames(sharedStyles, styles, 'tournament-actions')}>
        {!active && (
          <button
            className={classNames(sharedStyles, styles, 'button primary')}
            type="button"
            id={`tournament-open-${id}`}
            title={tf('libraryOpenTitle', params)}
            aria-label={tf('libraryOpenTitle', params)}
            onClick={() => onOpen(id)}
          >
            <FolderOpen size={16} aria-hidden="true" /> {t('libraryOpen')}
          </button>
        )}
        <button
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          id={`tournament-rename-${id}`}
          title={tf('libraryRenameTitle', params)}
          aria-label={tf('libraryRenameTitle', params)}
          onClick={() => onRename(id)}
        >
          <Pencil size={16} aria-hidden="true" /> {t('libraryRename')}
        </button>
        <button
          className={classNames(sharedStyles, styles, 'button ghost')}
          type="button"
          title={tf('libraryExportTitle', params)}
          aria-label={tf('libraryExportTitle', params)}
          onClick={() => onExport(id)}
        >
          <Download size={16} aria-hidden="true" /> {t('libraryExport')}
        </button>
        <button
          className={classNames(sharedStyles, styles, 'button ghost danger-text')}
          type="button"
          id={`tournament-delete-${id}`}
          title={tf('libraryDeleteTitle', params)}
          aria-label={tf('libraryDeleteTitle', params)}
          onClick={() => onDelete(id)}
        >
          <Trash2 size={16} aria-hidden="true" /> {t('libraryDelete')}
        </button>
      </div>
    </li>
  )
}
