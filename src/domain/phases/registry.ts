import type { PhaseModeId } from '../types'
import { swissMode } from './swiss'
import type { PhaseMode } from './types'

// Append-only: one import line and one entry line per mode.
// eslint-disable-next-line typescript/no-explicit-any
export const phaseModes: Partial<Record<PhaseModeId, PhaseMode<any>>> = {
  swiss: swissMode,
}

export const getPhaseMode = (id: PhaseModeId): PhaseMode<any> | undefined => phaseModes[id]
