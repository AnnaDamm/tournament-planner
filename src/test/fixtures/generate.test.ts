import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildFixtures, serializeFixture } from './generate'

const directory = new URL('./', import.meta.url)

// REGENERATE_FIXTURES=1 rewrites the committed fixtures; otherwise they are verified.
describe('v1 fixture generator', () => {
  it.each(Object.entries(buildFixtures()))('%s is up to date', (name, snapshot) => {
    const text = serializeFixture(snapshot)
    if (process.env.REGENERATE_FIXTURES) writeFileSync(new URL(name, directory), text)
    expect(readFileSync(new URL(name, directory), 'utf8')).toBe(text)
  })
})
