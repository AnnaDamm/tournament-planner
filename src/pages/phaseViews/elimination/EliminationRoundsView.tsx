import { useMemo } from 'react'
import sharedStyles from '../../../styles/shared.module.css'
import { classNames } from '../../../styles/classNames'
import styles from './EliminationBracket.module.css'
import { t, tf } from '../../../i18n'
import { getByeParticipantIds } from '../../../domain/phases/elimination/bracket'
import { getPhaseRounds } from '../../../domain/phases/phaseState'
import { useAppSelector } from '../../../storeHooks'
import { selectEvaluationContext, selectTournamentSnapshot } from '../../../tournamentSelectors'
import { BracketMatch } from './BracketMatch'

/** The bracket as an overview: one list per round with all matches, results and byes. */
export function EliminationRoundsView({ phaseId }: { phaseId: string }) {
  const snapshot = useAppSelector(selectTournamentSnapshot)
  const ctx = useAppSelector(selectEvaluationContext)
  const rounds = useMemo(() => getPhaseRounds(snapshot, phaseId), [snapshot, phaseId])
  const labels = useMemo(() => {
    const names = new Map(snapshot.players.map((player) => [player.id, player.name]))
    const matchLabels = new Map(
      rounds.flatMap((round) => round.matches.map((match) => [match.id, match.label ?? match.id])),
    )
    return {
      name: (id: string) => names.get(id) ?? id,
      matchLabel: (id: string) => matchLabels.get(id) ?? id,
    }
  }, [snapshot.players, rounds])
  if (rounds.length === 0) return null
  const byes = getByeParticipantIds(rounds).map(labels.name)
  const Heading = snapshot.phases.length >= 2 ? 'h3' : 'h2'
  const headingId = `bracket-${phaseId}`
  return (
    <section className={classNames(sharedStyles, styles, 'bracket')} aria-labelledby={headingId}>
      <Heading id={headingId} className={classNames(sharedStyles, styles, 'bracket-title')}>
        {t('eliminationBracket')}
      </Heading>
      <div className={classNames(sharedStyles, styles, 'bracket-rounds')}>
        {rounds.map((round, index) => {
          const titleId = `${headingId}-round-${round.number}`
          return (
            <div key={round.number} className={classNames(sharedStyles, styles, 'bracket-round')}>
              <div id={titleId} className={classNames(sharedStyles, styles, 'round-title')}>
                {round.title ? tf(round.title.key, round.title.params) : round.number}
              </div>
              <ol aria-labelledby={titleId} className={classNames(sharedStyles, styles, 'matches')}>
                {round.matches.map((match) => (
                  <BracketMatch
                    key={match.id}
                    round={round}
                    match={match}
                    rules={ctx.rules}
                    labels={labels}
                  />
                ))}
              </ol>
              {index === 0 && byes.length > 0 && (
                <p className={classNames(sharedStyles, styles, 'byes')}>
                  {tf('eliminationByes', { names: byes.join(', ') })}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
