import { clampFormat } from '../../format'
import type { MatchFormat, Participant, ParticipantId, Round } from '../../types'
import type { PhaseContext, PhaseMode, Placement } from '../types'
import { getDecision, hasResolveConflict, resolveBracketRounds } from './advance'
import { buildSingleEliminationRounds, getLoserPlaces } from './bracket'
import { defaultEliminationConfig, parseEliminationConfig, type EliminationConfig } from './config'
import { seedEntrants } from './seeding'

type Elimination = PhaseContext<EliminationConfig>

/** Knockout matches always need a winner: a fixed number of games would allow draws. */
const withoutFixedGames = (format: Partial<MatchFormat> | undefined): Partial<MatchFormat> => {
  const { fixedGames: _fixedGames, ...rest } = format ?? {}
  return rest
}

/** The format of a round counted from the end: the phase format with the configured override. */
const getFormatFor = (p: Elimination) => {
  const base = clampFormat(withoutFixedGames(p.phase.format ?? p.ctx.scoring.format))
  return (roundFromEnd: number) =>
    clampFormat(
      withoutFixedGames({ ...base, ...p.phase.config.formatByRoundFromEnd[roundFromEnd] }),
      base,
    )
}

const isThirdPlaceRound = (round: Round) =>
  round.matches.some((match) => match.bracket === 'thirdPlace')

/** The seeds of the participants of a started bracket, in seed order. */
const getSeededIds = (rounds: Round[]): ParticipantId[] => {
  const seeds = new Map<number, ParticipantId>()
  rounds.forEach((round) =>
    round.matches.forEach((match) => {
      if (match.sourceA?.kind === 'seed') seeds.set(match.sourceA.seed, match.a)
      if (match.sourceB?.kind === 'seed') seeds.set(match.sourceB.seed, match.b)
    }),
  )
  return [...seeds.entries()].sort(([first], [second]) => first - second).map(([, id]) => id)
}

const sortPlacements = (placements: Placement[], seeded: ParticipantId[]) =>
  placements.sort(
    (first, second) =>
      first.place - second.place ||
      seeded.indexOf(first.participantId) - seeded.indexOf(second.participantId),
  )

const getPlacements = (p: Elimination): Placement[] => {
  const seeded = getSeededIds(p.rounds)
  const count = seeded.length
  const places = new Map<ParticipantId, { place: number; placeTo?: number }>()
  const bracketRounds = p.rounds.filter((round) => !isThirdPlaceRound(round))
  p.rounds.forEach((round) => {
    const fromEnd = bracketRounds.length - 1 - bracketRounds.indexOf(round)
    round.matches.forEach((match) => {
      const decision = getDecision(p.ctx.rules, round, match)
      if (!decision) return
      if (match.bracket === 'final' || match.bracket === 'thirdPlace') {
        const first = match.places?.[0] ?? 1
        places.set(decision.winner, { place: first })
        places.set(decision.loser, { place: first + 1 })
        return
      }
      const [from, to] = getLoserPlaces(fromEnd, count)
      places.set(decision.loser, { place: from, ...(to > from ? { placeTo: to } : {}) })
    })
  })
  // Who is still playing shares the places above the eliminated participants.
  const alive = seeded.filter((id) => !places.has(id))
  const waiting = alive.map((participantId) => ({
    participantId,
    place: 1,
    ...(alive.length > 1 ? { placeTo: alive.length } : {}),
  }))
  const decided = [...places.entries()].map(([participantId, place]) => ({
    participantId,
    ...place,
  }))
  return sortPlacements([...waiting, ...decided], seeded)
}

export const singleEliminationMode: PhaseMode<EliminationConfig> = {
  id: 'singleElimination',
  labelKey: 'eliminationSingleMode',
  capabilities: {
    manualRounds: false,
    reroll: false,
    rerollBye: false,
    swapParticipants: false,
    fillUnknown: false,
  },
  defaultConfig: defaultEliminationConfig,
  parseConfig: parseEliminationConfig,
  initPhase: (p, firstRoundNumber) => {
    const ids = seedEntrants(p.entrants, p.phase.config.seeding).map(
      (participant: Participant) => participant.id,
    )
    return buildSingleEliminationRounds({
      ids,
      phaseId: p.phase.id,
      firstRoundNumber,
      thirdPlaceMatch: p.phase.config.thirdPlaceMatch,
      formatFor: getFormatFor(p),
    })
  },
  // The bracket is built completely when the phase starts: planning a round keeps its matches.
  planRound: (_p, round) => ({ bye: null, matches: round.matches }),
  resolveRounds: (p) => resolveBracketRounds(p.ctx.rules, p.rounds),
  hasResolveConflict: (p) => hasResolveConflict(p.ctx.rules, p.rounds),
  isComplete: (p) =>
    p.rounds.length > 0 &&
    p.rounds.every((round) =>
      round.matches.every((match) => getDecision(p.ctx.rules, round, match) !== null),
    ),
  getPlacements,
}
