import type { PhaseView } from '../types'
import { EliminationConfigEditor } from './EliminationConfigEditor'
import { EliminationRoundsView } from './EliminationRoundsView'
import { EliminationStandings } from './EliminationStandings'

export const singleEliminationView: PhaseView = {
  ConfigEditor: EliminationConfigEditor,
  RoundsView: EliminationRoundsView,
  StandingsView: EliminationStandings,
  start: { labelKey: 'eliminationStartLabel', helpKey: 'eliminationStartHelp' },
}
