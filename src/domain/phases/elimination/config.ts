import { clampFormat } from '../../format'
import type { MatchFormat } from '../../types'

export type EliminationConfig = {
  seeding: 'standard' | 'random'
  thirdPlaceMatch: boolean
  /** Format overrides counted from the end: index 0 = final, 1 = semifinals, 2 = quarterfinals ... */
  formatByRoundFromEnd: Partial<MatchFormat>[]
}

export const defaultEliminationConfig = (): EliminationConfig => ({
  seeding: 'standard',
  thirdPlaceMatch: false,
  formatByRoundFromEnd: [],
})

const parseFormatOverride = (raw: unknown): Partial<MatchFormat> => {
  if (typeof raw !== 'object' || raw === null) return {}
  const value = raw as Record<string, unknown>
  const override: Partial<MatchFormat> = {}
  if (typeof value.winningGames === 'number') {
    override.winningGames = clampFormat({ winningGames: value.winningGames }).winningGames
  }
  if (typeof value.gamePoints === 'number') {
    override.gamePoints = clampFormat({ gamePoints: value.gamePoints }).gamePoints
  }
  // Knockout matches always need a winner: a fixed number of games (draws) is not allowed.
  return override
}

/** Overrides without trailing empty entries. */
export const trimFormatOverrides = (formats: Partial<MatchFormat>[]) => {
  const result = [...formats]
  while (result.length > 0 && Object.keys(result.at(-1)!).length === 0) result.pop()
  return result
}

export const parseEliminationConfig = (raw: unknown): EliminationConfig | null => {
  const defaults = defaultEliminationConfig()
  if (raw === undefined || raw === null) return defaults
  if (typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const seeding = value.seeding ?? defaults.seeding
  if (seeding !== 'standard' && seeding !== 'random') return null
  const formats = value.formatByRoundFromEnd ?? []
  if (!Array.isArray(formats)) return null
  return {
    seeding,
    thirdPlaceMatch: value.thirdPlaceMatch === true,
    formatByRoundFromEnd: trimFormatOverrides(formats.slice(0, 32).map(parseFormatOverride)),
  }
}
