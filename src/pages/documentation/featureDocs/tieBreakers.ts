import type { DocPage } from '../content'

// Documentation pages of the tieBreakers feature; getDocs inserts them before the limitations page.
export const tieBreakersDocs: { en: DocPage[]; de: DocPage[] } = {
  en: [
    {
      slug: 'tie-breakers',
      title: 'Tie-breakers',
      summary: 'How participants with equal match points are ranked, and how to configure it.',
      sections: [
        {
          title: 'How the ranking works',
          text: [
            'Participants are ranked by match points first. Participants with equal match points are separated by the tie-breakers in the configured order; if they are still equal, the name decides.',
            'The default list reproduces the ranking of earlier versions exactly: last loss, games won, games lost, points scored, points conceded. Existing tournaments therefore keep their order.',
          ],
        },
        {
          title: 'Configure the order',
          text: [
            'Open Tournament settings and use the Tie-breakers section. Add a tie-breaker, remove it, or move it up or down with the arrow buttons (they work with the keyboard; the new position is announced). Reset to default restores the original list. Changes apply with Save.',
            'Each phase can have its own list: enable "Own tie-breakers for this phase" in the phase card. Without it, the tournament list applies. Swiss pairing uses the ranking and therefore the configured tie-breakers. The table shows a column for every active Buchholz-based tie-breaker.',
          ],
        },
        {
          title: 'Available tie-breakers',
          items: [
            'Buchholz: the sum of the match points of all opponents. A bye counts as an opponent with 0 points; a rematch counts twice.',
            'Median Buchholz: the Buchholz without the strongest and the weakest opponent. With fewer than three opponents it equals the Buchholz.',
            "Opponents' performance: the average match-win percentage (match points divided by the points for all matches won) of all opponents. Each opponent counts with at least 33 %. Byes are ignored.",
            'Last loss, games won, games lost, points scored, points conceded: the criteria of the default ranking.',
          ],
        },
      ],
    },
  ],
  de: [
    {
      slug: 'tie-breakers',
      title: 'Tie-Breaker',
      summary:
        'Wie Teilnehmende mit gleichen Matchpunkten gereiht werden und wie man das einstellt.',
      sections: [
        {
          title: 'So funktioniert die Rangliste',
          text: [
            'Zuerst entscheiden die Matchpunkte. Bei gleichen Matchpunkten entscheiden die Tie-Breaker in der eingestellten Reihenfolge; bleibt es gleich, entscheidet der Name.',
            'Die Standardliste entspricht genau der Rangliste früherer Versionen: letzte Niederlage, gewonnene Sätze, verlorene Sätze, erzielte Punkte, kassierte Punkte. Bestehende Turniere behalten dadurch ihre Reihenfolge.',
          ],
        },
        {
          title: 'Reihenfolge einstellen',
          text: [
            'Öffne die Turniereinstellungen und nutze den Abschnitt Tie-Breaker. Füge einen Tie-Breaker hinzu, entferne ihn oder verschiebe ihn mit den Pfeiltasten-Schaltflächen (auch per Tastatur bedienbar; die neue Position wird angesagt). Auf Standard zurücksetzen stellt die ursprüngliche Liste wieder her. Änderungen gelten nach Speichern.',
            'Jede Phase kann eine eigene Liste haben: Aktiviere „Eigene Tie-Breaker für diese Phase“ in der Phasenkarte. Ohne diese Option gilt die Liste des Turniers. Die Swiss-Paarung nutzt die Rangliste und damit die eingestellten Tie-Breaker. Die Tabelle zeigt für jeden aktiven Buchholz-Tie-Breaker eine Spalte.',
          ],
        },
        {
          title: 'Verfügbare Tie-Breaker',
          items: [
            'Buchholz: Summe der Matchpunkte aller Gegner. Ein Freilos zählt als Gegner mit 0 Punkten; ein Wiedersehen zählt doppelt.',
            'Median-Buchholz: Buchholz ohne den stärksten und den schwächsten Gegner. Bei weniger als drei Gegnern entspricht es dem Buchholz.',
            'Gegnerleistung: durchschnittliche Siegquote (Matchpunkte geteilt durch die Punkte für lauter Siege) aller Gegner. Jeder Gegner zählt mit mindestens 33 %. Freilose werden ignoriert.',
            'Letzte Niederlage, gewonnene Sätze, verlorene Sätze, erzielte Punkte, kassierte Punkte: die Kriterien der Standard-Rangliste.',
          ],
        },
      ],
    },
  ],
}
