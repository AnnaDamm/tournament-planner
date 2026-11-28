import styles from './PlayerComparisonDialog.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { t } from '../../i18n'
import { useTerm } from '../../i18n/useTerm'
import { usePhaseScopes } from '../../hooks/usePhaseScopes'
import {
  compareRankingParticipants,
  getRoundMatchResult,
  type EvaluationContext,
  getRankingParticipants,
} from '../../tournament'
import type { Match, Participant, Round } from '../../tournamentTypes'

type PlayerPair = readonly [string, string]

type Props = {
  playerIds: PlayerPair | null
  roundIndex: number | null
  players: Participant[]
  rounds: Round[]
  ctx: EvaluationContext
  name: (id: string) => string
  onClose: () => void
}

type ComparisonPlayer = {
  id: string
  name: string
  position: number
  wins: number
  losses: number
  played: number
  setsWon: number
  setsLost: number
  scored: number
  conceded: number
}

type DirectStats = Pick<
  ComparisonPlayer,
  'played' | 'wins' | 'losses' | 'setsWon' | 'setsLost' | 'scored' | 'conceded'
>

type ComparisonView = 'current' | 'beforeRound'

const emptyDirectStats = (): DirectStats => ({
  played: 0,
  wins: 0,
  losses: 0,
  setsWon: 0,
  setsLost: 0,
  scored: 0,
  conceded: 0,
})

const getStats = (players: Participant[], rounds: Round[], ctx: EvaluationContext) => {
  const ranking = getRankingParticipants(players, rounds, ctx).sort(compareRankingParticipants)
  return new Map<string, ComparisonPlayer>(
    ranking.map((player, position) => [
      player.id,
      {
        id: player.id,
        name: player.name,
        position: position + 1,
        wins: player.wins,
        losses: player.losses,
        played: player.wins + player.draws + player.losses,
        setsWon: player.setsWon,
        setsLost: player.setsLost,
        scored: player.scored,
        conceded: player.conceded,
      },
    ]),
  )
}

const isMatchBetween = (match: Match, firstId: string, secondId: string) =>
  (match.a === firstId && match.b === secondId) || (match.a === secondId && match.b === firstId)

const getDirectStats = (
  ctx: EvaluationContext,
  firstId: string,
  secondId: string,
  rounds: Round[],
): [DirectStats, DirectStats] => {
  const stats: [DirectStats, DirectStats] = [emptyDirectStats(), emptyDirectStats()]
  rounds.forEach((round) => {
    round.matches
      .filter((match) => isMatchBetween(match, firstId, secondId))
      .forEach((match) => {
        const result = getRoundMatchResult(ctx, round, match)
        if (!result) return
        const first = stats[0]
        const second = stats[1]
        first.played += 1
        second.played += 1
        if (result.winner === firstId) {
          first.wins += 1
          second.losses += 1
        } else if (result.winner === secondId) {
          first.losses += 1
          second.wins += 1
        }
        const firstIsA = match.a === firstId
        const [firstGames, secondGames] = firstIsA
          ? [result.gamesA, result.gamesB]
          : [result.gamesB, result.gamesA]
        const [firstPoints, secondPoints] = firstIsA
          ? [result.pointsA, result.pointsB]
          : [result.pointsB, result.pointsA]
        first.scored += firstPoints
        first.conceded += secondPoints
        second.scored += secondPoints
        second.conceded += firstPoints
        first.setsWon += firstGames
        first.setsLost += secondGames
        second.setsWon += secondGames
        second.setsLost += firstGames
      })
  })
  return stats
}

const formatDifference = (value: number) => (value > 0 ? `+${value}` : String(value))

const formatRecord = (player: ComparisonPlayer | DirectStats) => `${player.wins}:${player.losses}`
const formatSets = (player: ComparisonPlayer | DirectStats) =>
  `${player.setsWon}:${player.setsLost}`
const formatPoints = (player: ComparisonPlayer | DirectStats) =>
  `${player.scored}:${player.conceded}`

