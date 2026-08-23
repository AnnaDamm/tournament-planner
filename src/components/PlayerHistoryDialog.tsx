import styles from './PlayerHistoryDialog.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import { t } from '../i18n'
import {
  compareRankingParticipants,
  getMatchResult,
  getMatchSets,
  getRankingParticipants,
  getRunningMatchIdsByRound,
  isByeCounted,
} from '../tournament'
import type { Participant, Round } from '../tournamentTypes'

type Props = {
  player: Participant | null
  players: Participant[]
  rounds: Round[]
  defaultCourtCount: number
  defaultSetPoints: number
  name: (id: string) => string
  onClose: () => void
}

const getPlayerScores = (playerId: string, match: Round['matches'][number]) =>
  getMatchSets(match).map((set) =>
    match.a === playerId
      ? { own: set.a || '–', opponent: set.b || '–' }
      : { own: set.b || '–', opponent: set.a || '–' },
  )

const getSetScore = (playerId: string, match: Round['matches'][number]) =>
  getPlayerScores(playerId, match).reduce(
    (score, set) => {
      const own = Number(set.own)
      const opponent = Number(set.opponent)
      if (!Number.isFinite(own) || !Number.isFinite(opponent) || own === opponent) return score
      if (own > opponent) score.own += 1
      if (opponent > own) score.opponent += 1
      return score
    },
    { own: 0, opponent: 0 },
  )

const getByeSetScore = (round: Round) => ({
  own: Math.max(1, round.winningGames || 1),
  opponent: 0,
})

const getByePlayerScores = (round: Round, defaultSetPoints: number) =>
  Array.from({ length: Math.max(1, round.winningGames || 1) }, () => ({
    own: defaultSetPoints,
    opponent: 0,
  }))

export function PlayerHistoryDialog({
  player,
  players,
  rounds,
  defaultCourtCount,
  defaultSetPoints,
  name,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (player && !dialog.open) dialog.showModal()
    if (!player && dialog.open) dialog.close()
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', handleBackdropClick)
    return () => dialog.removeEventListener('click', handleBackdropClick)
  }, [onClose, player])

  const positionsAfterRounds = useMemo(
    () =>
      rounds.map((_, roundIndex) => {
        const roundsThroughCurrent = rounds.slice(0, roundIndex + 1)
        const nextRound = rounds[roundIndex + 1]
        const rankingRounds = nextRound?.startedAt
          ? [...roundsThroughCurrent, { ...nextRound, bye: null, matches: [] }]
          : roundsThroughCurrent
        return new Map(
          getRankingParticipants(players, rankingRounds, defaultSetPoints)
            .sort(compareRankingParticipants)
            .map((participant, position) => [participant.id, position + 1]),
        )
      }),
    [defaultSetPoints, players, rounds],
  )
  const runningMatchIdsByRound = useMemo(
    () => getRunningMatchIdsByRound(rounds, defaultCourtCount),
    [defaultCourtCount, rounds],
  )
  const playedRoundIndexes = player
    ? rounds.flatMap((round, roundIndex) =>
        (isByeCounted(round, rounds[roundIndex + 1]) && round.bye === player.id) ||
        round.matches.some((match) => match.a === player.id || match.b === player.id)
          ? [roundIndex]
          : [],
      )
    : []
  const withdrawalRoundIndex = player?.withdrawn
    ? Math.min((playedRoundIndexes.at(-1) ?? -1) + 1, rounds.length - 1)
    : -1
  const entries = player
    ? rounds.flatMap((round, roundIndex) => {
        const match = round.matches.find(
          (candidate) => candidate.a === player.id || candidate.b === player.id,
        )
        const result = match ? getMatchResult(match, Math.max(1, round.winningGames || 1)) : null
        const won = result?.winner === player.id
        const opponentId = match ? (match.a === player.id ? match.b : match.a) : null
        const isBye = isByeCounted(round, rounds[roundIndex + 1]) && round.bye === player.id
        const isWithdrawal = !match && !isBye && roundIndex === withdrawalRoundIndex
        if (!match && !isBye && !isWithdrawal) return []
        const isRunning = match
          ? (runningMatchIdsByRound.get(round.number)?.has(match.id) ?? false)
          : false
        return [
          {
            key: `${round.number}-${match?.id ?? (isBye ? 'bye' : 'pending')}`,
            round: round.number,
            positionAfter:
              isWithdrawal || (!isBye && !result)
                ? '—'
                : (positionsAfterRounds[roundIndex].get(player.id) ?? '—'),
            opponent: isBye ? t('bye') : opponentId ? name(opponentId) : '—',
            sets: isBye ? getByeSetScore(round) : !match ? null : getSetScore(player.id, match),
            score: isBye
              ? getByePlayerScores(round, defaultSetPoints)
              : !match
                ? []
                : getPlayerScores(player.id, match),
            outcome: isWithdrawal
              ? t('withdrawn')
              : isRunning
                ? t('running')
                : isBye
                  ? t('win')
                  : result
                    ? won
                      ? t('win')
                      : t('loss')
                    : t('pending'),
            outcomeClass: isWithdrawal
              ? 'negative'
              : isRunning
                ? 'running'
                : isBye || result
                  ? won || isBye
                    ? 'positive'
                    : 'negative'
                  : '',
            rowClass: isRunning ? 'running' : '',
          },
        ]
      })
    : []

  return (
    <dialog
      ref={dialogRef}
      className={classNames(sharedStyles, styles, 'dialog history-dialog')}
      aria-labelledby="player-history-title"
      aria-describedby="player-history-description"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className={classNames(sharedStyles, styles, 'dialog-head')}>
        <div>
          <h2 id="player-history-title">{player?.name}</h2>
          <p id="player-history-description">{t('history')}</p>
        </div>
        <button
          className={classNames(sharedStyles, styles, 'icon-btn')}
          onClick={onClose}
          aria-label={t('close')}
          title={t('close')}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={classNames(sharedStyles, styles, 'history-table-wrap')}>
        {entries.length === 0 ? (
          <p className={classNames(sharedStyles, styles, 'history-empty')}>{t('historyEmpty')}</p>
        ) : (
          <table>
            <caption className={classNames(sharedStyles, styles, 'sr-only')}>
              {t('history')}: {player?.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('round')}</th>
                <th scope="col">{t('positionAfterRound')}</th>
                <th scope="col">{t('opponent')}</th>
                <th scope="col">{t('sets')}</th>
                <th scope="col">{t('score')}</th>
                <th scope="col">{t('result')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.key} className={classNames(sharedStyles, styles, entry.rowClass)}>
                  <td>{entry.round}</td>
                  <td>{entry.positionAfter}</td>
                  <td>{entry.opponent}</td>
                  <td>
                    {entry.sets ? (
                      <>
                        <strong>{entry.sets.own}</strong>:{entry.sets.opponent}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {entry.score.length > 0
                      ? entry.score.map((set, index) => (
                          <span key={index}>
                            {index > 0 && ', '}
                            <strong>{set.own}</strong>:{set.opponent}
                          </span>
                        ))
                      : '—'}
                  </td>
                  <td className={classNames(sharedStyles, styles, entry.outcomeClass)}>
                    {entry.outcome}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </dialog>
  )
}
