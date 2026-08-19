import type { Participant } from './components/Players'
import type { Match, Round, RoundStanding, SetScore } from './storage'

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

export const calculateStandings = (players: Participant[], rounds: Round[]) => {
  const standings = new Map(players.map((player) => [player.id, newStanding(player)]))

  rounds.forEach((round) => {
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
  })

  return players.map((player) => ({
    ...player,
    ...(standings.get(player.id) ?? newStanding(player)),
  }))
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

export const createRoundPlan = (
  players: Participant[],
  previousRounds: Round[],
  roundNumber: number,
) => {
  const activePlayers = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(activePlayers, previousRounds)
  const standingsById = new Map(standings.map((standing) => [standing.id, standing]))
  const finalizedIds = finalizedParticipantIds(activePlayers, previousRounds)
  let knownPlayers = activePlayers.filter((player) => finalizedIds.has(player.id))
  let bye: string | null = null
  if (knownPlayers.length === activePlayers.length && activePlayers.length % 2 === 1) {
    bye = selectBye(
      knownPlayers.map((player) => player.id),
      previousRounds,
    )
    knownPlayers = knownPlayers.filter((player) => player.id !== bye)
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
    matches: pairs.map(([a, b], index) => ({
      id: `${roundNumber}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      a,
      b,
      scoreA: '',
      scoreB: '',
    })),
  }
}

const chooseCandidate = (
  opponentId: string | undefined,
  available: Participant[],
  standingsById: Map<string, Participant>,
  previousRounds: Round[],
) => {
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
  return randomItem(withoutRematch.length > 0 ? withoutRematch : possible)
}

export const fillUnknownRound = (round: Round, players: Participant[], previousRounds: Round[]) => {
  const activePlayers = players.filter((player) => !player.withdrawn)
  const standings = calculateStandings(activePlayers, previousRounds)
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
    const candidate = chooseCandidate(opponentId, available, standingsById, previousRounds)
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

  return { ...round, bye, matches, standings }
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
  const currentRound = rounds.find(
    (round) =>
      (!round.startedAt && !isRoundComplete(round)) ||
      getRunningMatchIds(round, defaultCourtCount).size > 0,
  )
  return currentRound?.number ?? rounds.at(-1)?.number ?? 0
}

export const isRoundComplete = (round: Round) =>
  round.matches.every((match) => getMatchResult(match, Math.max(1, round.winningGames || 1)))

export const getRoundCourtCount = (round: Round, defaultCourtCount = 1) => {
  const value = round.courtCount ?? defaultCourtCount
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

export const getRunningMatchIds = (round: Round, defaultCourtCount = 1) => {
  if (!round.startedAt) return new Set<string>()
  const winningGames = Math.max(1, round.winningGames || 1)
  const runningMatches = round.matches
    .filter((match) => !getMatchResult(match, winningGames))
    .slice(0, getRoundCourtCount(round, defaultCourtCount))
  return new Set(runningMatches.map((match) => match.id))
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
  let changed = false
  const next = rounds.map((round, index) => {
    const previousRound = rounds[index - 1]
    if (
      !round.startedAt &&
      previousRound &&
      isRoundComplete(previousRound) &&
      getRunningMatchIds(previousRound, defaultCourtCount).size === 0
    ) {
      changed = true
      return { ...round, startedAt }
    }
    return round
  })
  return changed ? next : rounds
}
