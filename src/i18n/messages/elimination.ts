// Messages of the elimination feature. Keys are prefixed with "elimination"; edit only this file for that feature.
export const eliminationEn = {
  eliminationSingleMode: 'Single elimination',
  eliminationFinal: 'Final',
  eliminationSemifinal: 'Semifinal',
  eliminationQuarterfinal: 'Quarterfinal',
  eliminationRoundOf: 'Round of {size}',
  eliminationThirdPlace: 'Match for third place',
  eliminationSeeding: 'Seeding',
  eliminationSeedingHelp:
    'With a field that is not a power of two, the best seeds skip the first round (bye).',
  eliminationSeedingStandard: 'By the order of the table (best seed plays the weakest)',
  eliminationSeedingRandom: 'Drawn randomly when the bracket is created',
  eliminationThirdPlaceMatch: 'Play a match for third place',
  eliminationFormats: 'Format of the last rounds',
  eliminationFormatsHelp:
    'Give the final, the semifinals or the quarterfinals their own number of games to win. All other rounds use the format of the phase.',
  eliminationOwnFormat: '{round}: own format',
  eliminationStartLabel: 'Create bracket',
  eliminationStartHelp:
    'Create the bracket when all participants are registered. The seeding is fixed afterwards.',
  eliminationBracket: 'Bracket',
  eliminationByes: 'Bye (enter the next round directly): {names}',
  eliminationWinnerMark: 'winner',
  eliminationPlacements: 'Placements of the knockout phase',
  eliminationPlace: 'Place',
  eliminationParticipant: 'Participant',
  eliminationChangeBlocked:
    'This change would alter who plays the next match, which already has a result. Clear the result of the follow-up match first.',
} as const

export const eliminationDe: { [Key in keyof typeof eliminationEn]: string } = {
  eliminationSingleMode: 'K.-o.-System',
  eliminationFinal: 'Finale',
  eliminationSemifinal: 'Halbfinale',
  eliminationQuarterfinal: 'Viertelfinale',
  eliminationRoundOf: 'Runde der letzten {size}',
  eliminationThirdPlace: 'Spiel um Platz 3',
  eliminationSeeding: 'Setzung',
  eliminationSeedingHelp:
    'Ist die Teilnehmerzahl keine Zweierpotenz, überspringen die besten Gesetzten die erste Runde (Freilos).',
  eliminationSeedingStandard: 'Nach Tabellenreihenfolge (Bester gegen Schwächsten)',
  eliminationSeedingRandom: 'Beim Erstellen des Turnierbaums zufällig gelost',
  eliminationThirdPlaceMatch: 'Spiel um Platz 3 austragen',
  eliminationFormats: 'Format der letzten Runden',
  eliminationFormatsHelp:
    'Finale, Halbfinale oder Viertelfinale erhalten eine eigene Anzahl zum Sieg nötiger Gewinnsätze. Alle anderen Runden nutzen das Format der Phase.',
  eliminationOwnFormat: '{round}: eigenes Format',
  eliminationStartLabel: 'Turnierbaum erstellen',
  eliminationStartHelp:
    'Erstelle den Turnierbaum, sobald alle Teilnehmenden angemeldet sind. Die Setzung steht danach fest.',
  eliminationBracket: 'Turnierbaum',
  eliminationByes: 'Freilos (direkt in der nächsten Runde): {names}',
  eliminationWinnerMark: 'Sieger',
  eliminationPlacements: 'Platzierungen der K.-o.-Phase',
  eliminationPlace: 'Platz',
  eliminationParticipant: 'Teilnehmende',
  eliminationChangeBlocked:
    'Diese Änderung würde ändern, wer das nächste Spiel bestreitet, das bereits ein Ergebnis hat. Leere zuerst das Ergebnis des Folgespiels.',
}
