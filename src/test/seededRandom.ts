import { vi } from 'vitest'

/** Deterministic PRNG (mulberry32); returns values in [0, 1). */
export const mulberry32 = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Runs `fn` with `Math.random` replaced by a seeded generator and restores it afterwards. */
export const withSeed = <T>(seed: number, fn: () => T): T => {
  const spy = vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed))
  try {
    return fn()
  } finally {
    spy.mockRestore()
  }
}
