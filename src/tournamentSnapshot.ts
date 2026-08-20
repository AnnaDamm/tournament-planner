import type { Match, Participant, Round, TournamentSnapshot } from './tournamentTypes'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isParticipant = (value: unknown): value is Participant =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isFiniteNumber(value.wins) &&
  isFiniteNumber(value.losses) &&
  isFiniteNumber(value.scored) &&
  isFiniteNumber(value.conceded)

const isMatch = (value: unknown): value is Match =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.a === 'string' &&
  typeof value.b === 'string' &&
  typeof value.scoreA === 'string' &&
  typeof value.scoreB === 'string' &&
  (value.court === undefined ||
    (isFiniteNumber(value.court) && Number.isInteger(value.court) && value.court >= 1)) &&
  (value.sets === undefined ||
    (Array.isArray(value.sets) &&
      value.sets.every(
        (set) => isRecord(set) && typeof set.a === 'string' && typeof set.b === 'string',
      )))

const isRound = (value: unknown): value is Round =>
  isRecord(value) &&
  isFiniteNumber(value.number) &&
  isFiniteNumber(value.winningGames) &&
  Array.isArray(value.matches) &&
  value.matches.every(isMatch) &&
  (value.courtCount === undefined || isFiniteNumber(value.courtCount))

export const parseTournamentSnapshot = (value: unknown): TournamentSnapshot | null => {
  if (!isRecord(value)) return null
  if (value.version !== undefined && value.version !== 1) return null
  if (!Array.isArray(value.players) || !value.players.every(isParticipant)) return null
  if (!Array.isArray(value.rounds) || !value.rounds.every(isRound)) return null
  if (value.participantType !== 'players' && value.participantType !== 'teams') return null
  if (!isFiniteNumber(value.courtCount) || !isFiniteNumber(value.defaultWinningGames)) return null

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
  }
}
