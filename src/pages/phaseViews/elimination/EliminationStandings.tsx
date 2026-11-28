import { useMemo } from 'react'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import styles from './EliminationBracket.module.css'
import { t } from '../../../i18n'
import { buildPhaseContext, getPhaseModeFor } from '../../../domain/phases/phaseState'
import { useAppSelector } from '../../../storeHooks'
import { selectTournamentSnapshot } from '../../../tournamentSelectors'

/** The placements of the bracket: 1, 2, 3-4, 5-8 ... and who is still playing. */
export function EliminationStandings({ phaseId }: { phaseId: string }) {
  const snapshot = useAppSelector(selectTournamentSnapshot)
  const placements = useMemo(() => {
    const p = buildPhaseContext(snapshot, phaseId)
    const mode = getPhaseModeFor(snapshot.phases.find((phase) => phase.id === phaseId)!)
    return p && mode ? mode.getPlacements(p) : []
  }, [snapshot, phaseId])
  const names = new Map(snapshot.players.map((player) => [player.id, player.name]))
  if (placements.length === 0) return <p>{t('phasesNoRounds')}</p>
  return (
    <table className={classNames(sharedStyles, styles, 'standings')}>
      <caption className={classNames(sharedStyles, 'sr-only')}>
        {t('eliminationPlacements')}
      </caption>
      <thead>
        <tr>
          <th scope="col">{t('eliminationPlace')}</th>
          <th scope="col">{t('eliminationParticipant')}</th>
        </tr>
      </thead>
      <tbody>
        {placements.map((placement) => (
          <tr key={placement.participantId}>
            <td>
              {placement.placeTo && placement.placeTo > placement.place
                ? `${placement.place}–${placement.placeTo}`
                : placement.place}
            </td>
            <th scope="row">{names.get(placement.participantId) ?? placement.participantId}</th>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
