import { isUnknownParticipantId, unknownParticipantId } from '../../ids'
import type { MessageKey } from '../../../i18n'
import type { Match, MatchFormat, MatchSource, ParticipantId, Round } from '../../types'
import { getStandardSeedOrder, nextPowerOfTwo } from './seeding'

export type BracketOptions = {
  /** The participants in seed order (index 0 = seed 1). */
  ids: ParticipantId[]
  phaseId: string
  firstRoundNumber: number
  thirdPlaceMatch: boolean
  /** The format of a round counted from the end (0 = final, 1 = semifinals ...). */
  formatFor: (roundFromEnd: number) => MatchFormat
}

const titleKeys: MessageKey[] = [
  'eliminationFinal',
  'eliminationSemifinal',
  'eliminationQuarterfinal',
]

/** The name of a knockout round, counted from the end (0 = final). */
export const getRoundTitle = (roundFromEnd: number): Round['title'] =>
  roundFromEnd < titleKeys.length
    ? { key: titleKeys[roundFromEnd] }
    : { key: 'eliminationRoundOf', params: { size: 2 ** (roundFromEnd + 1) } }

/** The places the loser of a round shares: 2 for the final, 3-4 for the semifinals, 5-8 ... */
export const getLoserPlaces = (roundFromEnd: number, count: number): [number, number] => [
  2 ** roundFromEnd + 1,
  Math.min(2 ** (roundFromEnd + 1), count),
]

const createMatch = (
  id: string,
  label: string,
  roundNumber: number,
  index: number,
  ids: ParticipantId[],
  sources: [MatchSource, MatchSource],
  extra: Partial<Match> = {},
): Match => {
  const side = (source: MatchSource, offset: number) =>
    source.kind === 'seed'
      ? ids[source.seed - 1]
      : unknownParticipantId(roundNumber, index * 2 + offset)
  return {
    id,
    a: side(sources[0], 0),
    b: side(sources[1], 1),
    scoreA: '',
    scoreB: '',
    label,
    bracket: 'winners',
    sourceA: sources[0],
    sourceB: sources[1],
    ...extra,
  }
}

/**
 * All rounds of a single elimination bracket. Seeds without an opponent (when the field is not a
 * power of two) skip the first round: they are entered in the second round directly. Sides that
 * wait for the result of an earlier match carry a placeholder id and a source.
 */
export const buildSingleEliminationRounds = ({
  ids,
  phaseId,
  firstRoundNumber,
  thirdPlaceMatch,
  formatFor,
}: BracketOptions): Round[] => {
  if (ids.length < 2) return []
  const size = nextPowerOfTwo(ids.length)
  const roundCount = Math.log2(size)
  const rounds: Round[] = []
  let entries: (MatchSource | null)[] = getStandardSeedOrder(size).map((seed) =>
    seed <= ids.length ? { kind: 'seed', seed } : null,
  )
  let matchNumber = 0
  const newMatch = (
    roundNumber: number,
    index: number,
    sources: [MatchSource, MatchSource],
    extra?: Partial<Match>,
  ) => {
    matchNumber += 1
    return createMatch(
      `${phaseId}-m${matchNumber}`,
      `M${matchNumber}`,
      roundNumber,
      index,
      ids,
      sources,
      extra,
    )
  }

  for (let index = 0; index < roundCount; index += 1) {
    const fromEnd = roundCount - 1 - index
    const isFinal = fromEnd === 0
    const semifinals = isFinal ? (rounds.at(-1)?.matches ?? []) : []
    if (isFinal && thirdPlaceMatch && semifinals.length === 2) {
      const number = firstRoundNumber + rounds.length
      const sources = semifinals.map((match): MatchSource => ({ kind: 'loser', matchId: match.id }))
      const match = newMatch(number, 0, [sources[0], sources[1]], {
        bracket: 'thirdPlace',
        places: [3, 4],
      })
      rounds.push({
        number,
        phaseId,
        title: { key: 'eliminationThirdPlace' },
        format: formatFor(1),
        matches: [match],
      })
    }
    const number = firstRoundNumber + rounds.length
    const matches: Match[] = []
    const next: (MatchSource | null)[] = []
    for (let slot = 0; slot < entries.length; slot += 2) {
      const [first, second] = [entries[slot], entries[slot + 1]]
      if (!first || !second) {
        next.push(first ?? second)
        continue
      }
      const match = newMatch(
        number,
        matches.length,
        [first, second],
        isFinal ? { bracket: 'final', places: [1, 2] } : {},
      )
      matches.push(match)
      next.push({ kind: 'winner', matchId: match.id })
    }
    rounds.push({
      number,
      phaseId,
      title: getRoundTitle(fromEnd),
      format: formatFor(fromEnd),
      matches,
    })
    entries = next
  }
  return rounds
}

/** The id of the participants that skip the first round (they enter the bracket later). */
export const getByeParticipantIds = (rounds: Round[]): ParticipantId[] =>
  rounds
    .slice(1, 2)
    .flatMap((round) =>
      round.matches.flatMap((match) => [
        ...(match.sourceA?.kind === 'seed' && !isUnknownParticipantId(match.a) ? [match.a] : []),
        ...(match.sourceB?.kind === 'seed' && !isUnknownParticipantId(match.b) ? [match.b] : []),
      ]),
    )
