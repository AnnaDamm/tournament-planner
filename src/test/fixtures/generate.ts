import {
  assignCourtsToMatches,
  calculateExpectedMatchStarts,
  createRoundPlan,
  startReadyRounds,
  type Participant,
  type Round,
  type TournamentSnapshot,
} from '../legacyApi'
import { player } from '../fixtures'
import { withSeed } from '../seededRandom'
import { FIXED_START, playFirstMatches, simulate } from '../simulate'

/**
 * Builds the v1 snapshot fixtures (v1-*.json) deterministically from the test builders.
 *
 * The committed JSON files are frozen v1 exports and the source of truth for the
 * migration tests. NEVER regenerate them to make a failing test green: a failure means
 * the code changed behaviour or compatibility, not the fixtures. Regenerate only when a
 * fixture must change on purpose (new scenario), with
 *   REGENERATE_FIXTURES=1 pnpm exec vitest run src/test/fixtures
 * (inside the build-stage container, see AGENTS.md). generate.test.ts verifies only the
 * structure of the committed files, never that they equal this generator's output.
 */
const settings = {
  version: 1 as const,
  defaultSetPoints: 21,
  scheduledStart: '2026-01-01T10:00',
  breakBetweenMatchesMinutes: 5,
}

const schedule = (rounds: Round[], courtCount: number, duration: number, expectedMatches: number) =>
  calculateExpectedMatchStarts(
    rounds,
    courtCount,
    duration,
    settings.breakBetweenMatchesMinutes,
    FIXED_START,
    expectedMatches,
  )

const players = (names: string[], prefix: string): Participant[] =>
  names.map((name, index) => player(`${prefix}${index + 1}`, name))

const smallFinished = (): TournamentSnapshot => {
  const field = players(['Player A', 'Player B', 'Player C', 'Player D'], 'p')
  return {
    ...settings,
    expectedDurationMinutes: 25,
    tournamentName: 'Small Cup',
    participantType: 'players',
    courtCount: 1,
    defaultWinningGames: 2,
    players: field,
    rounds: simulate(field, 3, { seed: 1, winningGames: 2 }),
  }
}

const midUnknowns = (): TournamentSnapshot => {
  const field = players(
    [
      'Player A',
      'Player B',
      'Player C',
      'Player D',
      'Player E',
      'Player F',
      'Player G',
      'Player H',
    ],
    'p',
  )
  const [first] = simulate(field, 1, { seed: 2, playedRounds: 0, startRounds: false })
  const partial = playFirstMatches(first, 2)
  const plan = withSeed(2, () => createRoundPlan(field, [partial], 2))
  const second: Round = {
    number: 2,
    winningGames: 2,
    bye: plan.bye,
    matches: plan.matches,
    standings: plan.standings,
  }
  const started = startReadyRounds(
    [{ ...partial, standings: first.standings }, second],
    2,
    FIXED_START,
  )
  return {
    ...settings,
    expectedDurationMinutes: 25,
    tournamentName: 'Mid Cup',
    participantType: 'players',
    courtCount: 2,
    defaultWinningGames: 2,
    players: field,
    rounds: schedule(assignCourtsToMatches(started, 2, FIXED_START), 2, 25, 4),
  }
}

const teamsCourtsBye = (): TournamentSnapshot => {
  const field = players(
    [
      'Team Aces',
      'Team Bears',
      'Team Cobras',
      'Team Dragons',
      'Team Eagles',
      'Team Foxes',
      'Team Giants',
    ],
    't',
  )
  const planned = simulate(field, 3, {
    seed: 5,
    winningGames: 3,
    playedRounds: 2,
    startRounds: false,
  })
  // Rounds one and two are fully scored and were started; round three is running on three courts.
  const started = planned.map((item) =>
    item.number <= 2 ? { ...item, startedAt: FIXED_START } : item,
  )
  const running = assignCourtsToMatches(startReadyRounds(started, 3, FIXED_START), 3, FIXED_START)
  return {
    ...settings,
    expectedDurationMinutes: 30,
    tournamentName: 'Team Cup',
    participantType: 'teams',
    courtCount: 3,
    defaultWinningGames: 3,
    players: field,
    rounds: schedule(running, 3, 30, 3),
  }
}

export const buildFixtures = (): Record<string, TournamentSnapshot> => ({
  'v1-small-finished.json': smallFinished(),
  'v1-mid-unknowns.json': midUnknowns(),
  'v1-teams-courts-bye.json': teamsCourtsBye(),
})

export const serializeFixture = (snapshot: TournamentSnapshot) =>
  `${JSON.stringify(snapshot, null, 2)}\n`
