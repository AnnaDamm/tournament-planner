import styles from './TournamentsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { t, tf } from '../../i18n'
import { PageTitle } from '../../shared/PageTitle'
import {
  addTournament,
  createTournament,
  deleteTournament,
  getStoredSnapshot,
  listTournaments,
  renameTournament,
  subscribeToLibrary,
  switchTournament,
} from '../../storage'
import { downloadTournament } from '../../tournamentExport'
import { parseTournamentSnapshot } from '../../tournamentSnapshot'
import { renameActiveTournament } from '../../tournamentCommands'
import { selectTournamentName } from '../../tournamentSelectors'
import { useAppDispatch, useAppSelector } from '../../storeHooks'
import { DeleteTournamentDialog } from './DeleteTournamentDialog'
import { RenameTournamentDialog } from './RenameTournamentDialog'
import { TournamentRow } from './TournamentRow'

// Switching or deleting the active tournament remounts the app; the notice survives that remount.
let pendingNotice: string | null = null

type Target = { id: string; name: string }

// oxlint-disable-next-line eslint/max-lines-per-function
export function TournamentsPage() {
  const dispatch = useAppDispatch()
  const activeName = useAppSelector(selectTournamentName)
  const [version, setVersion] = useState(0)
  const [newName, setNewName] = useState('')
  const [notice, setNotice] = useState(pendingNotice ?? '')
  const [error, setError] = useState('')
  const [renaming, setRenaming] = useState<Target | null>(null)
  const [deleting, setDeleting] = useState<Target | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (pendingNotice) headingRef.current?.focus()
    pendingNotice = null
  }, [])

  // The library lives in localStorage: re-read it after changes (also renames in the settings).
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const library = useMemo(() => listTournaments(), [version, activeName])
  useEffect(() => subscribeToLibrary(() => setVersion((value) => value + 1)), [])

  const nameOf = (id: string) => library.items.find((item) => item.id === id)?.name ?? ''
  const announce = (message: string, remounts = false) => {
    setError('')
    if (remounts) pendingNotice = message
    else setNotice(message)
  }
  const focusLater = (id: string) =>
    requestAnimationFrame(() => document.getElementById(id)?.focus())

  const create = () => {
    const id = createTournament(newName)
    if (!id) return setError(t('libraryCreateError'))
    // The new tournament becomes the active one, which remounts the app.
    const name = listTournaments().items.find((item) => item.id === id)?.name ?? ''
    announce(tf('libraryCreated', { name }), true)
  }
  const open = (id: string) => {
    if (switchTournament(id)) announce(tf('libraryOpened', { name: nameOf(id) }), true)
  }
  const rename = (name: string) => {
    if (!renaming) return
    if (renaming.id === library.activeId) dispatch(renameActiveTournament(name))
    else renameTournament(renaming.id, name)
    setVersion((value) => value + 1)
  }
  const remove = () => {
    if (!deleting) return
    const wasActive = deleting.id === library.activeId
    if (!deleteTournament(deleting.id)) return setError(t('libraryCreateError'))
    announce(tf('libraryDeleted', { name: deleting.name }), wasActive)
    setVersion((value) => value + 1)
  }
  const exportOne = (id: string) => {
    const snapshot = getStoredSnapshot(id)
    if (snapshot) downloadTournament(snapshot)
  }
  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const snapshot = parseTournamentSnapshot(JSON.parse(await file.text()))
      if (!snapshot || !addTournament(snapshot)) throw new Error('import')
      announce(tf('libraryCreated', { name: snapshot.tournamentName }))
      setVersion((value) => value + 1)
    } catch {
      setError(t('libraryImportError'))
    }
  }
  const closeRename = (id: string) => {
    focusLater('tournament-rename-' + id)
    setRenaming(null)
  }
  const closeDelete = (id: string) => {
    if (listTournaments().items.some((item) => item.id === id))
      focusLater('tournament-delete-' + id)
    else requestAnimationFrame(() => headingRef.current?.focus())
    setDeleting(null)
  }

  return (
    <>
      <PageTitle title={t('libraryTitle')} />
      <section
        className={classNames(sharedStyles, styles, 'library-card')}
        aria-labelledby="library-list-title"
      >
        <p className={classNames(sharedStyles, styles, 'library-intro')}>{t('libraryIntro')}</p>
        <form
          className={classNames(sharedStyles, styles, 'library-create')}
          onSubmit={(event) => {
            event.preventDefault()
            create()
          }}
        >
          <div className={classNames(sharedStyles, styles, 'library-field')}>
            <label htmlFor="library-new-name">{t('libraryCreateLabel')}</label>
            <input
              id="library-new-name"
              ref={createInputRef}
              type="text"
              value={newName}
              maxLength={80}
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>
          <button
            className={classNames(sharedStyles, styles, 'button primary')}
            type="submit"
            title={t('libraryCreateButton')}
          >
            <Plus size={16} aria-hidden="true" /> {t('libraryCreateButton')}
          </button>
          <button
            className={classNames(sharedStyles, styles, 'button ghost')}
            type="button"
            title={t('libraryImportTitle')}
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={16} aria-hidden="true" /> {t('libraryImport')}
          </button>
          <input
            ref={importInputRef}
            aria-label={t('libraryImportTitle')}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (event) => {
              await importFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </form>
        <p
          className={classNames(sharedStyles, styles, `library-status ${error ? 'error' : ''}`)}
          role={error ? 'alert' : 'status'}
        >
          {error || notice}
        </p>
        <h2
          id="library-list-title"
          ref={headingRef}
          tabIndex={-1}
          className={classNames(sharedStyles, styles, 'library-list-title')}
        >
          {t('libraryListLabel')}
        </h2>
        <ul
          className={classNames(sharedStyles, styles, 'library-list')}
          aria-labelledby="library-list-title"
        >
          {library.items.map((item) => (
            <TournamentRow
              key={item.id}
              id={item.id}
              name={item.name}
              updatedAt={item.updatedAt}
              active={item.id === library.activeId}
              onOpen={open}
              onRename={(id) => setRenaming({ id, name: nameOf(id) })}
              onExport={exportOne}
              onDelete={(id) => setDeleting({ id, name: nameOf(id) })}
            />
          ))}
        </ul>
      </section>
      {renaming && (
        <RenameTournamentDialog
          name={renaming.name}
          onSubmit={rename}
          onClose={() => closeRename(renaming.id)}
        />
      )}
      {deleting && (
        <DeleteTournamentDialog
          name={deleting.name}
          isLast={library.items.length === 1}
          onConfirm={remove}
          onClose={() => closeDelete(deleting.id)}
        />
      )}
    </>
  )
}
