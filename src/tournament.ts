import type { Match, Participant, Round, RoundStanding, SetScore } from './tournamentTypes'

export const UNKNOWN_PARTICIPANT_PREFIX = '__unknown__:'

export const isUnknownParticipantId = (id: string) => id.startsWith(UNKNOWN_PARTICIPANT_PREFIX)

const unknownParticipantId = (roundNumber: number, index: number) =>
  `${UNKNOWN_PARTICIPANT_PREFIX}${roundNumber}:${index}`

const randomItem = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

const selectBye = (candidateIds: string[], previousRounds: Round[]) => {
  const byeCounts = new Map(candidateIds.map((id) => [id, 0]))
  previousRounds.forEach((round) => {
    if (round.bye && byeCounts.has(round.bye)) {
      byeCounts.set(round.bye, (byeCounts.get(round.bye) ?? 0) + 1)
    }
  })
  const lowestByeCount = Math.min(...byeCounts.values())
  return randomItem(candidateIds.filter((id) => byeCounts.get(id) === lowestByeCount))
}

export const getMatchSets = (match: Match): SetScore[] =>
  match.sets?.length
    ? match.sets
    : match.scoreA !== '' || match.scoreB !== ''
      ? [{ a: match.scoreA, b: match.scoreB }]
      : []

const completeSet = (set: SetScore) =>
  set.a.trim() !== '' &&
  set.b.trim() !== '' &&
  Number.isFinite(Number(set.a)) &&
  Number.isFinite(Number(set.b)) &&
  Number(set.a) >= 0 &&
  Number(set.b) >= 0 &&
  Number(set.a) !== Number(set.b)

export const getMatchResult = (match: Match, winningGames: number) => {
  const sets = getMatchSets(match).filter(completeSet)
  let winsA = 0
  let winsB = 0
  let winner: string | null = null

  sets.forEach((set) => {
    if (winner) return
    if (Number(set.a) > Number(set.b)) winsA += 1
    if (Number(set.b) > Number(set.a)) winsB += 1
    if (winsA >= winningGames) winner = match.a
    if (winsB >= winningGames) winner = match.b
  })

  return winner ? { sets, winner } : null
}

const hasPlayed = (firstId: string, secondId: string, rounds: Round[]) =>
  rounds.some((round) =>
    round.matches.some(
      (match) =>
        (match.a === firstId && match.b === secondId) ||
        (match.a === secondId && match.b === firstId),
    ),
  )

const newStanding = (player: Participant): RoundStanding => ({
  participantId: player.id,
  wins: 0,
  losses: 0,
  scored: 0,
  conceded: 0,
  setsWon: 0,
  setsLost: 0,
})

const applyRoundToStandings = (standings: Map<string, RoundStanding>, round: Round) => {
  if (round.startedAt && round.bye && !isUnknownParticipantId(round.bye)) {
    const byeStanding = standings.get(round.bye)
    if (byeStanding) byeStanding.wins += 1
  }

  round.matches.forEach((match) => {
    if (
      isUnknownParticipantId(match.a) ||
      isUnknownParticipantId(match.b) ||
      !standings.has(match.a) ||
      !standings.has(match.b)
    )
      return

    const result = getMatchResult(match, Math.max(1, round.winningGames || 1))
    if (!result) return
    const standingA = standings.get(match.a)!
    const standingB = standings.get(match.b)!
    standingA.wins += result.winner === match.a ? 1 : 0
    standingA.losses += result.winner === match.a ? 0 : 1
    standingB.wins += result.winner === match.b ? 1 : 0
    standingB.losses += result.winner === match.b ? 0 : 1

    result.sets.forEach((set) => {
      const pointsA = Number(set.a)
      const pointsB = Number(set.b)
      standingA.scored += pointsA
      standingA.conceded += pointsB
      standingB.scored += pointsB
      standingB.conceded += pointsA
      standingA.setsWon += pointsA > pointsB ? 1 : 0
      standingA.setsLost += pointsA < pointsB ? 1 : 0
      standingB.setsWon += pointsB > pointsA ? 1 : 0
      standingB.setsLost += pointsB < pointsA ? 1 : 0
    })
  })
}

const standingsSnapshot = (players: Participant[], standings: Map<string, RoundStanding>) =>
  players.map((player) => ({
    ...player,
    ...(standings.get(player.id) ?? newStanding(player)),
  }))

