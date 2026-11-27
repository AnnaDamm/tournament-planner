import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildFixtures, serializeFixture } from './generate'

// The committed v1-*.json files are frozen exports and the source of truth: never regenerate
// them to make tests green. REGENERATE_FIXTURES=1 rewrites them on purpose; otherwise only their
// structure is verified, so changes to ID generation or planning cannot invalidate them.
const directory = new URL('./', import.meta.url)
const names = ['v1-small-finished.json', 'v1-mid-unknowns.json', 'v1-teams-courts-bye.json']

if (process.env.REGENERATE_FIXTURES) {
  describe('v1 fixture generator', () => {
    it.each(Object.entries(buildFixtures()))('writes %s', (name, snapshot) => {
      writeFileSync(new URL(name, directory), serializeFixture(snapshot))
    })
  })
}

describe('committed v1 fixtures', () => {
  it.each(names)('%s is well-formed', (name) => {
    const text = readFileSync(new URL(name, directory), 'utf8')
    const json = JSON.parse(text)
    expect(serializeFixture(json)).toBe(text)
    expect(json.version).toBe(1)
    expect(json.players.length).toBeGreaterThanOrEqual(4)
    const playerIds = new Set<string>(json.players.map((item: { id: string }) => item.id))
    const matchIds = new Set<string>()
    json.rounds.forEach(
      (
        item: { number: number; matches: Array<{ id: string; a: string; b: string }> },
        index: number,
      ) => {
        expect(item.number).toBe(index + 1)
        item.matches.forEach((entry) => {
          expect(matchIds.has(entry.id)).toBe(false)
          matchIds.add(entry.id)
          for (const side of [entry.a, entry.b]) {
            expect(playerIds.has(side) || side.startsWith('__unknown__:')).toBe(true)
          }
        })
      },
    )
  })
})
