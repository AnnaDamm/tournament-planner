import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseTournamentSnapshot } from '../../test/legacyApi'

const directory = new URL('../../test/fixtures/', import.meta.url)
const files = readdirSync(directory).filter((name) => /^v1-.*\.json$/.test(name))

describe('v1 fixtures', () => {
  it('ships three fixtures', () => {
    expect(files).toHaveLength(3)
  })

  it.each(files)('%s parses unchanged', (name) => {
    const json = JSON.parse(readFileSync(new URL(name, directory), 'utf8'))
    expect(parseTournamentSnapshot(json)).toEqual(json)
  })
})
