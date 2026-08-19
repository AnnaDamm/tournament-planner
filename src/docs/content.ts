import type { locale } from '../i18n'

export type DocPage = {
  slug: string
  title: string
  summary: string
  sections: Array<{
    title: string
    text?: string[]
    items?: string[]
    note?: string
    links?: Array<{ label: string; to: string }>
  }>
}

const en: DocPage[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    summary: 'Set up a tournament, add participants, create rounds, and record results.',
    sections: [
      {
        title: 'Configure the tournament',
        text: [
          'Open Tournament settings using the cog. Set the tournament name, participant type, court count, and default games required to win.',
        ],
        links: [{ label: 'Open Settings', to: '/settings' }],
      },
      {
        title: 'Add participants',
        items: [
          'Open the table and select Edit.',
          'Select Add, enter one name per line, and confirm.',
          'At least two active participants are required. Duplicate names are allowed but produce a warning.',
        ],
        links: [{ label: 'Open Table', to: '/table' }],
      },
      {
        title: 'Create and start a round',
        text: [
          'Open Rounds and select Create round. The first round is randomized; with an odd participant count, one participant receives a bye.',
          'Before entering scores, you may reroll, swap participants or the bye using drag and drop, and override round settings. Start the first round with the play button.',
        ],
        links: [{ label: 'Open Rounds', to: '/rounds' }],
      },
      {
        title: 'Results and later rounds',
        text: [
          'Enter non-negative, unequal scores. The match ends when one side reaches the configured number of wins.',
          'Later rounds may contain <not yet known> positions. Fill further resolves them when earlier results become available. Export JSON backups regularly.',
        ],
      },
    ],
  },
  {
    slug: 'settings',
    title: 'Settings reference',
    summary: 'Ranges, inheritance, and effects of every tournament and round setting.',
    sections: [
      {
        title: 'Tournament name',
        text: [
          'The default is Tourny and the maximum is 80 characters. The name appears in the header, browser title, and export and determines the export filename. An empty name becomes Tourny.',
        ],
        links: [{ label: 'Open Settings', to: '/settings' }],
      },
      {
        title: 'Participant type',
        text: [
          'Players or Teams changes interface wording only. Names, rounds, pairings, and results remain unchanged. Team rosters are not modeled.',
        ],
      },
      {
        title: 'Courts',
        text: [
          'The default and minimum are 1, with no fixed maximum. This globally limits concurrent matches. Decimals are rounded down and invalid values become 1.',
          'Each round also has a court limit, and both limits apply. Changing global capacity can start prepared later rounds automatically.',
        ],
      },
      {
        title: 'Default games to win',
        text: [
          'Allowed values are 1 to 9. One is a single-game match, two is best of three, and three is best of five.',
          'The first round uses this default. Later rounds inherit the preceding round. Existing rounds are not changed retroactively.',
        ],
      },
      {
        title: 'Per-round settings',
        text: [
          'The cog on a round overrides games to win and courts for that round. It immediately affects score fields, completion, standings, and court assignment.',
        ],
        note: 'Changing games to win after entering results can reopen a match or ignore games after an earlier deciding game.',
      },
      {
        title: 'Language, theme, and data',
        text: [
          'A browser language beginning with de selects German; all others use English. Theme follows the system. Export JSON backs up, Import JSON replaces the tournament, and Delete all removes participants, rounds, and results while preserving general settings.',
        ],
      },
    ],
  },
  {
    slug: 'rounds-and-pairings',
    title: 'Rounds and pairings',
    summary: 'Swiss pairing, byes, unknown positions, and concurrent courts.',
    sections: [
      {
        title: 'Swiss pairing',
        text: [
          'Active participants are grouped by win-loss record and randomized within those groups. Rematches are avoided whenever a complete rematch-free solution exists.',
          'Odd groups receive a compatible participant from the next-lower win group where possible. A random fallback can contain a rematch.',
        ],
        links: [{ label: 'Open Rounds', to: '/rounds' }],
      },
      {
        title: 'Byes',
        text: [
          'Participants with the fewest previous byes are preferred, with random tie-breaking. A bye counts as one win after the round starts but awards no games or points.',
        ],
      },
      {
        title: 'Unknown positions',
        text: [
          'Later rounds can contain <not yet known>. Fill further resolves available positions, preferring the same record and then the next-lower win group while avoiding rematches where possible.',
        ],
      },
      {
        title: 'Manual changes',
        items: [
          'Drag participants within the same round to swap them, including the bye.',
          'A match with any score and a completed round are locked.',
          'Reroll and Delete round are available only while the whole round has no score.',
          'Deleting a middle round does not renumber later rounds.',
        ],
      },
      {
        title: 'Running matches',
        items: [
          'Global and per-round court limits both apply.',
          'A participant cannot play twice at once.',
          'An earlier open match blocks later matches.',
          'Partially entered matches have priority; unknown positions cannot run.',
          'Later rounds start automatically when a match is ready and capacity is free.',
        ],
      },
    ],
  },
  {
    slug: 'results-and-standings',
    title: 'Results and standings',
    summary: 'Valid scores, scoring, table columns, and official tie-breakers.',
    sections: [
      {
        title: 'Valid scores',
        text: [
          'Both values must be numeric, non-negative, and unequal. Decimals are accepted. Sport-specific winning margins and maximum scores are not enforced.',
          'At most 2 × games to win − 1 rows appear. Games after the deciding game are removed or ignored.',
        ],
      },
      {
        title: 'Scoring',
        text: [
          'A completed match records a win, loss, games, and points. A started bye records only a win. Open matches and matches with unknown or deleted participants do not count.',
        ],
      },
      {
        title: 'Official ranking',
        items: [
          'More wins',
          'Better game difference',
          'Better point difference',
          'Name alphabetically',
        ],
        note: 'Head-to-head, Buchholz score, and strength of schedule are not tie-breakers.',
      },
      {
        title: 'Sorting',
        text: [
          'Every heading is sortable, but the position number always follows the official criteria. (-n) means n fewer counted results than the maximum. Withdrawn participants remain visible.',
        ],
        links: [{ label: 'Open Table', to: '/table' }],
      },
    ],
  },
  {
    slug: 'data-and-backups',
    title: 'Data and backups',
    summary: 'Local storage, tab synchronization, import, export, and deletion.',
    sections: [
      {
        title: 'Local storage',
        text: [
          'Tourny stores settings, participants, rounds, pairings, times, and results in localStorage. Tabs on the same URL synchronize; devices, browsers, profiles, private windows, production, development, and previews are separate.',
        ],
        note: 'Clearing site data or ending a private session can destroy the tournament. Export regularly.',
      },
      {
        title: 'JSON export and import',
        text: [
          'Export downloads the complete version-1 state named after the tournament and may contain personal data.',
          'Import validates and replaces all tournament data. It cannot merge or undo. Invalid files leave the current state unchanged.',
        ],
      },
      {
        title: 'Delete all',
        text: [
          'After confirmation, participants, rounds, and results are removed. Name, participant type, courts, and the default remain. Only a previous export can restore deleted data.',
        ],
      },
    ],
  },
  {
    slug: 'offline-use',
    title: 'Installation and offline use',
    summary: 'Install Tourny as a PWA and prepare for events without connectivity.',
    sections: [
      {
        title: 'Install',
        text: [
          'Use Install app or Add to Home Screen in a supported browser. Data remains tied to the browser profile and is not synchronized online.',
        ],
      },
      {
        title: 'Prepare',
        items: [
          'Load Tourny completely once while online.',
          'Optionally install it and download a JSON backup.',
          'Disable the network temporarily and verify it opens.',
          'Reload while online to receive updates; local data is normally preserved.',
        ],
      },
    ],
  },
  {
    slug: 'limitations',
    title: 'Limitations and troubleshooting',
    summary: 'Known boundaries and common causes of unexpected behavior.',
    sections: [
      {
        title: 'Known limitations',
        items: [
          'Swiss system only; no knockout or group stage.',
          'No configurable tie-breakers, Buchholz score, or head-to-head rule.',
          'No rematch guarantee when a complete rematch-free solution is impossible.',
          'No sport-specific validation, drawn matches, or team rosters.',
          'No accounts, roles, cloud database, or cross-device live synchronization.',
          'No PDF/CSV export or undo for imports, deletion, or score changes.',
        ],
      },
      {
        title: 'Common causes',
        text: [
          'A match stays open when a value is missing or tied, or the target has not been reached. It cannot run before the round starts, without court capacity, while an earlier match is open, or with an unknown position.',
          'Missing data usually means a different URL, browser, or profile was used or site data was cleared. Restore the latest JSON export.',
        ],
      },
    ],
  },
]

