import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { t } from '../i18n'
import { compareRankingParticipants, getMatchResult, getRankingParticipants } from '../tournament'
import type { Match, Participant, Round } from '../tournamentTypes'

type PlayerPair = readonly [string, string]

type Props = {
  playerIds: PlayerPair | null
  roundIndex: number | null
  players: Participant[]
  rounds: Round[]
  defaultSetPoints: number
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

const getStats = (players: Participant[], rounds: Round[], defaultSetPoints: number) => {
  const ranking = getRankingParticipants(players, rounds, defaultSetPoints).sort(
    compareRankingParticipants,
  )
  return new Map<string, ComparisonPlayer>(
    ranking.map((player, position) => [
      player.id,
      {
        id: player.id,
        name: player.name,
        position: position + 1,
        wins: player.wins,
        losses: player.losses,
        played: player.wins + player.losses,
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
  firstId: string,
  secondId: string,
  rounds: Round[],
): [DirectStats, DirectStats] => {
  const stats: [DirectStats, DirectStats] = [emptyDirectStats(), emptyDirectStats()]
  rounds.forEach((round) => {
    round.matches
      .filter((match) => isMatchBetween(match, firstId, secondId))
      .forEach((match) => {
        const result = getMatchResult(match, Math.max(1, round.winningGames || 1))
        if (!result) return
        const first = stats[0]
        const second = stats[1]
        first.played += 1
        second.played += 1
        if (result.winner === firstId) {
          first.wins += 1
          second.losses += 1
        } else {
          first.losses += 1
          second.wins += 1
        }
        result.sets.forEach((set) => {
          const pointsA = Number(set.a)
          const pointsB = Number(set.b)
          if (match.a === firstId) {
            first.scored += pointsA
            first.conceded += pointsB
            second.scored += pointsB
            second.conceded += pointsA
            first.setsWon += pointsA > pointsB ? 1 : 0
            first.setsLost += pointsA < pointsB ? 1 : 0
            second.setsWon += pointsB > pointsA ? 1 : 0
            second.setsLost += pointsB < pointsA ? 1 : 0
          } else {
            first.scored += pointsB
            first.conceded += pointsA
            second.scored += pointsA
            second.conceded += pointsB
            first.setsWon += pointsB > pointsA ? 1 : 0
            first.setsLost += pointsB < pointsA ? 1 : 0
            second.setsWon += pointsA > pointsB ? 1 : 0
            second.setsLost += pointsA < pointsB ? 1 : 0
          }
        })
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

export function PlayerComparisonDialog({
  playerIds,
  roundIndex,
  players,
  rounds,
  defaultSetPoints,
  name,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [view, setView] = useState<ComparisonView>('current')
  const roundsBeforeSelected = useMemo(
    () => (roundIndex === null ? rounds : rounds.slice(0, roundIndex)),
    [roundIndex, rounds],
  )
  const currentStats = useMemo(
    () => getStats(players, rounds, defaultSetPoints),
    [defaultSetPoints, players, rounds],
  )
  const previousStats = useMemo(
    () => getStats(players, roundsBeforeSelected, defaultSetPoints),
    [defaultSetPoints, players, roundsBeforeSelected],
  )
  const comparison = useMemo(() => {
    if (!playerIds) return null
    const stats = view === 'current' ? currentStats : previousStats
    const comparisonRounds = view === 'current' ? rounds : roundsBeforeSelected
    const first = stats.get(playerIds[0])
    const second = stats.get(playerIds[1])
    if (!first || !second) return null
    return { first, second, direct: getDirectStats(first.id, second.id, comparisonRounds) }
  }, [currentStats, playerIds, previousStats, rounds, roundsBeforeSelected, view])

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
        [t('sets'), formatSets(comparison.first), formatSets(comparison.second)],
        [t('points'), formatPoints(comparison.first), formatPoints(comparison.second)],
        [
          t('difference'),
          formatDifference(comparison.first.scored - comparison.first.conceded),
          formatDifference(comparison.second.scored - comparison.second.conceded),
        ],
      ]
    : []

  return (
    <dialog
      ref={dialogRef}
      className="dialog comparison-dialog"
      aria-labelledby="player-comparison-title"
      aria-describedby="player-comparison-description"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="dialog-head">
        <div>
          <h2 id="player-comparison-title">{t('comparison')}</h2>
          <p id="player-comparison-description">{t('comparisonDescription')}</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')} title={t('close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {comparison && (
        <>
          <div className="comparison-tabs" role="tablist" aria-label={t('comparisonViews')}>
            <button
              className="comparison-tab"
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
              className="comparison-tab"
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
            className="comparison-panel"
            id="comparison-panel"
            role="tabpanel"
            aria-labelledby={
              view === 'current' ? 'comparison-tab-current' : 'comparison-tab-before-round'
            }
            tabIndex={0}
          >
            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <caption className="sr-only">{t('comparison')}</caption>
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
            <section className="direct-comparison" aria-labelledby="head-to-head-title">
              <h3 id="head-to-head-title">{t('headToHead')}</h3>
              {comparison.direct[0].played === 0 ? (
                <p className="comparison-empty">{t('noHeadToHead')}</p>
              ) : (
                <div className="comparison-table-wrap">
                  <table className="comparison-table direct-comparison-table">
                    <caption className="sr-only">{t('headToHead')}</caption>
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
                        <th scope="row">{t('sets')}</th>
                        <td>{formatSets(comparison.direct[0])}</td>
                        <td>{formatSets(comparison.direct[1])}</td>
                      </tr>
                      <tr>
                        <th scope="row">{t('points')}</th>
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
