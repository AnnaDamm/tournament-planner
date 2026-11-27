import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  calculateStandings,
  calculateStandingsBeforeRounds,
  compareRankingParticipants,
  createRoundPlan,
  fillUnknownRound,
  getCurrentRoundNumber,
  getMatchResult,
  getRankingParticipants,
  getVisibleSetCount,
  parseTournamentSnapshot,
  rerollBye,
  rerollRound,
  sortStats,
  startReadyRounds,
  type Participant,
  type RankingParticipant,
  type Round,
} from '../../test/legacyApi'
import { makePlayers, match, player, round } from '../../test/fixtures'
import {
  projectCourts,
  projectPredictedStarts,
  projectRanking,
  projectRoundStandings,
  projectRound,
  projectRounds,
  projectStartedAt,
} from '../../test/project'
import { withSeed } from '../../test/seededRandom'
import { FIXED_START, playFirstMatches, playRound, simulate } from '../../test/simulate'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T09:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

const withdrawn = (players: Participant[], id: string) =>
  players.map((item) => (item.id === id ? { ...item, withdrawn: true } : item))

const rankingOf = (players: Participant[], rounds: Round[], setPoints = 21) =>
  projectRanking(
    getRankingParticipants(players, rounds, setPoints).sort(compareRankingParticipants),
  )

describe('createRoundPlan', () => {
  it.each([4, 5, 8, 9])('plans five rounds for %i players', (count) => {
    const rounds = simulate(makePlayers(count), 5, { seed: 7 })
    expect(projectRounds(rounds)).toMatchSnapshot()
    expect(projectRoundStandings(rounds)).toMatchSnapshot('stored standings')
  })

  it.each([1, 3])('plans with winningGames %i', (winningGames) => {
    const rounds = simulate(makePlayers(8), 4, { seed: 3, winningGames })
    expect(projectRounds(rounds)).toMatchSnapshot()
  })

  it('plans without a withdrawn player', () => {
    const players = withdrawn(makePlayers(9), 'p4')
    const rounds = simulate(players, 4, { seed: 11 })
    expect(projectRounds(rounds)).toMatchSnapshot()
  })

  it('honours a preferred bye in round one', () => {
    const plan = withSeed(5, () => createRoundPlan(makePlayers(5), [], 1, 'p3'))
    expect(
      projectRound({ number: 1, winningGames: 2, bye: plan.bye, matches: plan.matches }),
    ).toMatchSnapshot()
  })

  it('keeps unknown placeholders while the previous round is unfinished', () => {
    const players = makePlayers(8)
    const [first] = simulate(players, 1, { seed: 2, playedRounds: 0 })
    const partial = playFirstMatches(first, 2)
    const plan = withSeed(2, () => createRoundPlan(players, [partial], 2))
    expect(
      projectRound({ number: 2, winningGames: 2, bye: plan.bye, matches: plan.matches }),
    ).toMatchSnapshot()
  })
})

describe('fillUnknownRound', () => {
  it.each([8, 9])('resolves placeholders once round one is finished (%i players)', (count) => {
    const players = makePlayers(count)
    const [first] = simulate(players, 1, { seed: 4, playedRounds: 0 })
    const partial = playFirstMatches(first, 2)
    const early = withSeed(4, () => createRoundPlan(players, [partial], 2))
    const earlyRound: Round = {
      number: 2,
      winningGames: 2,
      bye: early.bye,
      matches: early.matches,
    }
    const finished = playRound(first)
    const filled = withSeed(4, () => fillUnknownRound(earlyRound, players, [finished]))
    expect(projectRound(earlyRound)).toMatchSnapshot('before')
    expect(projectRound(filled)).toMatchSnapshot('after')
  })
})

describe('rerollRound and rerollBye', () => {
  it.each([8, 9])('rerolls the last unscored round (%i players)', (count) => {
    const players = makePlayers(count)
    const rounds = simulate(players, 3, { seed: 9, playedRounds: 2 })
    const rerolled = withSeed(21, () => rerollRound(players, rounds, 3))
    expect(projectRound(rerolled[2])).toMatchSnapshot()
    // Pairing after round one is deterministic (the bye is kept), so a reroll shows up in the
    // freshly generated match ids; the previous matches must not be reused.
    expect(rerolled[2]).not.toBe(rounds[2])
    expect(rerolled[2].matches.map((item) => item.id)).not.toEqual(
      rounds[2].matches.map((item) => item.id),
    )
    expect(projectRound(rerolled[1])).toEqual(projectRound(rounds[1]))
    expect(projectRound(rerolled[0])).toEqual(projectRound(rounds[0]))
  })

  it('does not reroll a round with entered scores', () => {
    const players = makePlayers(8)
    const rounds = simulate(players, 2, { seed: 9 })
    expect(projectRounds(rerollRound(players, rounds, 2))).toEqual(projectRounds(rounds))
    expect(projectRounds(rerollRound(players, rounds, 99))).toEqual(projectRounds(rounds))
  })

  it('rerolls the bye of an odd field', () => {
    const players = makePlayers(5)
    const rounds = simulate(players, 3, { seed: 13, playedRounds: 2 })
    const rerolled = withSeed(5, () => rerollBye(players, rounds, 3))
    expect(projectRound(rounds[2])).toMatchSnapshot('before')
    expect(projectRound(rerolled[2])).toMatchSnapshot('after')
  })

  it('does not reroll the bye for an even field', () => {
    const players = makePlayers(4)
    const rounds = simulate(players, 2, { seed: 13, playedRounds: 1 })
    expect(projectRounds(rerollBye(players, rounds, 2))).toEqual(projectRounds(rounds))
  })
})

