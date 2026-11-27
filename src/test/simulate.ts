import { createRoundPlan, type Match, type Participant, type Round } from './legacyApi'
import { withSeed } from './seededRandom'

export const FIXED_START = '2026-01-01T10:00:00.000Z'

export type SimulationOptions = {
  seed?: number
  winningGames?: number
  /** Overrides winningGames per round (index 0 = round one). */
  winningGamesByRound?: number[]
  setPoints?: number
  /** Number of rounds that receive scores; later rounds stay planned but unplayed. */
  playedRounds?: number
  startRounds?: boolean
}

/** Deterministic scores: side a usually wins; every third match goes to side b. */
export const scoreMatch = (
  item: Match,
  roundNumber: number,
  index: number,
  winningGames: number,
) => {
  const aWins = (roundNumber + index) % 3 !== 0
  const loserSets = (roundNumber + index) % winningGames
  const sets: Array<{ a: string; b: string }> = []
  const add = (winnerPoints: number, loserPoints: number, winnerIsA: boolean) =>
    sets.push({
      a: String(winnerIsA ? winnerPoints : loserPoints),
      b: String(winnerIsA ? loserPoints : winnerPoints),
    })
  for (let i = 0; i < loserSets; i += 1) add(21, 19, !aWins)
  for (let i = 0; i < winningGames; i += 1) add(21, 8 + ((index + i) % 9), aWins)
  return { ...item, sets }
}

export const playRound = (round: Round) => ({
  ...round,
  matches: round.matches.map((item, index) =>
    scoreMatch(item, round.number, index, Math.max(1, round.winningGames)),
  ),
})

/** Scores the first `count` matches of a round and leaves the others unplayed. */
export const playFirstMatches = (round: Round, count: number): Round => ({
  ...round,
  matches: round.matches.map((item, index) =>
    index < count ? playRound({ ...round, matches: [item] }).matches[0] : item,
  ),
})

/** Plans (and scores) rounds with a seeded random source so the result is reproducible. */
export const simulate = (
  players: Participant[],
  roundCount: number,
  options: SimulationOptions = {},
) => {
  const { seed = 1, winningGames = 2, setPoints = 21, startRounds = true } = options
  const playedRounds = options.playedRounds ?? roundCount
  const gamesOf = (number: number) => options.winningGamesByRound?.[number - 1] ?? winningGames
  return withSeed(seed, () => {
    const rounds: Round[] = []
    for (let number = 1; number <= roundCount; number += 1) {
      const plan = createRoundPlan(players, rounds, number, undefined, setPoints)
      const planned: Round = {
        number,
        winningGames: gamesOf(number),
        bye: plan.bye,
        matches: plan.matches,
        standings: plan.standings,
        ...(startRounds ? { startedAt: FIXED_START } : {}),
      }
      rounds.push(number <= playedRounds ? playRound(planned) : planned)
    }
    return rounds
  })
}
