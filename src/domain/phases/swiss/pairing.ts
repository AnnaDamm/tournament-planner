import type { EvaluationContext } from '../../evaluation'
import { getMatchFormat } from '../../format'
import { isUnknownParticipantId, unknownParticipantId } from '../../ids'
import { getMatchParticipantIds, getMatchSideIds, hasValidBye } from '../../participants'
import { compareRankingParticipants, getRankingParticipants } from '../../ranking/rank'
import { hasEnteredScore } from '../../scoring/games'
import { calculateStandings } from '../../standings/standings'
import type { Match, Participant, Round } from '../../types'

const randomItem = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

const selectBye = (candidateIds: string[], previousRounds: Round[]) => {
  const previousByeIds = new Set(previousRounds.filter(hasValidBye).map((round) => round.bye!))
  if (previousByeIds.size === 0) return randomItem(candidateIds)

  return [...candidateIds].reverse().find((id) => !previousByeIds.has(id)) ?? candidateIds.at(-1)!
}

const hasPlayed = (firstId: string, secondId: string, rounds: Round[]) =>
  rounds.some((round) =>
    round.matches.some((match) => {
      const sideA = getMatchSideIds(match, 'a')
      const sideB = getMatchSideIds(match, 'b')
      return (
        (sideA.includes(firstId) && sideB.includes(secondId)) ||
        (sideA.includes(secondId) && sideB.includes(firstId))
      )
    }),
  )

export const sortMatchesByParticipantOrder = (matches: Match[], participantOrder: string[]) => {
  const orderByParticipant = new Map(participantOrder.map((id, index) => [id, index]))
  const getOrder = (id: string) => orderByParticipant.get(id) ?? Number.MAX_SAFE_INTEGER
  const getMatchOrder = (match: Match) =>
    [getOrder(match.a), getOrder(match.b)].sort((first, second) => first - second)

  return [...matches].sort((first, second) => {
    const firstOrder = getMatchOrder(first)
    const secondOrder = getMatchOrder(second)
    return (
      firstOrder[0] - secondOrder[0] ||
      firstOrder[1] - secondOrder[1] ||
      first.id.localeCompare(second.id)
    )
  })
}

export const finalizedParticipantIds = (
  players: Participant[],
  rounds: Round[],
  ctx: EvaluationContext,
) => {
  if (rounds.length === 0) return new Set(players.map((player) => player.id))
  const lastRound = rounds.at(-1)!
  const finalized = new Set<string>()

  if (hasValidBye(lastRound)) finalized.add(lastRound.bye!)
  lastRound.matches.forEach((match) => {
    if (!ctx.rules.getResult(match, getMatchFormat(lastRound, match))) return
    getMatchParticipantIds(match).forEach((id) => {
      if (!isUnknownParticipantId(id)) finalized.add(id)
    })
  })
  return finalized
}

