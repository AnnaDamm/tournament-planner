import { describe, expect, it } from 'vitest'
import { getSideLabel } from './sideLabel'
import type { Match } from '../../domain/types'

const match = (extra: Partial<Match> = {}): Match => ({
  id: 'm4',
  a: 'p1',
  b: '__unknown__:3:0',
  scoreA: '',
  scoreB: '',
  ...extra,
})

const context = {
  name: (id: string) => ({ p1: 'Anna', p2: 'Ben' })[id as 'p1'] ?? '?',
  matchLabel: (id: string) => (id === 'mx' ? 'M3' : id),
}

describe('getSideLabel', () => {
  it('shows the participant name for known sides', () => {
    expect(getSideLabel(match(), 'a', context)).toBe('Anna')
  })

  it('describes the origin of sides that are not known yet', () => {
    const open = match({
      sourceA: { kind: 'winner', matchId: 'mx' },
      sourceB: { kind: 'loser', matchId: 'mx' },
      a: '__unknown__:3:1',
    })
    expect(getSideLabel(open, 'a', context)).toBe('Winner of M3')
    expect(getSideLabel(open, 'b', context)).toBe('Loser of M3')
    expect(
      getSideLabel(
        match({ b: '__unknown__:3:2', sourceB: { kind: 'seed', seed: 4 } }),
        'b',
        context,
      ),
    ).toBe('Seed 4')
    expect(
      getSideLabel(
        match({ b: '__unknown__:3:2', sourceB: { kind: 'groupRank', group: 'A', rank: 1 } }),
        'b',
        context,
      ),
    ).toBe('Group A #1')
  })

  it('joins the names of a drawn lineup', () => {
    expect(getSideLabel(match({ lineupA: ['p1', 'p2'] }), 'a', context)).toBe('Anna & Ben')
  })

  it('ignores a source once the side is known', () => {
    expect(getSideLabel(match({ sourceA: { kind: 'winner', matchId: 'mx' } }), 'a', context)).toBe(
      'Anna',
    )
  })
})
