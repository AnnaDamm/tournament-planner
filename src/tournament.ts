import type { Participant } from './components/Players'
import type { Match, Round, RoundStanding, SetScore } from './storage'

export const UNKNOWN_PARTICIPANT_PREFIX = '__unknown__:'

export const isUnknownParticipantId = (id: string) => id.startsWith(UNKNOWN_PARTICIPANT_PREFIX)

const unknownParticipantId = (roundNumber: number, index: number) =>
  `${UNKNOWN_PARTICIPANT_PREFIX}${roundNumber}:${index}`

const randomItem = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

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
    if (round.bye && !isUnknownParticipantId(round.bye)) {
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

const takePair = (group: string[], rounds: Round[]) => {
  const firstIndex = group.findIndex((firstId, index) =>
    group.slice(index + 1).some((secondId) => !hasPlayed(firstId, secondId, rounds)),
  )
  const safeFirstIndex = firstIndex >= 0 ? firstIndex : 0
  const secondIndex = group.findIndex(
    (secondId, index) =>
      index !== safeFirstIndex && !hasPlayed(group[safeFirstIndex], secondId, rounds),
  )
  const safeSecondIndex = secondIndex >= 0 ? secondIndex : safeFirstIndex === 0 ? 1 : 0
  const first = group[safeFirstIndex]
  const second = group[safeSecondIndex]
  group.splice(Math.max(safeFirstIndex, safeSecondIndex), 1)
  group.splice(Math.min(safeFirstIndex, safeSecondIndex), 1)
  return [first, second] as [string, string]
}

const chooseLowerPlayer = (
  currentId: string,
  currentWins: number,
  groups: Map<number, string[]>,
  rounds: Round[],
) => {
  const lowerPlayers = [...groups.entries()]
    .filter(([wins, group]) => wins < currentWins && group.length > 0)
    .flatMap(([, group]) => group)
  const compatible = lowerPlayers.filter((playerId) => !hasPlayed(currentId, playerId, rounds))
  return randomItem(compatible.length > 0 ? compatible : lowerPlayers)
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
  const knownPlayers = activePlayers.filter((player) => finalizedIds.has(player.id))
  const groups = new Map<number, string[]>()

  knownPlayers.forEach((player) => {
    const wins = standingsById.get(player.id)?.wins ?? 0
    groups.set(wins, [...(groups.get(wins) ?? []), player.id])
  })

  const pairs: Array<[string, string]> = []
  const leftovers: string[] = []
  const sortedWins = [...groups.keys()].sort((a, b) => b - a)

  sortedWins.forEach((wins) => {
    const group = groups.get(wins)!
    while (group.length >= 2) pairs.push(takePair(group, previousRounds))
    if (group.length === 1) {
      const playerId = group.pop()!
      const lowerPlayer = chooseLowerPlayer(playerId, wins, groups, previousRounds)
      if (lowerPlayer) {
        const lowerGroup = groups.get(standingsById.get(lowerPlayer)?.wins ?? 0)!
        lowerGroup.splice(lowerGroup.indexOf(lowerPlayer), 1)
        pairs.push([playerId, lowerPlayer])
      } else {
        leftovers.push(playerId)
      }
    }
  })

  const unknownIds = Array.from(
    { length: activePlayers.length - knownPlayers.length },
    (_, index) => unknownParticipantId(roundNumber, index),
  )
  const unpaired = [...leftovers, ...unknownIds]
  let bye: string | null = null
  if (unpaired.length % 2 === 1) {
    const byeIndex = unpaired.findIndex((id) => !isUnknownParticipantId(id))
    bye = unpaired.splice(byeIndex >= 0 ? byeIndex : 0, 1)[0]
  }
  while (unpaired.length >= 2) pairs.push([unpaired.shift()!, unpaired.shift()!])

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
  const opponentWins = opponentId ? standingsById.get(opponentId)?.wins : undefined
  const sameWins =
    opponentWins === undefined
      ? []
      : available.filter((player) => (standingsById.get(player.id)?.wins ?? 0) === opponentWins)
  const lowerWins =
    opponentWins === undefined
      ? []
      : available.filter((player) => (standingsById.get(player.id)?.wins ?? 0) < opponentWins)
  const possible = sameWins.length > 0 ? sameWins : lowerWins.length > 0 ? lowerWins : available
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
  const replace = (id: string, opponentId?: string) => {
    const candidate = chooseCandidate(opponentId, available, standingsById, previousRounds)
    if (!candidate) return id
    available.splice(available.indexOf(candidate), 1)
    usedIds.add(candidate.id)
    return candidate.id
  }

  let bye = round.bye
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

export const getCurrentRoundNumber = (rounds: Round[]) => {
  const currentRound = rounds.find((round) => !isRoundComplete(round))
  return currentRound?.number ?? rounds.at(-1)?.number ?? 0
}

export const isRoundComplete = (round: Round) =>
  round.matches.every((match) => getMatchResult(match, Math.max(1, round.winningGames || 1)))