const shuffled = <T>(items: T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

const pairGroup = (group: string[], rounds: Round[]): Array<[string, string]> => {
  const findWithoutRematches = (remaining: string[]): Array<[string, string]> | null => {
    if (remaining.length === 0) return []
    const first = remaining[0]
    for (const second of shuffled(remaining.slice(1))) {
      if (hasPlayed(first, second, rounds)) continue
      const next = remaining.filter((id) => id !== first && id !== second)
      const result = findWithoutRematches(next)
      if (result) return [[first, second], ...result]
    }
    return null
  }

  const noRematches = findWithoutRematches(shuffled(group))
  if (noRematches) return noRematches
  const fallback = shuffled(group)
  return Array.from({ length: fallback.length / 2 }, (_, index) => [
    fallback[index * 2],
    fallback[index * 2 + 1],
  ])
}

const pairByRanking = (participantIds: string[], previousRounds: Round[]) => {
  const fixedPairs: Array<[string, string]> = []
  const fixedParticipantIds = new Set<string>()

  const getUnfixedParticipantIds = () =>
    participantIds.filter((participantId) => !fixedParticipantIds.has(participantId))

  const findBottomFix = (unfixedParticipantIds: string[]): [string, string] | null => {
    const bottomIndex = unfixedParticipantIds.length - 1
    const bottomId = unfixedParticipantIds[bottomIndex]
    if (!bottomId) return null

    for (let index = bottomIndex - 1; index >= 0; index -= 1) {
      const opponentId = unfixedParticipantIds[index]
      if (!hasPlayed(bottomId, opponentId, previousRounds)) return [opponentId, bottomId]
    }
    return null
  }

  while (true) {
    const unfixedParticipantIds = getUnfixedParticipantIds()
    const remaining = [...unfixedParticipantIds]
    const pairs: Array<[string, string]> = [...fixedPairs]
    let fixedThisIteration = false

    while (remaining.length >= 2) {
      const first = remaining.shift()!
      const opponentIndex = remaining.findIndex(
        (candidate) => !hasPlayed(first, candidate, previousRounds),
      )
      if (opponentIndex < 0) {
        const bottomFix = findBottomFix(unfixedParticipantIds)
        if (!bottomFix) return [...fixedPairs, ...pairGroup(unfixedParticipantIds, previousRounds)]
        fixedPairs.push(bottomFix)
        fixedParticipantIds.add(bottomFix[0])
        fixedParticipantIds.add(bottomFix[1])
        fixedThisIteration = true
        break
      }

      const [second] = remaining.splice(opponentIndex, 1)
      pairs.push([first, second])
    }

    if (!fixedThisIteration) return pairs
  }
}

export type PlannedRound = { roundNumber: number; isFirstRound: boolean }

/** Variant hooks of the standard planner; without them the planner behaves as before. */
export type PairingHooks = {
  /** Virtual match wins used for the pairing only (never for the ranking). */
  virtualWins?: Map<string, number>
}

/** Pairs a list slide-wise: the first half against the second half. */
const slidePairs = (ids: string[]): Array<[string, string]> => {
  const half = ids.length / 2
  return Array.from({ length: half }, (_, index) => [ids[index], ids[index + half]])
}

export const createRoundPlan = (
  players: Participant[],
  previousRounds: Round[],
  { roundNumber, isFirstRound }: PlannedRound,
  preferredBye: string | undefined,
  ctx: EvaluationContext,
  hooks: PairingHooks = {},
) => {
  const virtualWins = hooks.virtualWins?.size ? hooks.virtualWins : undefined
  const virtualOf = (id: string) => virtualWins?.get(id) ?? 0
  const activePlayers = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(activePlayers, previousRounds, ctx)
  const ranking = getRankingParticipants(activePlayers, previousRounds, ctx)
  if (!isFirstRound) {
    ranking.sort(compareRankingParticipants)
    // Stable: equal effective match points keep the tie-breaker order from above.
    if (virtualWins) {
      const effective = (id: string, matchPoints: number) =>
        matchPoints + virtualOf(id) * ctx.scoring.matchPoints.win
      ranking.sort(
        (first, second) =>
          effective(second.id, second.matchPoints) - effective(first.id, first.matchPoints),
      )
    }
  }
  const participantOrder = ranking.map((player) => player.id)
  const standingsById = new Map(ranking.map((standing) => [standing.id, standing]))
  const createMatches = (pairs: Array<[string, string]>) =>
    sortMatchesByParticipantOrder(
      pairs.map(([a, b], index) => ({
        id: `${roundNumber}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        a,
        b,
        scoreA: '',
        scoreB: '',
      })),
      participantOrder,
    )
  const finalizedIds = finalizedParticipantIds(activePlayers, previousRounds, ctx)
  let knownPlayers = ranking.filter((player) => finalizedIds.has(player.id))
  let bye: string | null = null
  if (knownPlayers.length === activePlayers.length && activePlayers.length % 2 === 1) {
    const knownPlayerIds = knownPlayers.map((player) => player.id)
    bye =
      preferredBye && knownPlayerIds.includes(preferredBye)
        ? preferredBye
        : selectBye(knownPlayerIds, previousRounds)
    knownPlayers = knownPlayers.filter((player) => player.id !== bye)
  }

  if (!isFirstRound) {
    const unknownIds = Array.from(
      { length: activePlayers.length - knownPlayers.length },
      (_, index) => unknownParticipantId(roundNumber, index),
    )
    const pairingIds = [...knownPlayers.map((player) => player.id), ...unknownIds]
    if (pairingIds.length % 2 === 1) {
      const pendingByeIndex = pairingIds.findIndex(isUnknownParticipantId)
      pairingIds.splice(pendingByeIndex >= 0 ? pendingByeIndex : pairingIds.length - 1, 1)
    }
    return {
      standings,
      bye,
      matches: createMatches(pairByRanking(pairingIds, previousRounds)),
    }
  }

  if (isFirstRound && virtualWins) {
    // Accelerated: the virtual groups (top half / rest) are paired among themselves.
    const top = knownPlayers.filter((player) => virtualOf(player.id) > 0).map((player) => player.id)
    const rest = knownPlayers
      .filter((player) => virtualOf(player.id) <= 0)
      .map((player) => player.id)
    if (top.length % 2 === 1) rest.unshift(top.pop()!)
    return {
      standings,
      bye,
      matches: createMatches([...slidePairs(top), ...slidePairs(rest)]),
    }
  }

  if (isFirstRound) {
    const halfSize = knownPlayers.length / 2
    return {
      standings,
      bye,
      matches: createMatches(
        Array.from({ length: halfSize }, (_, index) => [
          knownPlayers[index].id,
          knownPlayers[index + halfSize].id,
        ]),
      ),
    }
  }

  // NOTE: currently unreachable (both branches above return); kept draw-aware for later use.
  const groups = new Map<
    string,
    { wins: number; draws: number; losses: number; players: string[] }
  >()

  knownPlayers.forEach((player) => {
    const standing = standingsById.get(player.id)
    const wins = (standing?.wins ?? 0) + virtualOf(player.id)
    const draws = standing?.draws ?? 0
    const losses = standing?.losses ?? 0
    const key = `${wins}:${draws}:${losses}`
    const group = groups.get(key) ?? { wins, draws, losses, players: [] }
    group.players.push(player.id)
    groups.set(key, group)
  })

  const pairs: Array<[string, string]> = []
  const leftovers: string[] = []
  const sortedGroups = [...groups.values()].sort(
    (first, second) =>
      second.wins - first.wins || second.draws - first.draws || second.losses - first.losses,
  )

  sortedGroups.forEach((group, groupIndex) => {
    if (group.players.length % 2 === 1) {
      const lowerGroups = sortedGroups
        .slice(groupIndex + 1)
        .filter((candidate) => candidate.wins < group.wins && candidate.players.length > 0)
      const nextWins = Math.max(...lowerGroups.map((candidate) => candidate.wins), -1)
      const candidates = lowerGroups
        .filter((candidate) => candidate.wins === nextWins)
        .flatMap((candidate) => candidate.players)
      const compatible = candidates.filter((candidateId) =>
        group.players.every((groupId) => !hasPlayed(groupId, candidateId, previousRounds)),
      )
      const promotedId = randomItem(compatible.length > 0 ? compatible : candidates)
      if (promotedId) {
        const sourceGroup = sortedGroups.find((candidate) =>
          candidate.players.includes(promotedId),
        )!
        sourceGroup.players.splice(sourceGroup.players.indexOf(promotedId), 1)
        group.players.push(promotedId)
      }
    }

    const leftover = group.players.length % 2 === 1 ? group.players.at(-1) : undefined
    const pairablePlayers = leftover ? group.players.slice(0, -1) : group.players
    pairs.push(...pairGroup(pairablePlayers, previousRounds))
    if (leftover) leftovers.push(leftover)
    group.players = []
  })

  const unknownIds = Array.from(
    { length: activePlayers.length - knownPlayers.length },
    (_, index) => unknownParticipantId(roundNumber, index),
  )
  const unpaired = [...leftovers, ...unknownIds]
  if (unpaired.length % 2 === 1) {
    const pendingByeIndex = unpaired.findIndex(isUnknownParticipantId)
    unpaired.splice(pendingByeIndex >= 0 ? pendingByeIndex : unpaired.length - 1, 1)
  }
  if (unpaired.length >= 2) pairs.push(...pairGroup(unpaired, previousRounds))

  return {
    standings,
    bye,
    matches: createMatches(pairs),
  }
}

const chooseCandidate = (
  opponentId: string | undefined,
  available: Participant[],
  standingsById: Map<string, { wins: number; losses: number }>,
  previousRounds: Round[],
  participantOrder: string[],
) => {
  const orderByParticipant = new Map(participantOrder.map((id, index) => [id, index]))
  const sortByParticipantOrder = (first: Participant, second: Participant) =>
    (orderByParticipant.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
    (orderByParticipant.get(second.id) ?? Number.MAX_SAFE_INTEGER)
  const opponentStanding = opponentId ? standingsById.get(opponentId) : undefined
  const sameRecord =
    opponentStanding === undefined
      ? []
      : available.filter((player) => {
          const standing = standingsById.get(player.id)
          return (
            standing?.wins === opponentStanding.wins && standing.losses === opponentStanding.losses
          )
        })
  const lowerWins =
    opponentStanding === undefined
      ? []
      : available.filter(
          (player) => (standingsById.get(player.id)?.wins ?? 0) < opponentStanding.wins,
        )
  const nextLowerWins = Math.max(
    ...lowerWins.map((player) => standingsById.get(player.id)?.wins ?? 0),
    -1,
  )
  const nextLower = lowerWins.filter(
    (player) => (standingsById.get(player.id)?.wins ?? 0) === nextLowerWins,
  )
  const possible = sameRecord.length > 0 ? sameRecord : nextLower.length > 0 ? nextLower : available
  const withoutRematch = opponentId
    ? possible.filter((player) => !hasPlayed(opponentId, player.id, previousRounds))
    : possible
  return [...(withoutRematch.length > 0 ? withoutRematch : possible)].sort(
    sortByParticipantOrder,
  )[0]
}

export const fillUnknownRound = (
  round: Round,
  players: Participant[],
  previousRounds: Round[],
  ctx: EvaluationContext,
) => {
  const activePlayers = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(activePlayers, previousRounds, ctx)
  const ranking = getRankingParticipants(activePlayers, previousRounds, ctx).sort(
    compareRankingParticipants,
  )
  const participantOrder = ranking.map((player) => player.id)
  const standingsById = new Map(standings.map((standing) => [standing.id, standing]))
  const finalizedIds = finalizedParticipantIds(activePlayers, previousRounds, ctx)
  const usedIds = new Set<string>()
  const collect = (id: string | null | undefined) => {
    if (id && !isUnknownParticipantId(id)) usedIds.add(id)
  }
  collect(round.bye)
  round.matches.forEach((match) => getMatchParticipantIds(match).forEach(collect))
  const available: Participant[] = ranking.filter(
    (player) => finalizedIds.has(player.id) && !usedIds.has(player.id),
  )
  let bye = round.bye
  if (
    !bye &&
    activePlayers.length % 2 === 1 &&
    activePlayers.every((player) => finalizedIds.has(player.id)) &&
    available.length > 0
  ) {
    bye = selectBye(
      available.map((player) => player.id),
      previousRounds,
    )
    available.splice(
      available.findIndex((player) => player.id === bye),
      1,
    )
  }
  const replace = (id: string, opponentId?: string) => {
    const candidate = chooseCandidate(
      opponentId,
      available,
      standingsById,
      previousRounds,
      participantOrder,
    )
    if (!candidate) return id
    available.splice(available.indexOf(candidate), 1)
    usedIds.add(candidate.id)
    return candidate.id
  }

  if (bye && isUnknownParticipantId(bye)) bye = replace(bye)
  const matches = round.matches.map((match) => {
    let a = match.a
    let b = match.b
    if (isUnknownParticipantId(a) && !isUnknownParticipantId(b)) a = replace(a, b)
    if (isUnknownParticipantId(b) && !isUnknownParticipantId(a)) b = replace(b, a)
    if (isUnknownParticipantId(a) && isUnknownParticipantId(b)) {
      a = replace(a)
      b = replace(b)
    }
    return { ...match, a, b }
  })

  return {
    ...round,
    bye,
    matches: sortMatchesByParticipantOrder(matches, participantOrder),
    standings,
  }
}

export const rerollRound = (
  players: Participant[],
  rounds: Round[],
  number: number,
  ctx: EvaluationContext,
) => {
  const index = rounds.findIndex((round) => round.number === number)
  if (index < 0) return rounds
  const round = rounds[index]
  if (round.matches.some(hasEnteredScore)) return rounds
  const plan = createRoundPlan(
    players,
    rounds.slice(0, index),
    { roundNumber: number, isFirstRound: index === 0 },
    round.bye ?? undefined,
    ctx,
  )
  return rounds.map((item, roundIndex) =>
    roundIndex === index
      ? { ...item, bye: plan.bye, matches: plan.matches, standings: plan.standings }
      : item,
  )
}

export const rerollBye = (
  players: Participant[],
  rounds: Round[],
  number: number,
  ctx: EvaluationContext,
) => {
  const index = rounds.findIndex((round) => round.number === number)
  if (index < 0) return rounds
  const round = rounds[index]
  if (!round.bye || round.matches.some(hasEnteredScore)) return rounds

  const activePlayers = players.filter((player) => !player.withdrawn)
  if (activePlayers.length % 2 === 0) return rounds
  const ranking = getRankingParticipants(activePlayers, rounds.slice(0, index), ctx)
  if (index > 0) ranking.sort(compareRankingParticipants)
  const finalizedIds = finalizedParticipantIds(activePlayers, rounds.slice(0, index), ctx)
  const candidateIds = ranking
    .filter((player) => finalizedIds.has(player.id))
    .map((player) => player.id)
  if (!candidateIds.includes(round.bye) || candidateIds.length < 2) return rounds

  const nextBye = selectBye(
    candidateIds.filter((participantId) => participantId !== round.bye),
    rounds.slice(0, index),
  )
  if (!nextBye) return rounds

  return rounds.map((item, roundIndex) =>
    roundIndex === index
      ? {
          ...item,
          bye: nextBye,
          matches: item.matches.map((match) => ({
            ...match,
            a: match.a === round.bye ? nextBye : match.a === nextBye ? round.bye! : match.a,
            b: match.b === round.bye ? nextBye : match.b === nextBye ? round.bye! : match.b,
          })),
        }
      : item,
  )
}
