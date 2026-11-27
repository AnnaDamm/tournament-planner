import { getMatchSideIds } from '../participants'
import type { ParticipantId } from '../types'
import type { CountedResult, TieBreaker } from './types'

/** Round number of the last loss per participant; 0 = never lost. */
export const getLastLossRounds = (participantIds: ParticipantId[], results: CountedResult[]) => {
  const lastLossRounds = new Map(participantIds.map((id) => [id, 0]))
  results.forEach((entry) => {
    if (entry.kind !== 'match' || entry.result.outcome === 'draw') return
    const losers = getMatchSideIds(entry.match, entry.result.outcome === 'a' ? 'b' : 'a')
    losers.forEach((id) => lastLossRounds.set(id, entry.roundNumber))
  })
  return lastLossRounds
}

const fromStandings =
  (
    pick: (standing: {
      setsWon: number
      setsLost: number
      scored: number
      conceded: number
    }) => number,
  ) =>
  (input: Parameters<TieBreaker['compute']>[0]) =>
    new Map(
      input.participants.map((player) => [
        player.id,
        input.standings.has(player.id) ? pick(input.standings.get(player.id)!) : 0,
      ]),
    )

export const lastLoss: TieBreaker = {
  id: 'lastLoss',
  labelKey: 'tieBreakersLastLoss',
  descriptionKey: 'tieBreakersLastLossHelp',
  compute: (input) => {
    const lastLossRounds = getLastLossRounds(
      input.participants.map((player) => player.id),
      input.results,
    )
    return new Map([...lastLossRounds].map(([id, round]) => [id, round === 0 ? Infinity : round]))
  },
}

export const gamesWon: TieBreaker = {
  id: 'gamesWon',
  labelKey: 'tieBreakersGamesWon',
  descriptionKey: 'tieBreakersGamesWonHelp',
  compute: fromStandings((standing) => standing.setsWon),
}

export const gamesLost: TieBreaker = {
  id: 'gamesLost',
  labelKey: 'tieBreakersGamesLost',
  descriptionKey: 'tieBreakersGamesLostHelp',
  compute: fromStandings((standing) => -standing.setsLost),
}

export const pointsScored: TieBreaker = {
  id: 'pointsScored',
  labelKey: 'tieBreakersPointsScored',
  descriptionKey: 'tieBreakersPointsScoredHelp',
  compute: fromStandings((standing) => standing.scored),
}

export const pointsConceded: TieBreaker = {
  id: 'pointsConceded',
  labelKey: 'tieBreakersPointsConceded',
  descriptionKey: 'tieBreakersPointsConcededHelp',
  compute: fromStandings((standing) => -standing.conceded),
}
