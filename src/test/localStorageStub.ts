import { vi } from 'vitest'

/** Installs an in-memory localStorage; returns the backing map for assertions. */
export const stubLocalStorage = (initial: Record<string, string> = {}) => {
  const data = new Map<string, string>(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  })
  return data
}
