// Stub: the group phase (round robin) is implemented by the groups package.
export type RoundRobinConfig = {
  groupCount: number
  legs: 1 | 2
  seeding: 'snake' | 'random'
}

export const parseRoundRobinConfig = (raw: unknown): RoundRobinConfig | null => {
  if (raw === undefined || raw === null) return { groupCount: 2, legs: 1, seeding: 'snake' }
  if (typeof raw !== 'object') return null
  const { groupCount = 2, legs = 1, seeding = 'snake' } = raw as Record<string, unknown>
  if (typeof groupCount !== 'number' || !Number.isFinite(groupCount)) return null
  if (legs !== 1 && legs !== 2) return null
  if (seeding !== 'snake' && seeding !== 'random') return null
  return { groupCount: Math.max(1, Math.floor(groupCount)), legs, seeding }
}
