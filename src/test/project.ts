import { isUnknownParticipantId, type Match, type Participant, type Round } from './legacyApi'

type RankingLike = Participant & {
  setsWon?: number
  setsLost?: number
  lastLossRound?: number
}

const side = (id: string) => (isUnknownParticipantId(id) ? '?' : id)

/** Stable projection of a round: pairs, bye and unknown placeholder positions. */
export const projectRound = (round: Round) => ({
  number: round.number,
  bye: round.bye ? side(round.bye) : null,
  pairs: round.matches.map((item) => [side(item.a), side(item.b)]),
  unknown: round.matches.flatMap((item, index) =>
    [
      isUnknownParticipantId(item.a) ? `${index}:a` : '',
      isUnknownParticipantId(item.b) ? `${index}:b` : '',
    ].filter(Boolean),
  ),
})

export const projectRounds = (rounds: Round[]) => rounds.map(projectRound)

/** Ranking ids with the fields that decide the order. */
export const projectRanking = (ranking: RankingLike[]) =>
  ranking.map((item) => ({
    id: item.id,
    wins: item.wins,
    losses: item.losses,
    setsWon: item.setsWon ?? 0,
    setsLost: item.setsLost ?? 0,
    scored: item.scored,
    conceded: item.conceded,
    lastLossRound: item.lastLossRound ?? 0,
  }))

export const projectCourts = (rounds: Round[]) =>
  Object.fromEntries(
    rounds.flatMap((item) =>
      item.matches.map(
        (entry: Match, index) => [`${item.number}:${index}`, entry.court ?? null] as const,
      ),
    ),
  )

export const projectPredictedStarts = (rounds: Round[]) =>
  Object.fromEntries(
    rounds.flatMap((item) =>
      item.matches.map(
        (entry: Match, index) => [`${item.number}:${index}`, entry.predictedStart ?? null] as const,
      ),
    ),
  )

export const projectStartedAt = (rounds: Round[]) =>
  Object.fromEntries(rounds.map((item) => [item.number, item.startedAt ?? null] as const))
