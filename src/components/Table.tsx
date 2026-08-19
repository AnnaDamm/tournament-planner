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
}
type Props = { sorted: Stat[]; desc: boolean; toggleSort: (key: string) => void }

export function Table({ sorted, desc, toggleSort }: Props) {
  const columns = [
    ['name', 'NAME'],
    ['wins', t('wins')],
    ['losses', t('losses')],
    ['played', t('games')],
    ['setsWon', t('sets')],
    ['points', t('points')],
    ['diff', t('difference')],
  ]
  return (
    <>
      <PageTitle eyebrow={t('ranking')} title={t('table')}>
        <span className="round-status">
          <i /> {t('sorted')}
        </span>
      </PageTitle>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('position')}</th>
              {columns.map(([key, label]) => (
                <th key={key}>
                  <button onClick={() => toggleSort(key)}>
                    {label}
                    <ChevronDown size={14} className={desc ? 'sort-down' : ''} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, index) => (
              <tr key={player.id}>
                <td>
                  <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                </td>
                <td>
                  <b>{player.name}</b>
                </td>
                <td>{player.wins}</td>
                <td>{player.losses}</td>
                <td>{player.played}</td>
                <td>
                  {player.setsWon}:{player.setsLost}
                </td>
                <td>
                  <strong>
                    {player.scored}:{player.conceded}
                  </strong>
                </td>
                <td className={player.diff >= 0 ? 'positive' : 'negative'}>
                  {player.diff > 0 ? '+' : ''}
                  {player.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">{t('note')}</p>
    </>
  )
}
