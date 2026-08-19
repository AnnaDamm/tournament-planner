import type { RefObject } from 'react'
import { UserPlus, X } from 'lucide-react'
import { Dialog } from './Dialog'
import { t } from '../i18n'

type Props = {
  participantType: 'players' | 'teams'
  bulkRef: RefObject<HTMLDialogElement | null>
  confirmRef: RefObject<HTMLDialogElement | null>
  draft: string
  setDraft: (value: string) => void
  onAdd: () => void
  onDeleteAll: () => void
}

export function AppDialogs({
  participantType,
  bulkRef,
  confirmRef,
  draft,
  setDraft,
  onAdd,
  onDeleteAll,
}: Props) {
  return (
    <>
      <Dialog dialogRef={bulkRef}>
        <div className="dialog-head">
          <div>
            <h2>{participantType === 'teams' ? t('addTeam') : t('add')}</h2>
            <p>{t('onePerLine')}</p>
          </div>
          <button className="icon-btn" onClick={() => bulkRef.current?.close()}>
            <X size={18} />
          </button>
        </div>
        <textarea
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={'North Stars\nRiver Club\n...'}
        />
        <div className="dialog-actions">
          <button className="button ghost" onClick={() => bulkRef.current?.close()}>
            {t('cancel')}
          </button>
          <button className="button primary" onClick={onAdd}>
            <UserPlus size={16} /> {t('addButton')}
          </button>
        </div>
      </Dialog>
      <Dialog dialogRef={confirmRef}>
        <div className="dialog-head">
          <div>
            <h2>{t('deleteEverything')}</h2>
            <p>{t('deleteDescription')}</p>
          </div>
          <button className="icon-btn" onClick={() => confirmRef.current?.close()}>
            <X size={18} />
          </button>
        </div>
        <div className="dialog-actions">
          <button className="button ghost" onClick={() => confirmRef.current?.close()}>
            {t('cancel')}
          </button>
          <button className="button danger" onClick={onDeleteAll}>
            {t('deleteAll')}
          </button>
        </div>
      </Dialog>
    </>
  )
}