export const calculateStandings = (players: Participant[], rounds: Round[]) => {
  const standings = new Map(players.map((player) => [player.id, newStanding(player)]))
  rounds.forEach((round) => applyRoundToStandings(standings, round))

  return standingsSnapshot(players, standings)
}

export const calculateStandingsBeforeRounds = (players: Participant[], rounds: Round[]) => {
  const standings = new Map(players.map((player) => [player.id, newStanding(player)]))
  return rounds.map((round) => {
    const snapshot = standingsSnapshot(players, standings)
    applyRoundToStandings(standings, round)
    return snapshot
  })
}

export type RankingParticipant = Omit<Participant, 'setsWon' | 'setsLost'> & {
  setsWon: number
  setsLost: number
  lastLossRound: number
}

const getLastLossRounds = (players: Participant[], rounds: Round[]) => {
  const lastLossRounds = new Map(players.map((player) => [player.id, 0]))
  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const result = getMatchResult(match, Math.max(1, round.winningGames || 1))
      if (!result) return
      if (!lastLossRounds.has(match.a) || !lastLossRounds.has(match.b)) return
      const loser = result.winner === match.a ? match.b : match.a
      lastLossRounds.set(loser, round.number)
    })
  })
  return lastLossRounds
}

export const getRankingParticipants = (players: Participant[], rounds: Round[]) => {
  const standings = calculateStandings(players, rounds)
  const lastLossRounds = getLastLossRounds(players, rounds)
  return standings.map((player) => ({
    ...player,
    setsWon: player.setsWon ?? 0,
    setsLost: player.setsLost ?? 0,
    lastLossRound: lastLossRounds.get(player.id) ?? 0,
  }))
}

export const compareRankingParticipants = (
  first: RankingParticipant,
  second: RankingParticipant,
) => {
  if (first.wins !== second.wins) return second.wins - first.wins
  if (first.lastLossRound !== second.lastLossRound) {
    if (first.lastLossRound === 0) return -1
    if (second.lastLossRound === 0) return 1
    return second.lastLossRound - first.lastLossRound
  }
  if (first.setsWon !== second.setsWon) return second.setsWon - first.setsWon
  if (first.setsLost !== second.setsLost) return first.setsLost - second.setsLost
  if (first.scored !== second.scored) return second.scored - first.scored
  if (first.conceded !== second.conceded) return first.conceded - second.conceded
  return first.name.localeCompare(second.name)
}

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

