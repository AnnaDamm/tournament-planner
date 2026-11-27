import type { MatchFormat } from '../../types'

// Stub: the elimination phases are implemented by the elimination packages.
export type EliminationConfig = {
  seeding: 'standard' | 'random'
  thirdPlaceMatch: boolean
  formatByRoundFromEnd: Partial<MatchFormat>[]
}

export const parseEliminationConfig = (raw: unknown): EliminationConfig | null => {
  const defaults: EliminationConfig = {
    seeding: 'standard',
    thirdPlaceMatch: false,
    formatByRoundFromEnd: [],
  }
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
    formatByRoundFromEnd: formats.filter((item) => typeof item === 'object' && item !== null),
  }
}
