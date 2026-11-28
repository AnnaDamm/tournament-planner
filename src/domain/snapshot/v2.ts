import { createDefaultSettingsParts, DEFAULT_PHASE_ID } from '../defaults'
import { clampFormat } from '../format'
import { createId } from '../ids'
import { getPhaseMode } from '../phases/registry'
import { DEFAULT_TIE_BREAKERS } from '../ranking/registry'
import type { TieBreakerId } from '../ranking/types'
import { getSport } from '../sports/registry'
import type { SportId } from '../sports/types'
import { parseTeamSettings } from '../teams/settings'
import type {
  Match,
  Participant,
  Phase,
  PhaseModeId,
  PhaseTransition,
  Round,
  ScoringSettings,
  TournamentSnapshot,
} from '../types'
import { isFiniteNumber, isRecord } from './guards'
import { isV1Match } from './v1'

const sportIds: SportId[] = [
  'other',
  'badminton',
  'volleyball',
  'football',
  'esports',
  'snooker',
  'darts',
]
const tieBreakerIds: TieBreakerId[] = [
  'lastLoss',
  'gamesWon',
  'gamesLost',
  'pointsScored',
  'pointsConceded',
  'buchholz',
  'medianBuchholz',
  'opponentPerformance',
]
const modeIds: PhaseModeId[] = [
  'swiss',
  'roundRobin',
  'singleElimination',
  'doubleElimination',
  'placement',
]

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const parseParticipant = (value: unknown): Participant | null => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string')
    return null
  if (value.withdrawn !== undefined && typeof value.withdrawn !== 'boolean') return null
  const members = value.members
  if (
    members !== undefined &&
    !(
      Array.isArray(members) &&
      members.every(
        (member) =>
          isRecord(member) && typeof member.id === 'string' && typeof member.name === 'string',
      )
    )
  )
    return null
  return {
    id: value.id,
    name: value.name,
    ...(value.withdrawn === undefined ? {} : { withdrawn: value.withdrawn as boolean }),
    ...(members === undefined ? {} : { members: members as Participant['members'] }),
  }
}

const isMatch = (value: unknown): value is Match => {
  if (!isV1Match(value)) return false
  const extra = value as unknown as Record<string, unknown>
  return (
    (extra.outcome === undefined || ['a', 'b', 'draw'].includes(extra.outcome as string)) &&
    (extra.lineupA === undefined || isStringArray(extra.lineupA)) &&
    (extra.lineupB === undefined || isStringArray(extra.lineupB)) &&
    (extra.format === undefined || isRecord(extra.format))
  )
}

const parseScoring = (raw: unknown): ScoringSettings => {
  const defaults = createDefaultSettingsParts().scoring
  if (!isRecord(raw)) return defaults
  const sport = sportIds.includes(raw.sport as SportId) ? (raw.sport as SportId) : 'other'
  const base = getSport(sport).defaults
  const points = isRecord(raw.matchPoints) ? raw.matchPoints : {}
  const point = (key: 'win' | 'draw' | 'loss') =>
    isFiniteNumber(points[key]) ? points[key] : base.matchPoints[key]
  return {
    sport,
    format: clampFormat(isRecord(raw.format) ? raw.format : undefined, base.format),
    matchPoints: { win: point('win'), draw: point('draw'), loss: point('loss') },
  }
}

const parseEntry = (raw: unknown): PhaseTransition => {
  if (isRecord(raw) && isFiniteNumber(raw.count)) {
    // A phase needs at least two entrants to ever complete.
    const count = Math.max(2, Math.floor(raw.count))
    if (raw.kind === 'topN') return { kind: 'topN', count }
    if (raw.kind === 'topNPerGroup') {
      return {
        kind: 'topNPerGroup',
        count,
        ...(isFiniteNumber(raw.bestRemaining)
          ? { bestRemaining: Math.max(0, Math.floor(raw.bestRemaining)) }
          : {}),
      }
    }
  }
  return { kind: 'all' }
}

const parsePhase = (raw: unknown): Phase | null => {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !modeIds.includes(raw.mode as PhaseModeId))
    return null
  const mode = getPhaseMode(raw.mode as PhaseModeId)
  const config = mode?.parseConfig(raw.config)
  if (!mode || !config) return null
  return {
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : '',
    mode: mode.id,
    config,
    ...(isRecord(raw.format) ? { format: clampFormat(raw.format) } : {}),
    ...(isStringArray(raw.tieBreakers)
      ? {
          tieBreakers: raw.tieBreakers.filter((id): id is TieBreakerId =>
            tieBreakerIds.includes(id as TieBreakerId),
          ),
        }
      : {}),
    entry: parseEntry(raw.entry),
    ...(isStringArray(raw.entrants) ? { entrants: raw.entrants } : {}),
    ...(typeof raw.startedAt === 'string' ? { startedAt: raw.startedAt } : {}),
  }
}

