export type SwissConfig = {
  variant: 'standard' | 'accelerated' | 'danish'
  acceleratedRounds?: number
}

const variants: SwissConfig['variant'][] = ['standard', 'accelerated', 'danish']

export const parseSwissConfig = (raw: unknown): SwissConfig | null => {
  if (raw === undefined || raw === null) return { variant: 'standard' }
  if (typeof raw !== 'object') return null
  const { variant = 'standard', acceleratedRounds } = raw as Record<string, unknown>
  if (!variants.includes(variant as SwissConfig['variant'])) return null
  const config: SwissConfig = { variant: variant as SwissConfig['variant'] }
  if (typeof acceleratedRounds === 'number' && Number.isFinite(acceleratedRounds)) {
    config.acceleratedRounds = Math.max(1, Math.floor(acceleratedRounds))
  }
  return config
}