// oxlint-disable-next-line eslint/max-lines-per-function
export function PlayerComparisonDialog({
  playerIds,
  roundIndex,
  players,
  rounds,
  ctx,
  name,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cn = (...values: Array<string | false | null | undefined>) =>
    classNames(sharedStyles, styles, ...values)
  const term = useTerm()
  const [view, setView] = useState<ComparisonView>('current')
  const scopeFor = usePhaseScopes(players, rounds)
  // Players are compared within the phase of the round the comparison was opened from.
  const selectedRound = rounds[roundIndex ?? rounds.length - 1]
  const scope = useMemo(
    () => scopeFor(selectedRound?.phaseId ?? ''),
    [scopeFor, selectedRound?.phaseId],
  )
  const phaseRounds = scope.rounds
  const roundsBeforeSelected = useMemo(
    () =>
      roundIndex === null
        ? phaseRounds
        : phaseRounds.filter((round) => round.number < rounds[roundIndex].number),
    [phaseRounds, roundIndex, rounds],
  )
  const currentStats = useMemo(
    () => getStats(scope.entrants, phaseRounds, scope.ctx),
    [scope, phaseRounds],
  )
  const previousStats = useMemo(
    () => getStats(scope.entrants, roundsBeforeSelected, scope.ctx),
    [scope, roundsBeforeSelected],
  )
  const comparison = useMemo(() => {
    if (!playerIds) return null
    const stats = view === 'current' ? currentStats : previousStats
    const comparisonRounds = view === 'current' ? phaseRounds : roundsBeforeSelected
    const first = stats.get(playerIds[0])
    const second = stats.get(playerIds[1])
    if (!first || !second) return null
    return { first, second, direct: getDirectStats(ctx, first.id, second.id, comparisonRounds) }
  }, [ctx, currentStats, phaseRounds, playerIds, previousStats, roundsBeforeSelected, view])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (comparison && !dialog.open) dialog.showModal()
    if (!comparison && dialog.open) dialog.close()
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', handleBackdropClick)
    return () => dialog.removeEventListener('click', handleBackdropClick)
  }, [comparison, onClose])

  const rows = comparison
    ? [
        [t('position'), comparison.first.position, comparison.second.position],
        [t('wins'), comparison.first.wins, comparison.second.wins],
        [t('losses'), comparison.first.losses, comparison.second.losses],
        [t('games'), comparison.first.played, comparison.second.played],
        [term('gamesHeader'), formatSets(comparison.first), formatSets(comparison.second)],
        [term('pointsHeader'), formatPoints(comparison.first), formatPoints(comparison.second)],
        [
          term('differenceHeader'),
          formatDifference(comparison.first.scored - comparison.first.conceded),
          formatDifference(comparison.second.scored - comparison.second.conceded),
        ],
      ]
    : []

  return (
    <dialog
      ref={dialogRef}
      className={cn('dialog comparison-dialog')}
      aria-labelledby="player-comparison-title"
      aria-describedby="player-comparison-description"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className={cn('dialog-head')}>
        <div>
          <h2 id="player-comparison-title">{t('comparison')}</h2>
          <p id="player-comparison-description">{t('comparisonDescription')}</p>
        </div>
        <button
          className={cn('icon-btn')}
          onClick={onClose}
          aria-label={t('close')}
          title={t('close')}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {comparison && (
        <>
          <div className={cn('comparison-tabs')} role="tablist" aria-label={t('comparisonViews')}>
            <button
              className={cn('comparison-tab')}
              type="button"
              role="tab"
              id="comparison-tab-current"
              aria-selected={view === 'current'}
              aria-controls="comparison-panel"
              onClick={() => setView('current')}
            >
              {t('currentStats')}
            </button>
            <button
              className={cn('comparison-tab')}
              type="button"
              role="tab"
              id="comparison-tab-before-round"
              aria-selected={view === 'beforeRound'}
              aria-controls="comparison-panel"
              onClick={() => setView('beforeRound')}
            >
              {t('beforeSelectedRound')}
            </button>
          </div>
          <section
            className={cn('comparison-panel')}
            id="comparison-panel"
            role="tabpanel"
            aria-labelledby={
              view === 'current' ? 'comparison-tab-current' : 'comparison-tab-before-round'
            }
            tabIndex={0}
          >
            <div className={cn('comparison-table-wrap')}>
              <table className={cn('comparison-table')}>
                <caption className={cn('sr-only')}>{t('comparison')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('statistics')}</th>
                    <th scope="col">{name(comparison.first.id)}</th>
                    <th scope="col">{name(comparison.second.id)}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, firstValue, secondValue]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{firstValue}</td>
                      <td>{secondValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <section className={cn('direct-comparison')} aria-labelledby="head-to-head-title">
              <h3 id="head-to-head-title">{t('headToHead')}</h3>
              {comparison.direct[0].played === 0 ? (
                <p className={cn('comparison-empty')}>{t('noHeadToHead')}</p>
              ) : (
                <div className={cn('comparison-table-wrap')}>
                  <table
                    className={classNames(
                      sharedStyles,
                      styles,
                      'comparison-table direct-comparison-table',
                    )}
                  >
                    <caption className={cn('sr-only')}>{t('headToHead')}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t('statistics')}</th>
                        <th scope="col">{name(comparison.first.id)}</th>
                        <th scope="col">{name(comparison.second.id)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">{t('playedMatches')}</th>
                        <td>{comparison.direct[0].played}</td>
                        <td>{comparison.direct[1].played}</td>
                      </tr>
                      <tr>
                        <th scope="row">{t('record')}</th>
                        <td>{formatRecord(comparison.direct[0])}</td>
                        <td>{formatRecord(comparison.direct[1])}</td>
                      </tr>
                      <tr>
                        <th scope="row">{term('gamesHeader')}</th>
                        <td>{formatSets(comparison.direct[0])}</td>
                        <td>{formatSets(comparison.direct[1])}</td>
                      </tr>
                      <tr>
                        <th scope="row">{term('pointsHeader')}</th>
                        <td>{formatPoints(comparison.direct[0])}</td>
                        <td>{formatPoints(comparison.direct[1])}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        </>
      )}
    </dialog>
  )
}
