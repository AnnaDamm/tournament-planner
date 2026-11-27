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
  type Round,
} from '../../test/legacyApi'
import { makePlayers, match, player, round } from '../../test/fixtures'
import {
  projectCourts,
  projectPredictedStarts,
  projectRanking,
  projectRound,
  projectRounds,
  projectStartedAt,
} from '../../test/project'
import { withSeed } from '../../test/seededRandom'
import { FIXED_START, playRound, simulate } from '../../test/simulate'

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
    const partial: Round = {
      ...first,
      matches: first.matches.map((item, index) =>
        index < 2 ? playRound({ ...first, matches: [item] }).matches[0] : item,
      ),
    }
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
    const partial: Round = {
      ...first,
      matches: first.matches.map((item, index) =>
        index < 2 ? playRound({ ...first, matches: [item] }).matches[0] : item,
      ),
    }
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
    expect(rerolled[1]).toBe(rounds[1])
  })

  it('does not reroll a round with entered scores', () => {
    const players = makePlayers(8)
    const rounds = simulate(players, 2, { seed: 9 })
    expect(rerollRound(players, rounds, 2)).toBe(rounds)
    expect(rerollRound(players, rounds, 99)).toBe(rounds)
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
    expect(rerollBye(players, rounds, 2)).toBe(rounds)
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
  const scenario = (courts: number) => {
    const players = makePlayers(8)
    const rounds = simulate(players, 3, { seed: 31, playedRounds: 1, startRounds: false })
    return { rounds, courts }
  }

  it.each([1, 3])('startReadyRounds with %i courts', (courts) => {
    const { rounds } = scenario(courts)
    const started = startReadyRounds(rounds, courts, FIXED_START)
    expect(projectStartedAt(started)).toMatchSnapshot('started')
    expect(projectCourts(started)).toMatchSnapshot('courts')
    expect(getCurrentRoundNumber(started, courts)).toMatchSnapshot('current round')
  })

  it.each([1, 3])('assignCourtsToMatches with %i courts', (courts) => {
    const { rounds } = scenario(courts)
    const started = rounds.map((item) =>
      item.number === 1 ? { ...item, startedAt: FIXED_START } : item,
    )
    expect(projectCourts(assignCourtsToMatches(started, courts, FIXED_START))).toMatchSnapshot()
  })

  it('keeps already assigned courts stable', () => {
    const { rounds } = scenario(3)
    const first = startReadyRounds(rounds, 3, FIXED_START)
    expect(startReadyRounds(first, 3, '2026-01-01T12:00:00.000Z')).toBe(first)
  })

  it.each([1, 3])('calculateExpectedMatchStarts with %i courts', (courts) => {
    const { rounds } = scenario(courts)
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

  it('does not predict without a start time', () => {
    const { rounds } = scenario(1)
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
