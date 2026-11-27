import type { PhaseModeId } from '../../domain/types'
import { swissView } from './swiss/swissView'
import type { PhaseView } from './types'

// Append-only: one import line and one entry line per mode.
export const phaseViews: Partial<Record<PhaseModeId, PhaseView>> = {
  swiss: swissView,
}