const finalizedParticipantIds = (players: Participant[], rounds: Round[]) => {
  if (rounds.length === 0) return new Set(players.map((player) => player.id))
  const lastRound = rounds.at(-1)!
  const finalized = new Set<string>()

  if (lastRound.bye && !isUnknownParticipantId(lastRound.bye)) finalized.add(lastRound.bye)
  lastRound.matches.forEach((match) => {
    if (!getMatchResult(match, Math.max(1, lastRound.winningGames || 1))) return
    if (!isUnknownParticipantId(match.a)) finalized.add(match.a)
    if (!isUnknownParticipantId(match.b)) finalized.add(match.b)
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
  const remaining = [...participantIds]
  const pairs: Array<[string, string]> = []
  while (remaining.length >= 2) {
    const first = remaining.shift()!
    const opponentIndex = remaining.findIndex(
      (candidate) => !hasPlayed(first, candidate, previousRounds),
    )
    const fallbackIndex = opponentIndex >= 0 ? opponentIndex : 0
    const [second] = remaining.splice(fallbackIndex, 1)
    pairs.push([first, second])
  }
  return pairs
}

export const createRoundPlan = (
  players: Participant[],
  previousRounds: Round[],
  roundNumber: number,
) => {
  const activePlayers = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(activePlayers, previousRounds)
  const ranking = getRankingParticipants(activePlayers, previousRounds)
  if (roundNumber > 1) ranking.sort(compareRankingParticipants)
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
  const finalizedIds = finalizedParticipantIds(activePlayers, previousRounds)
  let knownPlayers = ranking.filter((player) => finalizedIds.has(player.id))
  let bye: string | null = null
  if (knownPlayers.length === activePlayers.length && activePlayers.length % 2 === 1) {
    bye = selectBye(
      knownPlayers.map((player) => player.id),
      previousRounds,
    )
    knownPlayers = knownPlayers.filter((player) => player.id !== bye)
  }

  if (roundNumber > 1) {
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

  if (roundNumber === 1) {
    return {
      standings,
      bye,
      matches: createMatches(
        Array.from({ length: knownPlayers.length / 2 }, (_, index) => [
          knownPlayers[index * 2].id,
          knownPlayers[index * 2 + 1].id,
        ]),
      ),
    }
  }

  const groups = new Map<string, { wins: number; losses: number; players: string[] }>()

  knownPlayers.forEach((player) => {
    const standing = standingsById.get(player.id)
    const wins = standing?.wins ?? 0
    const losses = standing?.losses ?? 0
    const key = `${wins}:${losses}`
    const group = groups.get(key) ?? { wins, losses, players: [] }
    group.players.push(player.id)
    groups.set(key, group)
  })

  const pairs: Array<[string, string]> = []
  const leftovers: string[] = []
  const sortedGroups = [...groups.values()].sort(
    (first, second) => second.wins - first.wins || second.losses - first.losses,
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
  standingsById: Map<string, Participant>,
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

export const fillUnknownRound = (round: Round, players: Participant[], previousRounds: Round[]) => {
  const activePlayers = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(activePlayers, previousRounds)
  const participantOrder = getRankingParticipants(activePlayers, previousRounds)
    .sort(compareRankingParticipants)
    .map((player) => player.id)
  const standingsById = new Map(standings.map((standing) => [standing.id, standing]))
  const finalizedIds = finalizedParticipantIds(activePlayers, previousRounds)
  const usedIds = new Set<string>()
  const collect = (id: string | null | undefined) => {
    if (id && !isUnknownParticipantId(id)) usedIds.add(id)
  }
  collect(round.bye)
  round.matches.forEach((match) => {
    collect(match.a)
    collect(match.b)
  })
  const available = activePlayers.filter(
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

export const hasEnteredScore = (match: Match) =>
  getMatchSets(match).some((set) => set.a.trim() !== '' || set.b.trim() !== '')

export const rerollRound = (players: Participant[], rounds: Round[], number: number) => {
  const index = rounds.findIndex((round) => round.number === number)
  if (index < 0) return rounds
  const round = rounds[index]
  if (round.matches.some(hasEnteredScore)) return rounds
  const plan = createRoundPlan(players, rounds.slice(0, index), number)
  return rounds.map((item, roundIndex) =>
    roundIndex === index
      ? { ...item, bye: plan.bye, matches: plan.matches, standings: plan.standings }
      : item,
  )
}

export const getCurrentRoundNumber = (rounds: Round[], defaultCourtCount = 1) => {
  const runningMatchIds = getRunningMatchIdsByRound(rounds, defaultCourtCount)
  const currentRound = rounds.find(
    (round) =>
      round.matches.length > 0 &&
      ((!round.startedAt && !isRoundComplete(round)) || runningMatchIds.has(round.number)),
  )
  const lastPlannedRound = [...rounds].reverse().find((round) => round.matches.length > 0)
  return currentRound?.number ?? lastPlannedRound?.number ?? 0
}

export const isRoundComplete = (round: Round) =>
  round.matches.length > 0 &&
  round.matches.every((match) => getMatchResult(match, Math.max(1, round.winningGames || 1)))

export const getRoundCourtCount = (round: Round, defaultCourtCount = 1) => {
  const value = round.courtCount ?? defaultCourtCount
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

export const getRunningMatchIds = (round: Round, defaultCourtCount = 1) => {
  if (!round.startedAt) return new Set<string>()
  const winningGames = Math.max(1, round.winningGames || 1)
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const assignedMatches = round.matches.filter(
    (match) =>
      !getMatchResult(match, winningGames) &&
      Number.isInteger(match.court) &&
      match.court! >= 1 &&
      match.court! <= capacity,
  )
  if (assignedMatches.length > 0) return new Set(assignedMatches.map((match) => match.id))
  const runningMatches = round.matches
    .filter((match) => !getMatchResult(match, winningGames))
    .slice(0, getRoundCourtCount(round, defaultCourtCount))
  return new Set(runningMatches.map((match) => match.id))
}

const getComputedRunningMatchIdsByRound = (
  rounds: Round[],
  defaultCourtCount = 1,
  includeUnstarted = false,
) => {
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const runningByRound = new Map<number, Set<string>>()
  const occupiedParticipants = new Set<string>()
  const blockedByPreviousRounds = new Set<string>()
  const candidates = rounds.flatMap((round) => {
    const winningGames = Math.max(1, round.winningGames || 1)
    const incompleteMatches = round.matches.filter((match) => !getMatchResult(match, winningGames))
    const blockedParticipants = new Set(blockedByPreviousRounds)
    incompleteMatches.forEach((match) => {
      if (!isUnknownParticipantId(match.a)) blockedByPreviousRounds.add(match.a)
      if (!isUnknownParticipantId(match.b)) blockedByPreviousRounds.add(match.b)
    })

    if (!round.startedAt && !includeUnstarted) return []
    return incompleteMatches.map((match) => ({ round, match, blockedParticipants }))
  })
  const prioritizedCandidates = candidates.sort(
    (first, second) => Number(hasEnteredScore(second.match)) - Number(hasEnteredScore(first.match)),
  )
  let assignedCourts = 0

  for (const { round, match, blockedParticipants } of prioritizedCandidates) {
    if (assignedCourts >= capacity) break
    const runningIds = runningByRound.get(round.number) ?? new Set<string>()
    if (runningIds.size >= getRoundCourtCount(round, capacity)) continue
    if (isUnknownParticipantId(match.a) || isUnknownParticipantId(match.b)) continue
    if (
      blockedParticipants.has(match.a) ||
      blockedParticipants.has(match.b) ||
      occupiedParticipants.has(match.a) ||
      occupiedParticipants.has(match.b)
    ) {
      continue
    }
    runningIds.add(match.id)
    runningByRound.set(round.number, runningIds)
    occupiedParticipants.add(match.a)
    occupiedParticipants.add(match.b)
    assignedCourts += 1
  }

  return runningByRound
}

const hasAssignedCourt = (match: Match, capacity: number) =>
  Number.isInteger(match.court) && match.court! >= 1 && match.court! <= capacity

const getAssignedRunningMatchIdsByRound = (rounds: Round[], defaultCourtCount: number) => {
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const runningByRound = new Map<number, Set<string>>()
  rounds.forEach((round) => {
    if (!round.startedAt) return
    const winningGames = Math.max(1, round.winningGames || 1)
    const runningIds = new Set(
      round.matches
        .filter(
          (match) => !getMatchResult(match, winningGames) && hasAssignedCourt(match, capacity),
        )
        .map((match) => match.id),
    )
    if (runningIds.size > 0) runningByRound.set(round.number, runningIds)
  })
  return runningByRound
}

export const getRunningMatchIdsByRound = (
  rounds: Round[],
  defaultCourtCount = 1,
  includeUnstarted = false,
) => {
  if (includeUnstarted) {
    return getComputedRunningMatchIdsByRound(rounds, defaultCourtCount, true)
  }
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const hasPersistedAssignments = rounds.some((round) =>
    round.matches.some((match) => hasAssignedCourt(match, capacity)),
  )
  return hasPersistedAssignments
    ? getAssignedRunningMatchIdsByRound(rounds, defaultCourtCount)
    : getComputedRunningMatchIdsByRound(rounds, defaultCourtCount)
}

type CourtCandidate = {
  round: Round
  match: Match
  blockedParticipants: Set<string>
}

const getCourtCandidates = (rounds: Round[]) => {
  const blockedByPreviousRounds = new Set<string>()
  const candidates = rounds.flatMap((round) => {
    const winningGames = Math.max(1, round.winningGames || 1)
    const incompleteMatches = round.matches.filter((match) => !getMatchResult(match, winningGames))
    const blockedParticipants = new Set(blockedByPreviousRounds)
    incompleteMatches.forEach((match) => {
      if (!isUnknownParticipantId(match.a)) blockedByPreviousRounds.add(match.a)
      if (!isUnknownParticipantId(match.b)) blockedByPreviousRounds.add(match.b)
    })
    if (!round.startedAt) return []
    return incompleteMatches.map((match) => ({ round, match, blockedParticipants }))
  })
  return candidates.sort(
    (first, second) => Number(hasEnteredScore(second.match)) - Number(hasEnteredScore(first.match)),
  )
}

const canAssignCourt = (
  candidate: CourtCandidate,
  capacity: number,
  usedCourts: Set<number>,
  occupiedParticipants: Set<string>,
  assignedByRound: Map<number, number>,
) => {
  const { round, match, blockedParticipants } = candidate
  if (
    isUnknownParticipantId(match.a) ||
    isUnknownParticipantId(match.b) ||
    blockedParticipants.has(match.a) ||
    blockedParticipants.has(match.b) ||
    occupiedParticipants.has(match.a) ||
    occupiedParticipants.has(match.b)
  ) {
    return false
  }
  return (assignedByRound.get(round.number) ?? 0) < getRoundCourtCount(round, capacity)
}

export const assignCourtsToMatches = (
  rounds: Round[],
  defaultCourtCount = 1,
  startedAt = new Date().toISOString(),
) => {
  const capacity = Math.max(1, Math.floor(defaultCourtCount) || 1)
  const candidates = getCourtCandidates(rounds)
  const usedCourts = new Set<number>()
  const occupiedParticipants = new Set<string>()
  const assignedByRound = new Map<number, number>()
  const assignedCourts = new Map<string, number>()
  const assignedStartTimes = new Map<string, string>()
  const assign = (candidate: CourtCandidate, court: number) => {
    assignedCourts.set(candidate.match.id, court)
    if (!candidate.match.startedAt) assignedStartTimes.set(candidate.match.id, startedAt)
    usedCourts.add(court)
    assignedByRound.set(
      candidate.round.number,
      (assignedByRound.get(candidate.round.number) ?? 0) + 1,
    )
    occupiedParticipants.add(candidate.match.a)
    occupiedParticipants.add(candidate.match.b)
  }

  candidates.forEach((candidate) => {
    const court = candidate.match.court
    if (
      !canAssignCourt(candidate, capacity, usedCourts, occupiedParticipants, assignedByRound) ||
      !hasAssignedCourt(candidate.match, capacity) ||
      usedCourts.has(court!)
    ) {
      return
    }
    assign(candidate, court!)
  })

  candidates.forEach((candidate) => {
    if (assignedCourts.has(candidate.match.id)) return
    if (!canAssignCourt(candidate, capacity, usedCourts, occupiedParticipants, assignedByRound)) {
      return
    }
    const court = Array.from({ length: capacity }, (_, index) => index + 1).find(
      (value) => !usedCourts.has(value),
    )
    if (court !== undefined) assign(candidate, court)
  })

  let changed = false
  const next = rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => {
      const court = assignedCourts.get(match.id)
      const startedAt = assignedStartTimes.get(match.id)
      if (match.court === court && (!startedAt || match.startedAt === startedAt)) return match
      changed = true
      return { ...match, court, startedAt: match.startedAt ?? startedAt }
    }),
  }))
  return changed ? next : rounds
}

export const calculateExpectedMatchStarts = (
  rounds: Round[],
  courtCount: number,
  durationMinutes: number,
  breakMinutes: number,
  scheduledStart = '',
  expectedMatchCount = 0,
) => {
  const capacity = Math.max(1, Math.floor(courtCount) || 1)
  const duration = Math.max(1, durationMinutes) * 60_000
  const pause = Math.max(0, breakMinutes) * 60_000
  let nextRoundStart = Number.isNaN(new Date(scheduledStart).getTime())
    ? undefined
    : new Date(scheduledStart).getTime()

  return rounds.map((round) => {
    const actualStarts = round.matches
      .map((match) => match.startedAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite)
    const roundStartedAt = round.startedAt ? new Date(round.startedAt).getTime() : NaN
    const roundStart = actualStarts.length
      ? Math.min(...actualStarts)
      : Number.isFinite(roundStartedAt)
        ? roundStartedAt
        : nextRoundStart

    if (!Number.isFinite(roundStart)) {
      return round
    }

    const matches = round.matches.map((match, index) => ({
      ...match,
      predictedStart: new Date(
        roundStart + Math.floor(index / capacity) * (duration + pause),
      ).toISOString(),
    }))
    const matchCount = round.matches.length || expectedMatchCount
    const batches = Math.ceil(matchCount / capacity)
    nextRoundStart = roundStart + batches * duration + batches * pause
    return { ...round, predictedStart: new Date(roundStart).toISOString(), matches }
  })
}

export const startRoundInRounds = (
  rounds: Round[],
  number: number,
  startedAt = new Date().toISOString(),
) =>
  rounds.map((round) =>
    round.number === number && !round.startedAt ? { ...round, startedAt } : round,
  )

export const startReadyRounds = (
  rounds: Round[],
  defaultCourtCount = 1,
  startedAt = new Date().toISOString(),
) => {
  const readyMatchIds = getRunningMatchIdsByRound(rounds, defaultCourtCount, true)
  let changed = false
  const next = rounds.map((round, index) => {
    const startsFirstRound = index === 0 && round.matches.some(hasEnteredScore)
    const startsReadyRound = index > 0 && readyMatchIds.has(round.number)
    if (!round.startedAt && (startsFirstRound || startsReadyRound)) {
      changed = true
      return { ...round, startedAt }
    }
    return round
  })
  return assignCourtsToMatches(changed ? next : rounds, defaultCourtCount, startedAt)
}
