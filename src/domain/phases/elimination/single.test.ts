import { describe, expect, it } from 'vitest'
import { createTournamentStore } from '../../../store'
import {
  isRoundUpdateBlocked,
  startFirstPhase,
  updateRoundMatch,
  updateRoundMatches,
} from '../../../tournamentCommands'
import { createEmptyTournamentSnapshot } from '../../snapshot'
import type { Match, MatchSource, Phase, Round, TournamentSnapshot } from '../../types'
import { applyPhaseResolution, buildPhaseContext } from '../phaseState'
import { singleEliminationMode } from './single'
import { getStandardSeedOrder } from './seeding'

const makeSnapshot = (
  count: number,
  config: Record<string, unknown> = {},
  format: Phase['format'] = { winningGames: 1 },
): TournamentSnapshot => {
  const base = createEmptyTournamentSnapshot()
  const phase: Phase = {
    ...base.phases[0],
    mode: 'singleElimination',
    config: { seeding: 'standard', thirdPlaceMatch: false, formatByRoundFromEnd: [], ...config },
    format,
  }
  return {
    ...base,
    players: Array.from({ length: count }, (_, index) => ({
      id: `p${index + 1}`,
      name: `Player ${index + 1}`,
    })),
    phases: [phase],
    courtCount: 8,
  }
}

const createBracket = (snapshot: TournamentSnapshot) => {
  const p = buildPhaseContext(snapshot, snapshot.phases[0].id)!
  return applyPhaseResolution({
    ...snapshot,
    rounds: singleEliminationMode.initPhase(p as never, 1),
  })
}

const setSets = (snapshot: TournamentSnapshot, matchId: string, sets: Match['sets']) =>
  applyPhaseResolution({
    ...snapshot,
    rounds: snapshot.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((item) => (item.id === matchId ? { ...item, sets } : item)),
    })),
  })

const play = (snapshot: TournamentSnapshot, match: Match, winner: 'a' | 'b') =>
  setSets(snapshot, match.id, [winner === 'a' ? { a: '21', b: '5' } : { a: '5', b: '21' }])

/** The better seed (lower player number) wins every match. */
const playAll = (start: TournamentSnapshot) => {
  let snapshot = start
  const number = (id: string) => Number(id.slice(1))
  for (const round of start.rounds) {
    for (const match of round.matches) {
      const current = snapshot.rounds
        .find((item) => item.number === round.number)!
        .matches.find((item) => item.id === match.id)!
      snapshot = play(snapshot, current, number(current.a) < number(current.b) ? 'a' : 'b')
    }
  }
  return snapshot
}

const context = (snapshot: TournamentSnapshot) =>
  buildPhaseContext(snapshot, snapshot.phases[0].id)! as never
const placementsOf = (snapshot: TournamentSnapshot) =>
  singleEliminationMode.getPlacements(context(snapshot))

