import { isFiniteNumber, isRecord } from './guards'

/** The v1 snapshot shape, kept for parsing, migration and the golden tests. */
export type V1Participant = {
  id: string
  name: string
  wins: number
  losses: number
  scored: number
  conceded: number
  setsWon?: number
  setsLost?: number
  withdrawn?: boolean
}
export type V1SetScore = { a: string; b: string }
export type V1Match = {
  id: string
  a: string
  b: string
  scoreA: string
  scoreB: string
  court?: number
  sets?: V1SetScore[]
  predictedStart?: string
  startedAt?: string
}
export type V1RoundStanding = {
  participantId: string
  wins: number
  losses: number
  scored: number
  conceded: number
  setsWon: number
  setsLost: number
}
export type V1Round = {
  number: number
  predictedStart?: string
  startedAt?: string
  bye?: string | null
  winningGames: number
  courtCount?: number
  matches: V1Match[]
  standings?: V1RoundStanding[]
}
export type V1TournamentSnapshot = {
  version: 1
  tournamentName: string
  participantType: 'players' | 'teams'
  courtCount: number
  defaultWinningGames: number
  defaultSetPoints: number
  expectedDurationMinutes: number
  breakBetweenMatchesMinutes: number
  scheduledStart: string
  players: V1Participant[]
  rounds: V1Round[]
}

const isParticipant = (value: unknown): value is V1Participant =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isFiniteNumber(value.wins) &&
  isFiniteNumber(value.losses) &&
  isFiniteNumber(value.scored) &&
  isFiniteNumber(value.conceded)

export const isV1Match = (value: unknown): value is V1Match =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.a === 'string' &&
  typeof value.b === 'string' &&
  typeof value.scoreA === 'string' &&
  typeof value.scoreB === 'string' &&
  (value.court === undefined ||
    (isFiniteNumber(value.court) && Number.isInteger(value.court) && value.court >= 1)) &&
  (value.predictedStart === undefined || typeof value.predictedStart === 'string') &&
  (value.startedAt === undefined || typeof value.startedAt === 'string') &&
  (value.sets === undefined ||
    (Array.isArray(value.sets) &&
      value.sets.every(
        (set) => isRecord(set) && typeof set.a === 'string' && typeof set.b === 'string',
      )))

const isRound = (value: unknown): value is V1Round =>
  isRecord(value) &&
  isFiniteNumber(value.number) &&
  (value.predictedStart === undefined || typeof value.predictedStart === 'string') &&
  isFiniteNumber(value.winningGames) &&
  Array.isArray(value.matches) &&
  value.matches.every(isV1Match) &&
  (value.courtCount === undefined || isFiniteNumber(value.courtCount))

export const parseV1Snapshot = (value: unknown): V1TournamentSnapshot | null => {
  if (!isRecord(value)) return null
  if (value.version !== undefined && value.version !== 1) return null
  if (!Array.isArray(value.players) || !value.players.every(isParticipant)) return null
  if (!Array.isArray(value.rounds) || !value.rounds.every(isRound)) return null
  if (value.participantType !== 'players' && value.participantType !== 'teams') return null
  if (!isFiniteNumber(value.courtCount) || !isFiniteNumber(value.defaultWinningGames)) return null
  if (value.defaultSetPoints !== undefined && !isFiniteNumber(value.defaultSetPoints)) return null

  const tournamentName = typeof value.tournamentName === 'string' ? value.tournamentName.trim() : ''
  if (!tournamentName) return null

  return {
    version: 1,
    tournamentName,
    players: value.players,
    rounds: value.rounds,
    participantType: value.participantType,
    courtCount: Math.max(1, Math.floor(value.courtCount)),
    defaultWinningGames: Math.min(99, Math.max(1, Math.floor(value.defaultWinningGames))),
    defaultSetPoints:
      value.defaultSetPoints === undefined
        ? 21
        : Math.max(1, Math.floor(value.defaultSetPoints as number)),
    expectedDurationMinutes:
      typeof value.expectedDurationMinutes === 'number'
        ? Math.max(1, Math.floor(value.expectedDurationMinutes))
        : 25,
    breakBetweenMatchesMinutes:
      typeof value.breakBetweenMatchesMinutes === 'number'
        ? Math.max(0, Math.floor(value.breakBetweenMatchesMinutes))
        : 5,
    scheduledStart: typeof value.scheduledStart === 'string' ? value.scheduledStart : '',
  }
}
