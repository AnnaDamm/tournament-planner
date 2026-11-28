import { GeneralSection } from './GeneralSection'
import { PhasesSection } from './PhasesSection'
import { ScheduleSection } from './ScheduleSection'
import { ScoringSection } from './ScoringSection'
import { TieBreakersSection } from './TieBreakersSection'
import type { SettingsSection } from './types'

export type { SettingsSection, SettingsSectionProps } from './types'

// Append-only: one import line and one entry line per section. The order is fixed by `order`
// (general 10, schedule 20, scoring 30, phases 40, tieBreakers 50, teams 60).
export const settingsSections: SettingsSection[] = [
  { id: 'general', order: 10, Component: GeneralSection },
  { id: 'schedule', order: 20, Component: ScheduleSection },
  { id: 'scoring', order: 30, Component: ScoringSection },
  { id: 'phases', order: 40, Component: PhasesSection },
  { id: 'tieBreakers', order: 50, Component: TieBreakersSection },
]
