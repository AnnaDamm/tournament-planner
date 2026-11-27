import type { ComponentType } from 'react'

/** Optional UI of a phase mode; a mode without an entry uses the defaults. */
export type PhaseView = {
  /** Mode-specific part of the phase settings. */
  ConfigEditor?: ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
    disabled: boolean
  }>
  /** Replaces the default ranking table of the phase. */
  StandingsView?: ComponentType<{ phaseId: string }>
  /** Extra view above the round list of the phase (for example a bracket). */
  RoundsView?: ComponentType<{ phaseId: string }>
}
