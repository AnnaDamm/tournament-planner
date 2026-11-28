import type { DocPage } from '../content'

// Documentation pages of the library feature; getDocs inserts them before the limitations page.
export const libraryDocs: { en: DocPage[]; de: DocPage[] } = {
  en: [
    {
      slug: 'tournament-library',
      title: 'Several tournaments',
      summary: 'Keep several independent tournaments in one browser and switch between them.',
      sections: [
        {
          title: 'The tournament list',
          text: [
            'Open Tournaments in the navigation to see all tournaments saved in this browser. One of them is active: the table, the rounds and the settings always show the active tournament, and live sharing publishes it.',
          ],
          items: [
            'Create starts a new, empty tournament and opens it.',
            'Open switches to another tournament. All open tabs of this browser follow the switch.',
            'Rename changes the name of any tournament.',
            'Export saves a single tournament as a JSON file; Import as new adds a JSON file as an additional tournament without changing the active one.',
            'Delete removes a tournament from this browser after a confirmation. Deleting the last tournament creates a new empty one.',
          ],
          note: 'Tournaments are stored only in this browser. Export a tournament to keep a backup or to move it to another device. Viewers and read-only views do not show the list.',
        },
      ],
    },
  ],
  de: [
    {
      slug: 'tournament-library',
      title: 'Mehrere Turniere',
      summary:
        'Mehrere unabhängige Turniere in einem Browser verwalten und zwischen ihnen wechseln.',
      sections: [
        {
          title: 'Die Turnierliste',
          text: [
            'Unter Turniere in der Navigation stehen alle in diesem Browser gespeicherten Turniere. Eines davon ist aktiv: Tabelle, Runden und Einstellungen zeigen immer das aktive Turnier, und das Live-Teilen veröffentlicht es.',
          ],
          items: [
            'Turnier anlegen erstellt ein neues, leeres Turnier und öffnet es.',
            'Öffnen wechselt zu einem anderen Turnier. Alle geöffneten Tabs dieses Browsers folgen dem Wechsel.',
            'Umbenennen ändert den Namen eines beliebigen Turniers.',
            'Exportieren speichert ein einzelnes Turnier als JSON-Datei; Als neu importieren fügt eine JSON-Datei als zusätzliches Turnier hinzu, ohne das aktive zu ändern.',
            'Löschen entfernt ein Turnier nach einer Bestätigung aus diesem Browser. Wird das letzte Turnier gelöscht, entsteht ein neues, leeres.',
          ],
          note: 'Turniere werden nur in diesem Browser gespeichert. Exportiere ein Turnier als Sicherung oder um es auf ein anderes Gerät zu übertragen. Zuschauende und schreibgeschützte Ansichten zeigen die Liste nicht.',
        },
      ],
    },
  ],
}
