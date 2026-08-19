import { ChevronDown } from 'lucide-react'
import { PageTitle } from './PageTitle'
import { t } from '../i18n'
import type { Participant } from './Players'

export type Stat = Participant & {
  diff: number
  points: number
  setsWon: number
  setsLost: number
  played: number
  position: number
}
type Props = {
  sorted: Stat[]
  sort: string
  desc: boolean
  toggleSort: (key: string) => void
}

const formatDifference = (value: number) => (value > 0 ? `+${value}` : String(value))

export function Table({ sorted, sort, desc, toggleSort }: Props) {
  const mostPlayed = Math.max(0, ...sorted.map((player) => player.played))
  const columns = [
    ['name', 'NAME'],
    ['wins', t('wins')],
    ['losses', t('losses')],
    ['played', t('games')],
    ['setsWon', t('sets')],
    ['points', t('points')],
  ]
  return (
    <>
      <PageTitle eyebrow={t('ranking')} title={t('table')} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <button
                  className={sort === 'position' ? 'sort-active' : ''}
                  onClick={() => toggleSort('position')}
                >
                  {t('position')}
                  <ChevronDown
                    size={14}
                    className={sort === 'position' && desc ? 'sort-down' : ''}
                  />
                </button>
              </th>
              {columns.map(([key, label]) => (
                <th key={key}>
                  <button
                    className={sort === key ? 'sort-active' : ''}
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <ChevronDown size={14} className={sort === key && desc ? 'sort-down' : ''} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player) => {
              const gamesBehind = mostPlayed - player.played
              return (
                <tr key={player.id} className={player.withdrawn ? 'withdrawn-row' : ''}>
                  <td>
                    <span className={`rank rank-${player.position}`}>{player.position}</span>
                  </td>
                  <td>
                    <b
                      className={
                        player.withdrawn ? 'table-player-name withdrawn-name' : 'table-player-name'
                      }
                    >
                      {player.name}
                    </b>
                  </td>
                  <td>{player.wins}</td>
                  <td>{player.losses}</td>
                  <td>
                    {player.played}
                    {gamesBehind > 0 && (
                      <small className="games-behind" title={t('fewerGames')}>
                        (-{gamesBehind})
                      </small>
                    )}
                  </td>
                  <td>
                    {player.setsWon}:{player.setsLost} (
                    {formatDifference(player.setsWon - player.setsLost)})
                  </td>
                  <td>
                    <strong>
                      {player.scored}:{player.conceded} (
                      {formatDifference(player.scored - player.conceded)})
                    </strong>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="table-note">{t('note')}</p>
    </>
  )
}