const parseRound = (
  raw: unknown,
  firstPhaseId: string,
  fallback: ScoringSettings['format'],
): Round | null => {
  if (
    !isRecord(raw) ||
    !isFiniteNumber(raw.number) ||
    !Array.isArray(raw.matches) ||
    !raw.matches.every(isMatch) ||
    (raw.predictedStart !== undefined && typeof raw.predictedStart !== 'string') ||
    (raw.courtCount !== undefined && !isFiniteNumber(raw.courtCount))
  )
    return null
  // Hand-edited or legacy documents may still carry winningGames on the round.
  const legacyGames = isFiniteNumber(raw.winningGames) ? raw.winningGames : fallback.winningGames
  const format = clampFormat(isRecord(raw.format) ? raw.format : undefined, {
    winningGames: legacyGames,
  })
  return {
    number: raw.number,
    phaseId: typeof raw.phaseId === 'string' ? raw.phaseId : firstPhaseId,
    ...(isRecord(raw.title) && typeof raw.title.key === 'string'
      ? { title: raw.title as unknown as Round['title'] }
      : {}),
    ...(typeof raw.predictedStart === 'string' ? { predictedStart: raw.predictedStart } : {}),
    ...(typeof raw.startedAt === 'string' ? { startedAt: raw.startedAt } : {}),
    ...(raw.bye === null || typeof raw.bye === 'string' ? { bye: raw.bye as string | null } : {}),
    format,
    ...(isFiniteNumber(raw.courtCount) ? { courtCount: raw.courtCount } : {}),
    matches: raw.matches,
    ...(Array.isArray(raw.standings) ? { standings: raw.standings as Round['standings'] } : {}),
  }
}

export const parseV2Snapshot = (value: Record<string, unknown>): TournamentSnapshot | null => {
  if (value.version !== 2) return null
  const tournamentName = typeof value.tournamentName === 'string' ? value.tournamentName.trim() : ''
  if (!tournamentName) return null
  if (value.participantType !== 'players' && value.participantType !== 'teams') return null
  if (!isFiniteNumber(value.courtCount)) return null
  if (!Array.isArray(value.players) || !Array.isArray(value.rounds)) return null

  const players = value.players.map(parseParticipant)
  if (players.some((player) => !player)) return null

  const phases =
    value.phases === undefined ? createDefaultSettingsParts().phases : parsePhases(value.phases)
  if (!phases) return null
  const scoring = parseScoring(value.scoring)
  const rounds = value.rounds.map((round) =>
    parseRound(round, phases[0]?.id ?? DEFAULT_PHASE_ID, scoring.format),
  )
  if (rounds.some((round) => !round || !phases.some((phase) => phase.id === round.phaseId)))
    return null

  const tieBreakers = isStringArray(value.tieBreakers)
    ? value.tieBreakers.filter((id): id is TieBreakerId =>
        tieBreakerIds.includes(id as TieBreakerId),
      )
    : []
  return {
    version: 2,
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    tournamentName,
    participantType: value.participantType,
    courtCount: Math.max(1, Math.floor(value.courtCount)),
    expectedDurationMinutes: isFiniteNumber(value.expectedDurationMinutes)
      ? Math.max(1, Math.floor(value.expectedDurationMinutes))
      : 25,
    breakBetweenMatchesMinutes: isFiniteNumber(value.breakBetweenMatchesMinutes)
      ? Math.max(0, Math.floor(value.breakBetweenMatchesMinutes))
      : 5,
    scheduledStart: typeof value.scheduledStart === 'string' ? value.scheduledStart : '',
    scoring,
    tieBreakers: tieBreakers.length > 0 ? tieBreakers : [...DEFAULT_TIE_BREAKERS],
    teams: parseTeamSettings(value.teams),
    phases,
    players: players as Participant[],
    rounds: rounds as Round[],
  }
}

const parsePhases = (raw: unknown): Phase[] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const phases = raw.map(parsePhase)
  return phases.some((phase) => !phase) ? null : (phases as Phase[])
}