describe('standings and ranking', () => {
  const cases: Array<[string, Participant[], number, number, number]> = [
    ['4 players, bo3', makePlayers(4), 4, 2, 21],
    ['5 players with byes, bo5', makePlayers(5), 5, 3, 21],
    ['9 players, single game, 15 points', makePlayers(9), 3, 1, 15],
    ['8 players with a withdrawn player', withdrawn(makePlayers(8), 'p2'), 3, 2, 21],
  ]

  it.each(cases)('%s', (_name, players, roundCount, winningGames, setPoints) => {
    const rounds = simulate(players, roundCount, { seed: 17, winningGames, setPoints })
    expect(projectRanking(calculateStandings(players, rounds, setPoints))).toMatchSnapshot(
      'standings',
    )
    expect(
      calculateStandingsBeforeRounds(players, rounds, setPoints).map(projectRanking),
    ).toMatchSnapshot('before rounds')
    expect(rankingOf(players, rounds, setPoints)).toMatchSnapshot('ranking')
  })

  it('credits a bye only once the next round has started', () => {
    const players = makePlayers(5)
    const started = simulate(players, 2, { seed: 17, playedRounds: 1 })
    const unstarted = started.map((item) => ({ ...item, startedAt: undefined }))
    expect(projectRanking(calculateStandings(players, started))).toMatchSnapshot('started')
    expect(projectRanking(calculateStandings(players, unstarted))).toMatchSnapshot('unstarted')
  })

  it('breaks ties by last loss, sets, points and name', () => {
    const players = [player('a', 'Ann'), player('b', 'Bob'), player('c', 'Cy'), player('d', 'Di')]
    const rounds = [
      round(1, [
        match('m1', 'a', 'b', [
          [21, 10],
          [21, 12],
        ]),
        match('m2', 'c', 'd', [
          [21, 19],
          [19, 21],
          [21, 5],
        ]),
      ]),
      round(2, [
        match('m3', 'a', 'c', [
          [10, 21],
          [10, 21],
        ]),
        match('m4', 'b', 'd', [
          [21, 0],
          [21, 0],
        ]),
      ]),
    ]
    expect(rankingOf(players, rounds)).toMatchSnapshot()
  })

  it('sorts statistics by every key in both directions', () => {
    const players = makePlayers(6)
    const rounds = simulate(players, 3, { seed: 23 })
    const stats = getRankingParticipants(players, rounds).map((item) => ({
      ...item,
      played: item.wins + item.losses,
      diff: item.scored - item.conceded,
      points: item.wins * 3,
    }))
    const keys = [
      'position',
      'name',
      'wins',
      'losses',
      'setsWon',
      'setsLost',
      'scored',
      'conceded',
      'played',
      'diff',
      'points',
    ]
    const result = Object.fromEntries(
      keys.flatMap((key) =>
        [true, false].map((desc) => [
          `${key}:${desc ? 'desc' : 'asc'}`,
          sortStats(stats, key, desc).map((item) => item.id),
        ]),
      ),
    )
    expect(result).toMatchSnapshot()
  })
  it('credits a fractional default set point count to the bye with Math.floor', () => {
    const players = makePlayers(5)
    const rounds = simulate(players, 3, { seed: 17, playedRounds: 2, setPoints: 15 })
    expect(projectRanking(calculateStandings(players, rounds, 15.9))).toMatchSnapshot('standings')
    expect(
      calculateStandingsBeforeRounds(players, rounds, 15.9).map(projectRanking),
    ).toMatchSnapshot('before rounds')
    expect(rankingOf(players, rounds, 15.9)).toMatchSnapshot('ranking')
  })

  it('simulates rounds with different winningGames', () => {
    const players = makePlayers(6)
    const rounds = simulate(players, 3, { seed: 19, winningGamesByRound: [1, 3, 2] })
    expect(rounds.map((item) => item.winningGames)).toEqual([1, 3, 2])
    expect(projectRounds(rounds)).toMatchSnapshot('rounds')
    expect(projectRanking(calculateStandings(players, rounds))).toMatchSnapshot('standings')
    expect(rankingOf(players, rounds)).toMatchSnapshot('ranking')
    expect(projectRoundStandings(rounds)).toMatchSnapshot('stored standings')
  })

  describe('tie-breakers after the last loss', () => {
    const base = {
      wins: 2,
      losses: 1,
      setsWon: 4,
      setsLost: 2,
      scored: 80,
      conceded: 50,
      lastLossRound: 1,
    }
    const rp = (id: string, name: string, extra: Partial<RankingParticipant> = {}) =>
      ({ ...player(id, name), ...base, ...extra }) as RankingParticipant

    // Each pair differs in exactly one field; "better" must always sort first.
    const cases: Array<[string, Partial<RankingParticipant>, Partial<RankingParticipant>]> = [
      ['wins', { wins: 3 }, {}],
      ['lastLossRound: none beats a loss', { lastLossRound: 0 }, {}],
      ['lastLossRound: later loss beats earlier', { lastLossRound: 3 }, { lastLossRound: 2 }],
      ['setsWon', { setsWon: 5 }, {}],
      ['setsLost', { setsLost: 1 }, {}],
      ['scored', { scored: 81 }, {}],
      ['conceded', { conceded: 49 }, {}],
    ]

    it.each(cases)('%s', (_name, better, worse) => {
      // Names are reversed so a name fallback would produce the opposite order.
      const winner = rp('good', 'Zed', better)
      const loser = rp('bad', 'Abe', worse)
      expect({
        goodVsBad: Math.sign(compareRankingParticipants(winner, loser)),
        badVsGood: Math.sign(compareRankingParticipants(loser, winner)),
        sorted: [loser, winner].sort(compareRankingParticipants).map((item) => item.id),
      }).toMatchSnapshot()
    })

    it('falls back to the name on a full tie', () => {
      const first = rp('x', 'Abe')
      const second = rp('y', 'Zed')
      expect({
        firstVsSecond: Math.sign(compareRankingParticipants(first, second)),
        secondVsFirst: Math.sign(compareRankingParticipants(second, first)),
        sorted: [second, first].sort(compareRankingParticipants).map((item) => item.id),
        identical: compareRankingParticipants(first, { ...first }),
      }).toMatchSnapshot()
    })
  })
})

