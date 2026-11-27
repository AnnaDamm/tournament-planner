import { createDefaultSettingsParts } from '../defaults'
import { createId } from '../ids'
import type { TournamentSnapshot } from '../types'
import { isRecord } from './guards'
import { migrateV1ToV2 } from './migrate'
import { parseV1Snapshot } from './v1'
import { parseV2Snapshot } from './v2'

export const getDefaultScheduledStart = () => {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`
}

/** Accepts v1 (migrated) and v2 snapshots; null for everything else. */
export const parseTournamentSnapshot = (value: unknown): TournamentSnapshot | null => {
  if (!isRecord(value)) return null
  if (value.version === 2) return parseV2Snapshot(value)
  const v1 = parseV1Snapshot(value)
  return v1 ? migrateV1ToV2(v1) : null
}

export const createEmptyTournamentSnapshot = (isViewer = false): TournamentSnapshot => ({
  version: 2,
  id: createId(),
  tournamentName: 'Tourny',
  players: [],
  rounds: [],
  participantType: 'players',
  courtCount: 1,
  expectedDurationMinutes: 25,
  breakBetweenMatchesMinutes: 5,
  scheduledStart: isViewer ? '' : getDefaultScheduledStart(),
  ...createDefaultSettingsParts(),
})
