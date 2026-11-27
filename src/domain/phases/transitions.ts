import type { PhaseTransition } from '../types'
import type { TransitionResolver } from './types'

const notWithdrawn: TransitionResolver = (prev, placements) =>
  placements
    .map((placement) => placement.participantId)
    .filter((id) => !prev.entrants.find((player) => player.id === id)?.withdrawn)

// Append-only: one entry per transition kind ('topNPerGroup' is added by the group phase).
export const transitionResolvers: Partial<Record<PhaseTransition['kind'], TransitionResolver>> = {
  all: notWithdrawn,
  topN: (prev, placements, transition) =>
    notWithdrawn(prev, placements, transition).slice(
      0,
      transition.kind === 'topN' ? transition.count : undefined,
    ),
}
