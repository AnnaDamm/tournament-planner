import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  calculateStandings,
  compareRankingParticipants,
  getRankingParticipants,
  parseTournamentSnapshot,
} from '../../test/legacyApi'
import { projectCourts, projectRanking, projectRounds } from '../../test/project'

const directory = new URL('../../test/fixtures/', import.meta.url)
const files = readdirSync(directory).filter((name) => /^v1-.*\.json$/.test(name))

describe('v1 fixtures', () => {
  it('ships three fixtures', () => {
    expect(files).toHaveLength(3)
  })

  it.each(files)('%s parses unchanged', (name) => {
    const json = JSON.parse(readFileSync(new URL(name, directory), 'utf8'))
    expect(parseTournamentSnapshot(json)).toStrictEqual(json)
  })

  it.each(files)('%s projections', (name) => {
    const json = JSON.parse(readFileSync(new URL(name, directory), 'utf8'))
    const snapshot = parseTournamentSnapshot(json)
    if (!snapshot) throw new Error(`${name} does not parse`)
    const { players, rounds, defaultSetPoints } = snapshot
    expect(projectRanking(calculateStandings(players, rounds, defaultSetPoints))).toMatchSnapshot(
      'standings',
    )
    expect(
      projectRanking(
        getRankingParticipants(players, rounds, defaultSetPoints).sort(compareRankingParticipants),
      ),
    ).toMatchSnapshot('ranking')
    expect(projectRounds(rounds)).toMatchSnapshot('rounds')
    expect(projectCourts(rounds)).toMatchSnapshot('courts')
  })
})
