import { useCallback } from 'react'
import { t } from '.'
import { getSport } from '../domain/sports/registry'
import type { SportId, TermKey } from '../domain/sports/types'
import { useAppSelector } from '../storeHooks'

export const getTerm = (sport: SportId, key: TermKey) => t(getSport(sport).terms[key])

/** Translates a sport-specific term (set, game, frame, ...) for the current sport. */
export const useTerm = () => {
  const sport = useAppSelector((state) => state.tournament.scoring.sport)
  return useCallback((key: TermKey) => getTerm(sport, key), [sport])
}