const de: DocPage[] = [
  {
    slug: 'getting-started',
    title: 'Erste Schritte',
    summary:
      'Turnier einrichten, Teilnehmende hinzufügen, Runden erstellen und Ergebnisse erfassen.',
    sections: [
      {
        title: 'Turnier konfigurieren',
        text: [
          'Öffne über das Zahnrad die Turniereinstellungen und lege Name, Teilnehmendentyp, Spielfelder und Gewinnsätze fest.',
        ],
        links: [{ label: 'Einstellungen öffnen', to: '/settings' }],
      },
      {
        title: 'Teilnehmende hinzufügen',
        items: [
          'Öffne die Tabelle und wähle Bearbeiten.',
          'Wähle Hinzufügen, trage pro Zeile einen Namen ein und bestätige.',
          'Mindestens zwei aktive Teilnehmende sind nötig. Doppelte Namen erzeugen eine Warnung.',
        ],
        links: [{ label: 'Tabelle öffnen', to: '/table' }],
      },
      {
        title: 'Runde erstellen und starten',
        text: [
          'Unter Runden wird die erste Runde zufällig gepaart; bei ungerader Anzahl erhält eine Person ein Bye.',
          'Vor Ergebnissen kannst du neu auslosen, Namen oder Bye ziehen und Rundeneinstellungen ändern. Starte über das Play-Symbol.',
        ],
        links: [{ label: 'Runden öffnen', to: '/rounds' }],
      },
      {
        title: 'Ergebnisse und Folgerunden',
        text: [
          'Trage nichtnegative, unterschiedliche Werte ein. Die Begegnung endet mit der Zielzahl an Siegen.',
          'Weitere befüllen löst <noch nicht bekannt> auf, sobald frühere Ergebnisse feststehen. Exportiere regelmäßig JSON.',
        ],
      },
    ],
  },
  {
    slug: 'settings',
    title: 'Alle Einstellungen',
    summary: 'Wertebereiche, Vererbung und Auswirkungen aller Einstellungen.',
    sections: [
      {
        title: 'Turniername',
        text: [
          'Standard ist Tourny, maximal 80 Zeichen. Der Name erscheint in Kopfbereich, Browsertitel und Export. Leer wird zu Tourny.',
        ],
        links: [{ label: 'Einstellungen öffnen', to: '/settings' }],
      },
      {
        title: 'Teilnehmendentyp',
        text: [
          'Spieler oder Teams ändert nur Beschriftungen. Daten und Logik bleiben gleich; Teammitglieder werden nicht verwaltet.',
        ],
      },
      {
        title: 'Spielfelder',
        text: [
          'Standard und Minimum sind 1, ohne festes Maximum. Der Wert begrenzt alle parallelen Begegnungen. Dezimalwerte werden abgerundet, ungültige werden 1.',
          'Zusätzlich gilt das Limit jeder Runde. Eine globale Änderung kann vorbereitete Runden starten.',
        ],
      },
      {
        title: 'Standard-Gewinnsätze',
        text: [
          'Erlaubt sind 1 bis 9: 1 ist ein Satz, 2 Best-of-3, 3 Best-of-5.',
          'Die erste Runde nutzt den Standard, spätere erben die vorherige Runde. Bestehende Runden ändern sich nicht.',
        ],
      },
      {
        title: 'Rundeneinstellungen',
        text: [
          'Das Zahnrad überschreibt Gewinnsätze und Spielfelder dieser Runde und beeinflusst Eingabe, Abschluss, Tabelle und Feldbelegung sofort.',
        ],
        note: 'Nachträgliche Änderungen können Begegnungen wieder öffnen oder spätere Sätze ignorieren.',
      },
      {
        title: 'Sprache, Design und Daten',
        text: [
          'Browsersprache de wählt Deutsch, sonst Englisch. Das Design folgt dem System. Export sichert, Import ersetzt, Alles löschen entfernt Turnierdaten, behält aber Einstellungen.',
        ],
      },
    ],
  },
  {
    slug: 'rounds-and-pairings',
    title: 'Runden und Paarungen',
    summary: 'Schweizer System, Byes, unbekannte Plätze und parallele Spielfelder.',
    sections: [
      {
        title: 'Schweizer Paarung',
        text: [
          'Aktive Teilnehmende werden nach Siegen und Niederlagen gruppiert und zufällig gepaart. Rematches werden vermieden, wenn eine vollständige Lösung existiert.',
          'Ungerade Gruppen erhalten möglichst jemanden aus der nächstniedrigeren Sieggruppe; die Zufallsreserve kann einen Rematch enthalten.',
        ],
        links: [{ label: 'Runden öffnen', to: '/rounds' }],
      },
      {
        title: 'Byes',
        text: [
          'Bevorzugt werden Personen mit wenigen bisherigen Byes, Gleichstände entscheidet der Zufall. Ein gestartetes Bye zählt als Sieg ohne Sätze oder Punkte.',
        ],
      },
      {
        title: 'Unbekannte Plätze',
        text: [
          'Weitere befüllen löst bestimmbare Plätze auf, bevorzugt gleichen Ergebnisstand und dann die nächste Sieggruppe und vermeidet Rematches möglichst.',
        ],
      },
      {
        title: 'Manuelle Änderungen',
        items: [
          'Namen derselben Runde einschließlich Bye können gezogen werden.',
          'Begegnungen mit Eingabe und fertige Runden sind gesperrt.',
          'Neu auslosen und Löschen gehen nur ohne Ergebnisse.',
          'Mittlere Runden werden beim Löschen nicht neu nummeriert.',
        ],
      },
      {
        title: 'Laufende Begegnungen',
        items: [
          'Globales und Rundenlimit gelten gemeinsam.',
          'Niemand kann zweimal gleichzeitig spielen.',
          'Frühere offene Begegnungen blockieren spätere.',
          'Begonnene Ergebnisse haben Vorrang; unbekannte Plätze können nicht laufen.',
          'Folgerunden starten automatisch bei Bereitschaft und Kapazität.',
        ],
      },
    ],
  },
  {
    slug: 'results-and-standings',
    title: 'Ergebnisse und Tabelle',
    summary: 'Gültige Eingaben, Wertung und Tie-Breaker.',
    sections: [
      {
        title: 'Gültige Ergebnisse',
        text: [
          'Beide Werte müssen numerisch, nichtnegativ und unterschiedlich sein. Sportregeln wie Mindestabstand werden nicht geprüft.',
          'Maximal erscheinen 2 × Gewinnsätze − 1 Zeilen; spätere Sätze nach der Entscheidung werden ignoriert.',
        ],
      },
      {
        title: 'Wertung',
        text: [
          'Fertige Begegnungen erzeugen Sieg, Niederlage, Sätze und Punkte. Gestartete Byes nur einen Sieg. Offene, unbekannte oder gelöschte Begegnungen zählen nicht.',
        ],
      },
      {
        title: 'Rangfolge',
        items: [
          'Mehr Siege',
          'Bessere Satzdifferenz',
          'Bessere Punktedifferenz',
          'Name alphabetisch',
        ],
        note: 'Direkter Vergleich, Buchholz und Gegnerstärke zählen nicht.',
      },
      {
        title: 'Sortierung',
        text: [
          'Spalten sind sortierbar, die Positionsnummer bleibt offiziell. (-n) zeigt weniger gewertete Ergebnisse. Zurückgezogene bleiben sichtbar.',
        ],
        links: [{ label: 'Tabelle öffnen', to: '/table' }],
      },
    ],
  },
  {
    slug: 'data-and-backups',
    title: 'Daten und Backups',
    summary: 'Lokale Speicherung, Synchronisierung, Import, Export und Löschen.',
    sections: [
      {
        title: 'Lokale Speicherung',
        text: [
          'Tourny speichert alles im localStorage. Tabs derselben URL synchronisieren sich; Geräte, Browserprofile, private Fenster, Produktion, Entwicklung und Vorschauen bleiben getrennt.',
        ],
        note: 'Gelöschte Websitedaten können das Turnier zerstören. Regelmäßig exportieren.',
      },
      {
        title: 'JSON-Export und -Import',
        text: [
          'Der Export enthält den vollständigen Stand in Version 1 und kann personenbezogene Daten enthalten.',
          'Der Import validiert und ersetzt alles. Zusammenführen und Undo sind unmöglich; ungültige Dateien verändern nichts.',
        ],
      },
      {
        title: 'Alles löschen',
        text: [
          'Teilnehmende, Runden und Ergebnisse werden entfernt; Name, Typ, Spielfelder und Standard bleiben. Nur ein Export kann wiederherstellen.',
        ],
      },
    ],
  },
  {
    slug: 'offline-use',
    title: 'Installation und Offline-Nutzung',
    summary: 'Tourny als PWA für Veranstaltungen ohne Internet vorbereiten.',
    sections: [
      {
        title: 'Installieren',
        text: [
          'Nutze App installieren oder Zum Startbildschirm. Daten bleiben am Browserprofil und werden nicht online synchronisiert.',
        ],
      },
      {
        title: 'Vorbereiten',
        items: [
          'Tourny online vollständig laden.',
          'Optional installieren und JSON sichern.',
          'Netzwerk deaktivieren und Start testen.',
          'Für Updates online neu laden; Daten bleiben normalerweise erhalten.',
        ],
      },
    ],
  },
  {
    slug: 'limitations',
    title: 'Grenzen und Fehlerbehebung',
    summary: 'Bekannte Einschränkungen und häufige Ursachen.',
    sections: [
      {
        title: 'Bekannte Grenzen',
        items: [
          'Nur Schweizer System; kein KO oder Gruppen.',
          'Keine konfigurierbaren Tie-Breaker, Buchholz oder direkter Vergleich.',
          'Keine Rematch-Garantie ohne vollständige Lösung.',
          'Keine Sportprüfung, Unentschieden oder Teamaufstellungen.',
          'Keine Konten, Rollen, Cloud oder Geräte-Synchronisierung.',
          'Kein PDF/CSV und kein Undo.',
        ],
      },
      {
        title: 'Häufige Ursachen',
        text: [
          'Eine Begegnung bleibt bei fehlenden oder gleichen Werten oder unerreichter Zielzahl offen. Ohne Start, Kapazität, bei früherem offenem Spiel oder unbekanntem Platz läuft sie nicht.',
          'Fehlende Daten bedeuten meist eine andere URL, Browser oder Profil oder gelöschte Websitedaten. Nutze den letzten Export.',
        ],
      },
    ],
  },
]

export const getDocs = (language: typeof locale) => (language === 'de' ? de : en)
