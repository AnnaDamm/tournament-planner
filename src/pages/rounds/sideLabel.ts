import { tf } from '../../i18n'
import { isUnknownParticipantId } from '../../domain/ids'
import type { Match, MatchSource } from '../../domain/types'

export type SideLabelContext = {
  name: (id: string) => string
  matchLabel: (matchId: string) => string
}

const getSourceLabel = (source: MatchSource, context: SideLabelContext) => {
  if (source.kind === 'winner' || source.kind === 'loser') {
    const match = context.matchLabel(source.matchId)
    return tf(source.kind === 'winner' ? 'phasesSourceWinner' : 'phasesSourceLoser', { match })
  }
  if (source.kind === 'seed') return tf('phasesSourceSeed', { seed: source.seed })
  if (source.kind === 'groupRank') {
    return tf('phasesSourceGroup', { group: source.group, rank: source.rank })
  }
  return ''
}

/**
 * What to show for one side of a match: the drawn lineup ("Anna & Ben"), the origin of a side
 * that is not known yet ("Winner of M3"), or the participant name.
 */
export const getSideLabel = (match: Match, side: 'a' | 'b', context: SideLabelContext) => {
  const id = side === 'a' ? match.a : match.b
  const lineup = side === 'a' ? match.lineupA : match.lineupB
  const source = side === 'a' ? match.sourceA : match.sourceB
  if (lineup?.length) return lineup.map((member) => context.name(member)).join(' & ')
  if (source && isUnknownParticipantId(id)) return getSourceLabel(source, context)
  return context.name(id)
}
