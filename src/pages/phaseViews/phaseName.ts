import { t } from '../../i18n'
import { getPhaseMode } from '../../domain/phases/registry'
import type { Phase } from '../../domain/types'

/** The name of a phase; the label of its mode when it has no name. */
export const getPhaseName = (phase: Phase) => {
  const mode = getPhaseMode(phase.mode)
  return phase.name.trim() || (mode ? t(mode.labelKey) : phase.mode)
}
