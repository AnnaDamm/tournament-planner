import styles from './RankingsPage.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import type { ReactNode } from 'react'
import { t } from '../../i18n'
import type { ScoringRules } from '../../domain/scoring/types'
import type { TermKey } from '../../domain/sports/types'
import type { TieBreakerId } from '../../domain/ranking/types'
import type { Participant, PhaseModeId } from '../../domain/types'
import type { SortValue } from '../../tournamentStats'

export type RankingRow = Participant & {
  wins: number
  losses: number
  scored: number
  conceded: number
  diff: number
  points: number
  setsWon: number
  setsLost: number
  played: number
  position: number
}

export type RankingColumnEnv = {
  rules: ScoringRules
  tieBreakers: TieBreakerId[]
  phaseMode: PhaseModeId
}

/** A sortable statistics column of the ranking table; `id` is the sort key of the row field. */
export type RankingColumn = {
  id: string
  header: (term: (key: TermKey) => string) => string
  value: (row: RankingRow, context: { mostPlayed: number }) => ReactNode
  /** Sort key for columns that are not a field of the row; the id is used as field otherwise. */
  sortValue?: SortValue
  strong?: boolean
  visible?: (env: RankingColumnEnv) => boolean
}

const formatDifference = (value: number) => (value > 0 ? `+${value}` : String(value))

// Append-only: one entry line per column (a later package adds draws, Buchholz, ...).
export const rankingColumns: RankingColumn[] = [
  { id: 'wins', header: () => t('wins'), value: (row) => row.wins },
  {
    id: 'played',
    header: () => t('games'),
    value: (row, { mostPlayed }) => (
      <>
        {row.played}
        {mostPlayed - row.played > 0 && (
          <small
            className={classNames(sharedStyles, styles, 'games-behind')}
            title={t('fewerGames')}
          >
            (-{mostPlayed - row.played})
          </small>
        )}
      </>
    ),
  },
  {
    id: 'setsWon',
    header: (term) => term('gamesHeader'),
    value: (row) =>
      `${row.setsWon}:${row.setsLost} (${formatDifference(row.setsWon - row.setsLost)})`,
  },
  {
    id: 'points',
    header: (term) => term('pointsHeader'),
    strong: true,
    value: (row) =>
      `${row.scored}:${row.conceded} (${formatDifference(row.scored - row.conceded)})`,
  },
]
