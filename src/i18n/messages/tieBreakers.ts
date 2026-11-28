// Messages of the tieBreakers feature. Keys are prefixed with "tieBreakers"; edit only this file for that feature.
export const tieBreakersEn = {
  tieBreakersLastLoss: 'Last loss',
  tieBreakersLastLossHelp:
    'Participants who never lost, or whose last loss came later, rank higher.',
  tieBreakersGamesWon: 'Games won',
  tieBreakersGamesWonHelp: 'More games (sets) won ranks higher.',
  tieBreakersGamesLost: 'Games lost',
  tieBreakersGamesLostHelp: 'Fewer games (sets) lost ranks higher.',
  tieBreakersPointsScored: 'Points scored',
  tieBreakersPointsScoredHelp: 'More points scored ranks higher.',
  tieBreakersPointsConceded: 'Points conceded',
  tieBreakersPointsConcededHelp: 'Fewer points conceded ranks higher.',
  tieBreakersBuchholz: 'Buchholz',
  tieBreakersBuchholzHelp:
    'Sum of the match points of all opponents. A bye counts as an opponent with 0 points. A higher sum ranks higher.',
  tieBreakersMedianBuchholz: 'Median Buchholz',
  tieBreakersMedianBuchholzHelp:
    'Buchholz without the strongest and the weakest opponent (from three opponents on). A higher value ranks higher.',
  tieBreakersOpponentPerformance: "Opponents' performance",
  tieBreakersOpponentPerformanceHelp:
    'Average match-win percentage of all opponents, each counted with at least 33 %. Byes are ignored. A higher value ranks higher.',
  tieBreakersTitle: 'Tie-breakers',
  tieBreakersIntro:
    'Participants with equal match points are ranked by these criteria, from top to bottom. Remaining ties are decided by name.',
  tieBreakersListLabel: 'Tie-breaker order',
  tieBreakersEmpty: 'No tie-breakers: equal match points are ranked by name.',
  tieBreakersAddLabel: 'Add tie-breaker',
  tieBreakersAdd: 'Add',
  tieBreakersRemove: 'Remove',
  tieBreakersMoveUp: 'Move up',
  tieBreakersMoveDown: 'Move down',
  tieBreakersReset: 'Reset to default',
  tieBreakersOwn: 'Own tie-breakers for this phase',
  tieBreakersAnnounceMoved: '{name} moved to position {position} of {total}',
  tieBreakersAnnounceAdded: '{name} added at position {position}',
  tieBreakersAnnounceRemoved: '{name} removed',
  tieBreakersAnnounceReset: 'Tie-breakers reset to default',
} as const

export const tieBreakersDe: { [Key in keyof typeof tieBreakersEn]: string } = {
  tieBreakersLastLoss: 'Letzte Niederlage',
  tieBreakersLastLossHelp: 'Wer nie oder erst später verloren hat, steht weiter oben.',
  tieBreakersGamesWon: 'Gewonnene Sätze',
  tieBreakersGamesWonHelp: 'Mehr gewonnene Sätze stehen weiter oben.',
  tieBreakersGamesLost: 'Verlorene Sätze',
  tieBreakersGamesLostHelp: 'Weniger verlorene Sätze stehen weiter oben.',
  tieBreakersPointsScored: 'Erzielte Punkte',
  tieBreakersPointsScoredHelp: 'Mehr erzielte Punkte stehen weiter oben.',
  tieBreakersPointsConceded: 'Kassierte Punkte',
  tieBreakersPointsConcededHelp: 'Weniger kassierte Punkte stehen weiter oben.',
  tieBreakersBuchholz: 'Buchholz',
  tieBreakersBuchholzHelp:
    'Summe der Matchpunkte aller Gegner. Ein Freilos zählt als Gegner mit 0 Punkten. Eine höhere Summe steht weiter oben.',
  tieBreakersMedianBuchholz: 'Median-Buchholz',
  tieBreakersMedianBuchholzHelp:
    'Buchholz ohne den stärksten und den schwächsten Gegner (ab drei Gegnern). Ein höherer Wert steht weiter oben.',
  tieBreakersOpponentPerformance: 'Gegnerleistung',
  tieBreakersOpponentPerformanceHelp:
    'Durchschnittliche Siegquote aller Gegner, jeder mindestens mit 33 % gezählt. Freilose werden ignoriert. Ein höherer Wert steht weiter oben.',
  tieBreakersTitle: 'Tie-Breaker',
  tieBreakersIntro:
    'Teilnehmende mit gleichen Matchpunkten werden nach diesen Kriterien von oben nach unten gereiht. Bleibt ein Gleichstand, entscheidet der Name.',
  tieBreakersListLabel: 'Reihenfolge der Tie-Breaker',
  tieBreakersEmpty: 'Keine Tie-Breaker: Bei gleichen Matchpunkten entscheidet der Name.',
  tieBreakersAddLabel: 'Tie-Breaker hinzufügen',
  tieBreakersAdd: 'Hinzufügen',
  tieBreakersRemove: 'Entfernen',
  tieBreakersMoveUp: 'Nach oben',
  tieBreakersMoveDown: 'Nach unten',
  tieBreakersReset: 'Auf Standard zurücksetzen',
  tieBreakersOwn: 'Eigene Tie-Breaker für diese Phase',
  tieBreakersAnnounceMoved: '{name} steht jetzt an Position {position} von {total}',
  tieBreakersAnnounceAdded: '{name} an Position {position} hinzugefügt',
  tieBreakersAnnounceRemoved: '{name} entfernt',
  tieBreakersAnnounceReset: 'Tie-Breaker auf Standard zurückgesetzt',
}