describe('standard seeding', () => {
  it('pairs the best seed with the weakest and keeps the best two apart', () => {
    expect(getStandardSeedOrder(2)).toEqual([1, 2])
    expect(getStandardSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
    expect(getStandardSeedOrder(16).slice(0, 4)).toEqual([1, 16, 8, 9])
  })
})

describe('single elimination brackets', () => {
  it.each(Array.from({ length: 16 }, (_, index) => index + 2))(
    'plays %i participants to the end',
    (count) => {
      const bracket = createBracket(makeSnapshot(count))
      const seeds = bracket.rounds
        .flatMap((round) => round.matches)
        .flatMap((match) => [match.sourceA, match.sourceB])
        .filter(
          (source): source is Extract<MatchSource, { kind: 'seed' }> => source?.kind === 'seed',
        )
      expect(new Set(seeds.map((source) => source.seed)).size).toBe(count)
      expect(bracket.rounds.flatMap((round) => round.matches)).toHaveLength(count - 1)

      const done = playAll(bracket)
      expect(singleEliminationMode.isComplete(context(done))).toBe(true)
      const placements = placementsOf(done)
      expect(placements).toHaveLength(count)
      expect(placements[0]).toMatchObject({ participantId: 'p1', place: 1 })
      expect(placements[1]).toMatchObject({ participantId: 'p2', place: 2 })
    },
  )

  it('gives the best seeds a bye with 6 participants', () => {
    const bracket = createBracket(makeSnapshot(6))
    expect(bracket.rounds.map((round) => round.matches.length)).toEqual([2, 2, 1])
    const firstRoundIds = bracket.rounds[0].matches.flatMap((match) => [match.a, match.b])
    expect(firstRoundIds).not.toContain('p1')
    expect(firstRoundIds).not.toContain('p2')
    expect(bracket.rounds[1].matches.map((match) => match.a)).toEqual(['p1', 'p2'])
    expect(bracket.rounds[1].matches[0].b).toMatch(/^__unknown__:/)
  })

  it('shows the winner in the next match once a result is entered', () => {
    const bracket = createBracket(makeSnapshot(6))
    const first = bracket.rounds[0].matches[0]
    expect([first.a, first.b]).toEqual(['p4', 'p5'])
    const played = play(bracket, first, 'b')
    expect(played.rounds[1].matches[0].b).toBe('p5')
    // Taking the result back puts the placeholder back.
    const undone = setSets(played, first.id, [])
    expect(undone.rounds[1].matches[0].b).toMatch(/^__unknown__:/)
  })

  it('does not advance anybody on a draw', () => {
    const bracket = createBracket(makeSnapshot(4))
    const drawn = setSets(bracket, bracket.rounds[0].matches[0].id, [{ a: '10', b: '10' }])
    expect(drawn.rounds[1].matches[0].a).toMatch(/^__unknown__:/)
    expect(singleEliminationMode.isComplete(context(drawn))).toBe(false)
  })

  it('plays a match for third place between the semifinal losers', () => {
    const bracket = createBracket(makeSnapshot(8, { thirdPlaceMatch: true }))
    expect(bracket.rounds.map((round) => round.title?.key)).toEqual([
      'eliminationQuarterfinal',
      'eliminationSemifinal',
      'eliminationThirdPlace',
      'eliminationFinal',
    ])
    expect(bracket.rounds[2].matches[0]).toMatchObject({
      bracket: 'thirdPlace',
      sourceA: { kind: 'loser' },
    })
    const placements = placementsOf(playAll(bracket))
    expect(placements.map((placement) => [placement.participantId, placement.place])).toEqual([
      ['p1', 1],
      ['p2', 2],
      ['p3', 3],
      ['p4', 4],
      ['p5', 5],
      ['p6', 5],
      ['p7', 5],
      ['p8', 5],
    ])
  })

  it('ranks the losers of a round together (1, 2, 3-4, 5-6)', () => {
    const placements = placementsOf(playAll(createBracket(makeSnapshot(6))))
    expect(placements.map((placement) => [placement.place, placement.placeTo])).toEqual([
      [1, undefined],
      [2, undefined],
      [3, 4],
      [3, 4],
      [5, 6],
      [5, 6],
    ])
  })

  it('uses the format of the final, the semifinals and the other rounds', () => {
    const bracket = createBracket(
      makeSnapshot(8, { formatByRoundFromEnd: [{ winningGames: 3 }, { winningGames: 2 }] }),
    )
    expect(bracket.rounds.map((round) => round.format.winningGames)).toEqual([1, 2, 3])
  })

  it('never uses a fixed number of games', () => {
    const bracket = createBracket(makeSnapshot(4, {}, { winningGames: 2, fixedGames: 2 }))
    expect(bracket.rounds.every((round) => round.format.fixedGames === undefined)).toBe(true)
  })

  it('keeps the participants of a match that already has scores', () => {
    const bracket = createBracket(makeSnapshot(4))
    const [first, second] = bracket.rounds[0].matches
    const afterFirst = play(bracket, first, 'a')
    const scored = setSets(afterFirst, afterFirst.rounds[1].matches[0].id, [{ a: '21', b: '3' }])
    const changed = play(scored, second, 'a')
    expect(changed.rounds[1].matches[0].a).toBe(first.a)
  })
})

describe('changing an earlier result', () => {
  it('is blocked when the winner changes and the follow-up match has scores', () => {
    const bracket = createBracket(makeSnapshot(4))
    const [first, second] = bracket.rounds[0].matches
    let state = play(bracket, first, 'a')
    state = play(state, second, 'a')
    state = play(state, state.rounds[1].matches[0], 'a')
    const store = createTournamentStore(state)
    const sameWinner = state.rounds[0].matches.map((item) =>
      item.id === first.id ? { ...item, sets: [{ a: '21', b: '9' }] } : item,
    )
    const otherWinner = state.rounds[0].matches.map((item) =>
      item.id === first.id ? { ...item, sets: [{ a: '5', b: '21' }] } : item,
    )
    const current = store.getState().tournament
    expect(isRoundUpdateBlocked(current, 0, sameWinner)).toBe(false)
    expect(isRoundUpdateBlocked(current, 0, otherWinner)).toBe(true)
    store.dispatch(updateRoundMatches(0, otherWinner))
    expect(store.getState().tournament.rounds[0].matches[0].sets).toEqual([{ a: '21', b: '5' }])
  })
})

describe('starting the first phase', () => {
  it('creates the bracket and advances winners through the store', () => {
    const store = createTournamentStore(makeSnapshot(4))
    store.dispatch(startFirstPhase())
    const rounds = (): Round[] => store.getState().tournament.rounds
    expect(rounds()).toHaveLength(2)
    expect(rounds()[1].matches[0].a).toMatch(/^__unknown__:/)
    const first = rounds()[0].matches[0]
    store.dispatch(
      updateRoundMatch(0, { ...first, sets: [{ a: '21', b: '3' }], scoreA: '21', scoreB: '3' }),
    )
    expect(rounds()[1].matches[0].a).toBe(first.a)
    store.dispatch(startFirstPhase())
    expect(rounds()).toHaveLength(2)
  })
})
