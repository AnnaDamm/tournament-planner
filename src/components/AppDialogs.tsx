import { UserPlus, X } from 'lucide-react'
import { Dialog } from './Dialog'
import { t } from '../i18n'
import { addParticipants, deleteAllTournamentData } from '../tournamentCommands'
import { useAppDispatch, useAppSelector } from '../storeHooks'
import { useTournamentDialogRefs, useTournamentDraft } from '../context/TournamentContext'
import { selectParticipantType } from '../tournamentSelectors'

export function AppDialogs() {
  const dispatch = useAppDispatch()
  const participantType = useAppSelector(selectParticipantType)
  const { bulkRef, bulkInputRef, confirmRef } = useTournamentDialogRefs()
  const { draft, setDraft } = useTournamentDraft()
  const onAdd = () => {
    const names = draft
      .split('\n')
      .map((nameValue) => nameValue.trim())
      .filter(Boolean)
    dispatch(addParticipants(names))
    setDraft('')
    bulkRef.current?.close()
  }
  const onDeleteAll = () => {
    dispatch(deleteAllTournamentData())
    confirmRef.current?.close()
  }
  return (
    <>
      <Dialog
        dialogRef={bulkRef}
        labelledBy="add-participants-title"
        describedBy="add-participants-help"
      >
        <div className="dialog-head">
          <div>
            <h2 id="add-participants-title">
              {participantType === 'teams' ? t('addTeam') : t('add')}
            </h2>
            <p id="add-participants-help">{t('onePerLine')}</p>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label={t('close')}
            title={t('close')}
            onClick={() => bulkRef.current?.close()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <textarea
          ref={bulkInputRef}
          aria-label={participantType === 'teams' ? t('teamNames') : t('playerNames')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault()
              onAdd()
            }
          }}
          placeholder={'North Stars\nRiver Club\n...'}
        />
        <div className="dialog-actions">
          <button
            className="button ghost"
            type="button"
            title={t('cancel')}
            onClick={() => bulkRef.current?.close()}
          >
            {t('cancel')}
          </button>
          <button className="button primary" onClick={onAdd} title={t('addButton')}>
            <UserPlus size={16} aria-hidden="true" /> {t('addButton')}
          </button>
        </div>
      </Dialog>
      <Dialog
        dialogRef={confirmRef}
        labelledBy="delete-all-title"
        describedBy="delete-all-description"
      >
        <div className="dialog-head">
          <div>
            <h2 id="delete-all-title">{t('deleteEverything')}</h2>
            <p id="delete-all-description">{t('deleteDescription')}</p>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label={t('close')}
            title={t('close')}
            onClick={() => confirmRef.current?.close()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="dialog-actions">
          <button
            className="button ghost"
            title={t('cancel')}
            onClick={() => confirmRef.current?.close()}
          >
            {t('cancel')}
          </button>
          <button className="button danger" onClick={onDeleteAll} title={t('deleteAll')}>
            {t('deleteAll')}
          </button>
        </div>
      </Dialog>
    </>
  )
}
