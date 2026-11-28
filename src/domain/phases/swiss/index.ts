import { rankParticipants } from '../../ranking/rank'
import { isRoundComplete } from '../../schedule/courts'
import type { PhaseContext, PhaseMode, Placement } from '../types'
import { parseSwissConfig, type SwissConfig } from './config'
import { fillUnknownRound, rerollBye } from './pairing'
import { fillDanishUnknown } from './danish'
import { getSwissPlanner } from './variants'
import type { Round } from '../../types'

type Swiss = PhaseContext<SwissConfig>

const previousRounds = (p: Swiss, round: Round) =>
  p.rounds.filter((item) => item.number < round.number)

const getPlanner = (p: Swiss) => getSwissPlanner(p.phase.config)

export const swissMode: PhaseMode<SwissConfig> = {
  id: 'swiss',
  labelKey: 'swissMode',
  capabilities: {
    manualRounds: true,
    reroll: true,
    rerollBye: true,
    swapParticipants: true,
    fillUnknown: true,
  },
  defaultConfig: () => ({ variant: 'standard' }),
  parseConfig: parseSwissConfig,
  initPhase: () => [],
  createRound: (p, number) => {
    const previous = p.rounds.at(-1)
    return {
      number,
      phaseId: p.phase.id,
      bye: null,
      // Note: round.format.gamePoints is informational only; the bye credit always uses
      // ctx.defaultFormat (the tournament default), as before.
      format: previous?.format ?? p.phase.format ?? p.ctx.scoring.format,
      matches: [],
    }
  },
  planRound: (p, round, opts) => {
    const previous = previousRounds(p, round)
    return getPlanner(p)(
      p.entrants,
      previous,
      { roundNumber: round.number, isFirstRound: previous.length === 0 },
      opts?.preferredBye,
      p.ctx,
    )
  },
  fillUnknown: (p, round) =>
    (p.phase.config.variant === 'danish' ? fillDanishUnknown : fillUnknownRound)(
      round,
      p.entrants,
      previousRounds(p, round),
      p.ctx,
    ),
  rerollBye: (p, round) => {
    const rounds = [...previousRounds(p, round), round]
    return rerollBye(p.entrants, rounds, round.number, p.ctx).at(-1)!
  },
  isComplete: (p) =>
    p.rounds.length > 0 && p.rounds.every((round) => isRoundComplete(p.ctx.rules, round)),
  getPlacements: (p): Placement[] =>
    rankParticipants(p.entrants, p.rounds, p.ctx).map((player, index) => ({
      participantId: player.id,
      place: index + 1,
    })),
}
