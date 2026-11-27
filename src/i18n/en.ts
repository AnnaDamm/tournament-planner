import { coreEn } from './messages/core'
import { sportsEn } from './messages/sports'
import { tieBreakersEn } from './messages/tieBreakers'
import { swissEn } from './messages/swiss'
import { phasesEn } from './messages/phases'
import { groupsEn } from './messages/groups'
import { eliminationEn } from './messages/elimination'
import { doubleEliminationEn } from './messages/doubleElimination'
import { placementEn } from './messages/placement'
import { teamsEn } from './messages/teams'
import { libraryEn } from './messages/library'

export const en = {
  ...coreEn,
  ...sportsEn,
  ...tieBreakersEn,
  ...swissEn,
  ...phasesEn,
  ...groupsEn,
  ...eliminationEn,
  ...doubleEliminationEn,
  ...placementEn,
  ...teamsEn,
  ...libraryEn,
} as const