describe('match results', () => {
  const scores = {
    empty: [] as Array<[string, string]>,
    incomplete: [['21', '']] as Array<[string, string]>,
    equalSet: [['21', '21']] as Array<[string, string]>,
    negative: [['-1', '21']] as Array<[string, string]>,
    oneSet: [['21', '10']] as Array<[string, string]>,
    twoSets: [
      ['21', '10'],
      ['21', '12'],
    ] as Array<[string, string]>,
    threeSets: [
      ['21', '10'],
      ['15', '21'],
      ['11', '21'],
    ] as Array<[string, string]>,
    extraSets: [
      ['21', '10'],
      ['21', '10'],
      ['5', '21'],
    ] as Array<[string, string]>,
    unfinishedBo3: [
      ['21', '10'],
      ['10', '21'],
    ] as Array<[string, string]>,
  }

  it.each([1, 2, 3])('getMatchResult with winningGames %i', (winningGames) => {
    const result = Object.fromEntries(
      Object.entries(scores).map(([name, sets]) => [
        name,
        getMatchResult(match('m', 'a', 'b', sets), winningGames),
      ]),
    )
    expect(result).toMatchSnapshot()
  })

  it('reads the legacy single score fields', () => {
    const legacy = { ...match('m', 'a', 'b'), scoreA: '21', scoreB: '15' }
    expect(getMatchResult(legacy, 1)).toMatchSnapshot()
  })

  it.each([1, 2, 3])('getVisibleSetCount with winningGames %i', (winningGames) => {
    const result = Object.fromEntries(
      Object.entries(scores).map(([name, sets]) => [
        name,
        getVisibleSetCount(match('m', 'a', 'b', sets), winningGames),
      ]),
    )
    expect(result).toMatchSnapshot()
  })
})

