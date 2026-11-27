import type { en } from './en'
import { coreDe } from './messages/core'
import { sportsDe } from './messages/sports'
import { tieBreakersDe } from './messages/tieBreakers'
import { swissDe } from './messages/swiss'
import { phasesDe } from './messages/phases'
import { groupsDe } from './messages/groups'
import { eliminationDe } from './messages/elimination'
import { doubleEliminationDe } from './messages/doubleElimination'
import { placementDe } from './messages/placement'
import { teamsDe } from './messages/teams'
import { libraryDe } from './messages/library'

type Translation = { [Key in keyof typeof en]: string }

export const de: Translation = {
  ...coreDe,
  ...sportsDe,
  ...tieBreakersDe,
  ...swissDe,
  ...phasesDe,
  ...groupsDe,
  ...eliminationDe,
  ...doubleEliminationDe,
  ...placementDe,
  ...teamsDe,
  ...libraryDe,
}
