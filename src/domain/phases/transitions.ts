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
      // Never fewer than two entrants (when that many are available): a phase with a single
      // entrant could only play a bye and never complete. The parser and the editor clamp too,
      // but a resolver must not trust the stored count (hand-edited or older data).
      transition.kind === 'topN' ? Math.max(2, transition.count) : undefined,
    ),
}
