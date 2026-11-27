// Messages of the tieBreakers feature. Keys are prefixed with "tieBreakers"; edit only this file for that feature.
export const tieBreakersEn = {
  tieBreakersLastLoss: 'Last loss',
  tieBreakersLastLossHelp: 'Participants who never lost, or lost earlier, rank higher.',
  tieBreakersGamesWon: 'Games won',
  tieBreakersGamesWonHelp: 'More games (sets) won ranks higher.',
  tieBreakersGamesLost: 'Games lost',
  tieBreakersGamesLostHelp: 'Fewer games (sets) lost ranks higher.',
  tieBreakersPointsScored: 'Points scored',
  tieBreakersPointsScoredHelp: 'More points scored ranks higher.',
  tieBreakersPointsConceded: 'Points conceded',
  tieBreakersPointsConcededHelp: 'Fewer points conceded ranks higher.',
} as const

export const tieBreakersDe: { [Key in keyof typeof tieBreakersEn]: string } = {
  tieBreakersLastLoss: 'Letzte Niederlage',
  tieBreakersLastLossHelp: 'Wer nie oder früher verloren hat, steht weiter oben.',
  tieBreakersGamesWon: 'Gewonnene Sätze',
  tieBreakersGamesWonHelp: 'Mehr gewonnene Sätze stehen weiter oben.',
  tieBreakersGamesLost: 'Verlorene Sätze',
  tieBreakersGamesLostHelp: 'Weniger verlorene Sätze stehen weiter oben.',
  tieBreakersPointsScored: 'Erzielte Punkte',
  tieBreakersPointsScoredHelp: 'Mehr erzielte Punkte stehen weiter oben.',
  tieBreakersPointsConceded: 'Kassierte Punkte',
  tieBreakersPointsConcededHelp: 'Weniger kassierte Punkte stehen weiter oben.',
}
