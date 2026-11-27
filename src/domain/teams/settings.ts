import type { TeamSettings } from '../types'

export const DEFAULT_TEAM_SETTINGS: TeamSettings = { mode: 'fixed', teamSize: 2 }

export const parseTeamSettings = (raw: unknown): TeamSettings => {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_TEAM_SETTINGS }
  const { mode, teamSize } = raw as Record<string, unknown>
  return {
    mode: mode === 'drawOnce' || mode === 'drawEachRound' ? mode : 'fixed',
    teamSize:
      typeof teamSize === 'number' && Number.isFinite(teamSize)
        ? Math.min(16, Math.max(2, Math.floor(teamSize)))
        : DEFAULT_TEAM_SETTINGS.teamSize,
  }
}
