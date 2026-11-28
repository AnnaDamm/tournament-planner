import type { DocPage } from '../content'

// Documentation pages of the sports feature; getDocs inserts them before the limitations page.
export const sportsDocs: { en: DocPage[]; de: DocPage[] } = {
  en: [
    {
      slug: 'sports-scoring',
      title: 'Sports and scoring',
      summary: 'Choose a sport to change the scoring rules and the terms used in the app.',
      sections: [
        {
          title: 'Sports',
          text: [
            'The sport in Tournament settings sets the defaults, the way results are entered and the terms (set, goal, map, frame, leg). It is locked once the first round has started.',
          ],
          items: [
            'Volleyball and badminton: best-of-N sets with a point target per set.',
            'Football: one score line per match; draws are possible and a win counts 3 points, a draw 1.',
            'eSports: best-of-N maps; each map only selects its winner, there are no points per map.',
            'Snooker: best-of-N frames with the points of each frame.',
            'Darts: best-of-N legs. Enter the remaining score of both sides per leg; the side at exactly 0 wins the leg. A leg needs exactly one side at 0 and no remaining score above the start score (501 by default).',
            'Other: sets as before. Choose "No sets" as the scoring type to enter only win, draw or loss per match.',
          ],
        },
        {
          title: 'Draws and table points',
          text: [
            'Where the format allows it, matches can end in a draw: football, a fixed number of games per match (for example always two sets, 1:1 is a draw) or matches without sets. Win and draw points are set in Tournament settings; the table then shows draws and table points.',
            'Knockout matches need a winner and never end in a draw.',
          ],
        },
      ],
    },
  ],
  de: [
    {
      slug: 'sports-scoring',
      title: 'Sportarten und Wertung',
      summary: 'Mit der Sportart ändern sich die Wertungsregeln und die Begriffe in der App.',
      sections: [
        {
          title: 'Sportarten',
          text: [
            'Die Sportart in den Turniereinstellungen legt Standardwerte, die Ergebniseingabe und die Begriffe (Satz, Tor, Map, Frame, Leg) fest. Sie ist gesperrt, sobald die erste Runde gestartet wurde.',
          ],
          items: [
            'Volleyball und Badminton: Gewinnsätze mit einer Punktzahl pro Satz.',
            'Fußball: ein Ergebnis pro Begegnung; Unentschieden sind möglich, ein Sieg zählt 3 Punkte, ein Unentschieden 1.',
            'eSports: Gewinn-Maps; jede Map wählt nur den Sieger, es gibt keine Punkte pro Map.',
            'Snooker: Gewinn-Frames mit den Punkten jedes Frames.',
            'Darts: Gewinn-Legs. Pro Leg wird die Restpunktzahl beider Seiten eingetragen; wer genau 0 erreicht, gewinnt das Leg. Ein Leg braucht genau eine Seite bei 0 und keine Restpunktzahl über der Startpunktzahl (standardmäßig 501).',
            'Sonstige: Sätze wie bisher. Mit der Wertungsart „Ohne Sätze“ wird pro Begegnung nur Sieg, Unentschieden oder Niederlage eingetragen.',
          ],
        },
        {
          title: 'Unentschieden und Tabellenpunkte',
          text: [
            'Wo das Format es erlaubt, können Begegnungen unentschieden enden: Fußball, eine feste Anzahl Spiele pro Begegnung (zum Beispiel immer zwei Sätze, 1:1 ist unentschieden) oder Begegnungen ohne Sätze. Punkte für Sieg und Unentschieden werden in den Turniereinstellungen festgelegt; die Tabelle zeigt dann Unentschieden und Tabellenpunkte.',
            'K.-o.-Begegnungen brauchen einen Sieger und enden nie unentschieden.',
          ],
        },
      ],
    },
  ],
}
