import { gamesLost, gamesWon, lastLoss, pointsConceded, pointsScored } from './defaultTieBreakers'
import type { TieBreaker, TieBreakerId } from './types'

// Append-only: one import line and one entry line per tie-breaker.
export const tieBreakers: Partial<Record<TieBreakerId, TieBreaker>> = {
  lastLoss,
  gamesWon,
  gamesLost,
  pointsScored,
  pointsConceded,
}

/** Exactly the ranking order of earlier versions: after the match points. */
export const DEFAULT_TIE_BREAKERS: TieBreakerId[] = [
  'lastLoss',
  'gamesWon',
  'gamesLost',
  'pointsScored',
  'pointsConceded',
]
