import { useEffect, useState } from 'react'
import type { Participant } from '../tournamentTypes'
import { renameParticipant } from '../tournamentCommands'
import { t } from '../i18n'
import { useAppDispatch } from '../storeHooks'

type Props = {
  player: Participant
}

export function PlayerNameEditor({ player }: Props) {
  const dispatch = useAppDispatch()
  const [draft, setDraft] = useState(player.name)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setDraft(player.name)
  }, [player.name])

  const commit = () => {
    if (draft !== player.name) dispatch(renameParticipant(player.id, draft))
  }

  return (
    <input
      className="player-name-input"
      type="text"
      value={draft}
      aria-label={`${t('editName')}: ${player.name}`}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          setDraft(player.name)
          event.currentTarget.blur()
        }
      }}
    />
  )
}