describe('courts and schedule', () => {
  const scenario = () =>
    simulate(makePlayers(8), 3, { seed: 31, playedRounds: 1, startRounds: false })

  it.each([1, 3])('startReadyRounds with %i courts', (courts) => {
    const rounds = scenario()
    const started = startReadyRounds(rounds, courts, FIXED_START)
    expect(projectStartedAt(started)).toMatchSnapshot('started')
    expect(projectCourts(started)).toMatchSnapshot('courts')
    expect(getCurrentRoundNumber(started, courts)).toMatchSnapshot('current round')
  })

  it.each([1, 3])('assignCourtsToMatches with %i courts', (courts) => {
    const rounds = scenario()
    const started = rounds.map((item) =>
      item.number === 1 ? { ...item, startedAt: FIXED_START } : item,
    )
    expect(projectCourts(assignCourtsToMatches(started, courts, FIXED_START))).toMatchSnapshot()
  })

  it('keeps already assigned courts stable', () => {
    const rounds = scenario()
    const first = startReadyRounds(rounds, 3, FIXED_START)
    const again = startReadyRounds(first, 3, '2026-01-01T12:00:00.000Z')
    expect(projectStartedAt(again)).toEqual(projectStartedAt(first))
    expect(projectCourts(again)).toEqual(projectCourts(first))
  })

  it.each([1, 3])('calculateExpectedMatchStarts with %i courts', (courts) => {
    const rounds = scenario()
    const scheduled = calculateExpectedMatchStarts(
      rounds,
      courts,
      25,
      5,
      '2026-01-01T10:00:00.000Z',
      4,
    )
    expect(projectPredictedStarts(scheduled)).toMatchSnapshot()
    expect(scheduled.map((item) => item.predictedStart ?? null)).toMatchSnapshot('rounds')
  })

  describe('partially scored matches get courts first', () => {
    // Round one is started with one set entered in its last match; the other matches are unscored.
    const partial = () => {
      const players = makePlayers(8)
      const [first, second] = simulate(players, 2, {
        seed: 31,
        playedRounds: 0,
        startRounds: false,
      })
      const last = first.matches.length - 1
      const withSet: Round = {
        ...first,
        startedAt: FIXED_START,
        matches: first.matches.map((item, index) =>
          index === last ? { ...item, sets: [{ a: '21', b: '15' }] } : item,
        ),
      }
      return [withSet, second]
    }

    it.each([1, 3])('assignCourtsToMatches with %i courts', (courts) => {
      expect(projectCourts(assignCourtsToMatches(partial(), courts, FIXED_START))).toMatchSnapshot()
    })

    it.each([1, 3])('startReadyRounds with %i courts', (courts) => {
      const started = startReadyRounds(partial(), courts, FIXED_START)
      expect(projectStartedAt(started)).toMatchSnapshot('started')
      expect(projectCourts(started)).toMatchSnapshot('courts')
    })
  })

  it('does not predict without a start time', () => {
    const rounds = scenario()
    expect(
      projectPredictedStarts(calculateExpectedMatchStarts(rounds, 1, 25, 5, '')),
    ).toMatchSnapshot()
  })

  it('getCurrentRoundNumber for empty, running and finished tournaments', () => {
    const players = makePlayers(4)
    const finished = simulate(players, 2, { seed: 1 })
    const half = simulate(players, 2, { seed: 1, playedRounds: 1 })
    expect({
      empty: getCurrentRoundNumber([]),
      finished: getCurrentRoundNumber(finished),
      half: getCurrentRoundNumber(half),
    }).toMatchSnapshot()
  })
})

describe('parseTournamentSnapshot', () => {
  const valid = {
    version: 1,
    tournamentName: '  Cup  ',
    participantType: 'players',
    courtCount: 2.7,
    defaultWinningGames: 150,
    players: [player('p1', 'Ann')],
    rounds: [round(1, [match('m1', 'p1', 'p2')])],
  }

  it('parses a valid snapshot and applies defaults', () => {
    expect(parseTournamentSnapshot(valid)).toMatchSnapshot()
  })

  it('keeps explicit optional values', () => {
    expect(
      parseTournamentSnapshot({
        ...valid,
        defaultSetPoints: 15.9,
        expectedDurationMinutes: 30.5,
        breakBetweenMatchesMinutes: 0,
        scheduledStart: '2026-01-01T10:00',
      }),
    ).toMatchSnapshot()
  })

  it.each([
    ['not an object', 'nope'],
    ['null', null],
    ['future version', { ...valid, version: 2 }],
    ['missing players', { ...valid, players: undefined }],
    ['invalid player', { ...valid, players: [{ id: 'p1' }] }],
    ['invalid round', { ...valid, rounds: [{ number: 1 }] }],
    [
      'invalid match court',
      { ...valid, rounds: [round(1, [match('m', 'a', 'b', [], { court: 0 })])] },
    ],
    ['unknown participant type', { ...valid, participantType: 'groups' }],
    ['missing court count', { ...valid, courtCount: undefined }],
    ['invalid set points', { ...valid, defaultSetPoints: 'x' }],
    ['blank name', { ...valid, tournamentName: '   ' }],
  ])('rejects %s', (_name, value) => {
    expect(parseTournamentSnapshot(value)).toBeNull()
  })
})
