import type { ComponentType } from 'react'
import type { TournamentSettings } from '../../../domain/types'

export type SettingsSectionProps = {
  draft: TournamentSettings
  setDraft: (update: (draft: TournamentSettings) => TournamentSettings) => void
  /** Any round started: structure-changing fields are locked. */
  started: boolean
}

export type SettingsSection = {
  id: string
  order: number
  Component: ComponentType<SettingsSectionProps>
}
