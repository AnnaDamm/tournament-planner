import type { DocPage } from '../content'

// Documentation pages of the elimination feature; getDocs inserts them before the limitations page.
export const eliminationDocs: { en: DocPage[]; de: DocPage[] } = {
  en: [
    {
      slug: 'single-elimination',
      title: 'Single elimination',
      summary: 'Knock-out brackets with byes, a match for third place and a format per round.',
      sections: [
        {
          title: 'Set up a knock-out phase',
          items: [
            'Open Tournament settings, add a phase (or change the mode of a phase) and choose Single elimination.',
            'Seeding: by the order of the table (the best seed plays the weakest) or drawn randomly when the bracket is created.',
            'Optionally play a match for third place between the two semifinal losers.',
            'Give the final, the semifinals and the quarterfinals their own number of games to win, for example a final over best of 7, semifinals over best of 5 and all earlier rounds over best of 3.',
          ],
          links: [{ label: 'Open Settings', to: '/settings' }],
        },
        {
          title: 'Play the bracket',
          items: [
            'If the knock-out phase is the first phase, open Rounds and select Create bracket once all participants are registered. A later knock-out phase is created by Start next phase.',
            'All rounds exist from the start. Sides that wait for an earlier match read for example "Winner of M3"; the name appears as soon as that result is entered.',
            'If the number of participants is not a power of two, the best seeds receive a bye and enter the second round directly.',
            'A knock-out match always needs a winner. A draw does not advance anybody; enter the result after extra time or penalties.',
            'Pairings of a knock-out phase cannot be rerolled or swapped. Matches with an open side are not assigned to a court.',
          ],
          links: [{ label: 'Open Rounds', to: '/rounds' }],
        },
        {
          title: 'Placements',
          text: [
            'The table of a knock-out phase shows the placements: 1 and 2 for the finalists, 3 and 4 for the semifinal losers (or the result of the match for third place), then shared places such as 5 to 8. Participants who are still playing share the top places until they are eliminated.',
          ],
          links: [{ label: 'Open Table', to: '/table' }],
        },
      ],
    },
  ],
  de: [
    {
      slug: 'single-elimination',
      title: 'K.-o.-System',
      summary: 'Turnierbäume mit Freilosen, Spiel um Platz 3 und eigenem Format pro Runde.',
      sections: [
        {
          title: 'K.-o.-Phase einrichten',
          items: [
            'Öffne die Turniereinstellungen, füge eine Phase hinzu (oder ändere den Modus einer Phase) und wähle K.-o.-System.',
            'Setzung: nach Tabellenreihenfolge (Bester gegen Schwächsten) oder beim Erstellen des Turnierbaums zufällig gelost.',
            'Optional wird ein Spiel um Platz 3 zwischen den beiden Halbfinal-Verlierern ausgetragen.',
            'Finale, Halbfinale und Viertelfinale erhalten eine eigene Anzahl zum Sieg nötiger Gewinnsätze, zum Beispiel Finale über Best of 7, Halbfinale über Best of 5 und alle früheren Runden über Best of 3.',
          ],
          links: [{ label: 'Einstellungen öffnen', to: '/settings' }],
        },
        {
          title: 'Den Turnierbaum spielen',
          items: [
            'Ist die K.-o.-Phase die erste Phase, öffne Runden und wähle Turnierbaum erstellen, sobald alle Teilnehmenden angemeldet sind. Eine spätere K.-o.-Phase wird mit Nächste Phase starten erstellt.',
            'Alle Runden existieren von Anfang an. Seiten, die auf ein früheres Spiel warten, zeigen zum Beispiel „Sieger von M3“; der Name erscheint, sobald dieses Ergebnis eingetragen ist.',
            'Ist die Teilnehmerzahl keine Zweierpotenz, erhalten die besten Gesetzten ein Freilos und steigen direkt in die zweite Runde ein.',
            'Ein K.-o.-Spiel braucht immer einen Sieger. Ein Unentschieden bringt niemanden weiter; trage das Ergebnis nach Verlängerung oder Elfmeterschießen ein.',
            'Paarungen einer K.-o.-Phase können weder neu ausgelost noch getauscht werden. Spiele mit einer offenen Seite werden keinem Platz zugewiesen.',
          ],
          links: [{ label: 'Runden öffnen', to: '/rounds' }],
        },
        {
          title: 'Platzierungen',
          text: [
            'Die Tabelle einer K.-o.-Phase zeigt die Platzierungen: 1 und 2 für die Finalisten, 3 und 4 für die Halbfinal-Verlierer (oder das Ergebnis des Spiels um Platz 3), danach geteilte Plätze wie 5 bis 8. Wer noch im Turnier ist, teilt sich die oberen Plätze, bis er ausscheidet.',
          ],
          links: [{ label: 'Tabelle öffnen', to: '/table' }],
        },
      ],
    },
  ],
}
