import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createEvaluationContext } from '../evaluation'
import { rankParticipants } from '../ranking/rank'
import {
  parseTournamentSnapshot as parseLegacy,
  getRankingParticipants,
  compareRankingParticipants,
} from '../../test/legacyApi'
import { createEmptyTournamentSnapshot, parseTournamentSnapshot } from '.'

const directory = new URL('../../test/fixtures/', import.meta.url)
const files = readdirSync(directory).filter((name) => /^v1-.*\.json$/.test(name))
const load = (name: string) => JSON.parse(readFileSync(new URL(name, directory), 'utf8'))

describe('v1 to v2 migration', () => {
  it.each(files)('%s migrates to a v2 snapshot', (name) => {
    const v1 = load(name)
    const v2 = parseTournamentSnapshot(v1)!
    expect(v2.version).toBe(2)
    expect(v2.id).toBeTruthy()
    expect(v2.scoring.format.winningGames).toBe(v1.defaultWinningGames)
    expect(v2.scoring.format.gamePoints).toBe(v1.defaultSetPoints)
    expect(v2.phases).toHaveLength(1)
    expect(v2.phases[0].mode).toBe('swiss')
    expect(v2.rounds).toHaveLength(v1.rounds.length)
    v2.rounds.forEach((round, index) => {
      expect(round.phaseId).toBe(v2.phases[0].id)
      expect(round.format.winningGames).toBe(v1.rounds[index].winningGames)
      expect('winningGames' in round).toBe(false)
    })
    expect(v2.players.every((player) => !('wins' in player))).toBe(true)
  })

  it.each(files)('%s is idempotent when parsed again', (name) => {
    const v2 = parseTournamentSnapshot(load(name))!
    expect(parseTournamentSnapshot(JSON.parse(JSON.stringify(v2)))).toEqual(v2)
  })

  it.each(files)('%s ranks like the v1 code', (name) => {
    const v1 = load(name)
    const v2 = parseTournamentSnapshot(v1)!
    const legacy = getRankingParticipants(v1.players, v1.rounds, v1.defaultSetPoints).sort(
      compareRankingParticipants,
    )
    const ranked = rankParticipants(v2.players, v2.rounds, createEvaluationContext(v2))
    expect(ranked.map((item) => item.id)).toEqual(legacy.map((item) => item.id))
    expect(ranked.map((item) => [item.wins, item.setsWon, item.scored])).toEqual(
      legacy.map((item) => [item.wins, item.setsWon, item.scored]),
    )
  })

  it('exports the legacy v1 view of a v1 fixture unchanged', () => {
    const v1 = load(files[0])
    expect(parseLegacy(v1)).toStrictEqual(v1)
  })
})

describe('v2 parser', () => {
  const valid = () => JSON.parse(JSON.stringify(createEmptyTournamentSnapshot()))

  it('keeps a valid empty tie-breaker list through a round trip', () => {
    const parsed = parseTournamentSnapshot({ ...valid(), tieBreakers: [] })!
    expect(parsed.tieBreakers).toEqual([])
    expect(parseTournamentSnapshot(JSON.parse(JSON.stringify(parsed)))!.tieBreakers).toEqual([])
    // a list of only unknown ids is invalid and falls back to the default
    expect(
      parseTournamentSnapshot({ ...valid(), tieBreakers: ['nope'] })!.tieBreakers,
    ).toHaveLength(5)
  })

  it('accepts an empty tournament and fills defaults for hand-edited JSON', () => {
    const {
      scoring: _scoring,
      tieBreakers: _tieBreakers,
      teams: _teams,
      phases: _phases,
      ...partial
    } = valid()
    const parsed = parseTournamentSnapshot(partial)!
    expect(parsed.tieBreakers).toEqual([
      'lastLoss',
      'gamesWon',
      'gamesLost',
      'pointsScored',
      'pointsConceded',
    ])
    expect(parsed.phases).toHaveLength(1)
    expect(parsed.scoring.matchPoints).toEqual({ win: 1, draw: 0.5, loss: 0 })
  })

  it.each([
    ['blank name', (value: Record<string, unknown>) => ({ ...value, tournamentName: ' ' })],
    [
      'unknown participant type',
      (value: Record<string, unknown>) => ({ ...value, participantType: 'x' }),
    ],
    [
      'unregistered phase mode',
      (value: Record<string, unknown>) => ({
        ...value,
        phases: [
          { id: 'p', name: '', mode: 'doubleElimination', config: {}, entry: { kind: 'all' } },
        ],
      }),
    ],
    ['empty phases', (value: Record<string, unknown>) => ({ ...value, phases: [] })],
    [
      'round of an unknown phase',
      (value: Record<string, unknown>) => ({
        ...value,
        rounds: [{ number: 1, phaseId: 'nope', format: { winningGames: 1 }, matches: [] }],
      }),
    ],
    ['invalid player', (value: Record<string, unknown>) => ({ ...value, players: [{ id: 1 }] })],
    ['unknown version', (value: Record<string, unknown>) => ({ ...value, version: 3 })],
  ])('rejects %s', (_name, change) => {
    expect(parseTournamentSnapshot(change(valid()))).toBeNull()
  })
})
