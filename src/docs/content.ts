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
          'Open Tournament settings using the cog. Set the tournament name, participant type, court count, default games required to win, and default points per set. Changes are applied with Save; Cancel discards the draft.',
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
          'Open Rounds and select Create round. This creates an empty round without calculating pairings.',
          'Select Calculate pairings to generate the first randomized round or the ranking-based later round. With an odd participant count, one participant receives a bye. Before entering scores, you may reroll, swap participants or the bye using drag and drop, and override round settings.',
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
    slug: 'system-overview',
    title: 'How the system works',
    summary: 'The complete flow from pairing and court assignment to ranking positions.',
    sections: [
      {
        title: 'Tournament data and active participants',
        items: [
          'Withdrawn participants are excluded from new pairings but remain visible in the table.',
          'A completed match contributes one win and one loss, the won and lost sets, and the points from complete sets.',
          'Open matches, unknown positions, and matches involving deleted or unknown participants do not contribute to the ranking.',
        ],
      },
      {
        title: 'How the first round is created',
        text: [
          'Creating the first round does not calculate pairings. After Calculate pairings is selected, active participants are split into two halves and paired by matching positions across the halves. Because it is the first round, there are no previous opponents to consider.',
          'With an odd number of active participants, one person receives a bye. Participants with fewer already-counted byes are preferred, and equal bye counts are decided randomly.',
          'The round display uses the ranking calculated from results before that round. For the first round there are no results yet, so the initial ranking is used. New court assignments and pairings follow that order.',
        ],
      },
      {
        title: 'How later rounds are paired',
        items: [
          'Creating a later round only creates an empty round. Pairings and unknown positions are calculated only after Calculate pairings is selected.',
          'The official ranking is calculated from all previous completed results.',
          'Participants whose previous round is finalized are placed into the new round. Positions that are not decided yet are represented by not-yet-known placeholders.',
          'Starting with the first person in ranking order, the system selects the first remaining person they have not played yet. The process repeats until no pair remains.',
          'If a participant has already played every remaining opponent, the first available opponent is used as a fallback. A rematch is then unavoidable.',
          'When unknown positions can be resolved, same-record opponents are preferred, then the next lower win group. Available candidates are selected in official ranking order and rematches are avoided where possible.',
        ],
      },
      {
        title: 'How results become a position',
        items: [
          'A set is counted only when both values are numeric, non-negative, and different.',
          'A match is complete as soon as one side reaches the configured number of wins. Later set rows do not count.',
          "A bye counts as one best-possible win when the following round starts: it receives the round's winning games as won sets and the configured default points for each set, with zero conceded points.",
          'The official position is sorted by: more wins, later last-loss round, more sets won, fewer sets lost, more own points scored, fewer opponent points conceded, then name alphabetically.',
          'A participant without a loss ranks above every participant with a loss when the number of wins is equal. A later last loss is better than an earlier last loss.',
        ],
        links: [{ label: 'Open Table', to: '/table' }],
      },
      {
        title: 'Official position versus table sorting',
        text: [
          'The position number always uses the official criteria above. Table headings can be sorted for a different view, but changing a heading does not change the official position or the pairing logic.',
          'Each round has its own ranking based only on results from previous rounds. The table displays only the latest overall ranking; sorting a table heading does not change the per-round order or the pairing logic.',
        ],
      },
      {
        title: 'How courts and starts are assigned',
        items: [
          'The global court limit and the per-round court limit are applied together.',
          'A match with a partial score has priority over a match without a score. Unknown positions cannot start, and a participant cannot play in two matches at the same time.',
          'An earlier open round blocks later rounds for the affected participants. Later rounds start automatically when their positions are known and a court is available.',
          'Each match stores its court number. Valid existing assignments are preserved; after a match finishes, its court is available for the next ready match.',
          'The first round starts automatically when the first result is entered. A manually started round is also assigned the lowest available courts in the deterministic match order.',
        ],
        links: [{ label: 'Open Rounds', to: '/rounds' }],
      },
      {
        title: 'Round lifecycle at a glance',
        items: [
          'Create an empty round.',
          'Select Calculate pairings to create pairings or placeholders.',
          'Resolve placeholders as earlier results become final.',
          'Start ready matches within the available court capacity.',
          'Enter results; completed matches update the standings and release their courts.',
          'Use the updated official ranking for the next round.',
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
          'Allowed values are 1 to 99. One is a single-game match, two is best of three, and three is best of five.',
          'The first round uses this default. Later rounds inherit the preceding round. Existing rounds are not changed retroactively.',
        ],
      },
      {
        title: 'Default points per set',
        text: [
          'The default is 21 and the minimum is 1. It is used for the synthetic score of counted byes. Changing it updates existing counted byes after Save.',
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
          'Create a round first, then select Calculate pairings. In the first round, active participants are split into two halves and paired by matching positions across the halves. From round two onward, active participants follow the official ranking: each remaining participant is paired with the first person in ranking order they have not played yet.',
          'If no unused opponent remains, the first available opponent is used as a necessary fallback. Rematches can therefore occur when the participant history leaves no alternative.',
        ],
        links: [{ label: 'Open Rounds', to: '/rounds' }],
      },
      {
        title: 'Byes',
        text: [
          'Participants with the fewest already-counted byes are preferred, with random tie-breaking. A bye counts as one best-possible win when the following round starts: all round winning games are won at the configured default points, with zero conceded points.',
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
          'Each running match keeps its assigned court. Completed matches release the court for the next ready match.',
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
          'A completed match records a win, loss, games, and points. A bye records the best possible win, sets, and points when the following round starts. Open matches and matches with unknown or deleted participants do not count.',
        ],
      },
      {
        title: 'Official ranking',
        items: [
          'More wins',
          'Later last loss round; participants without a loss rank above participants with a loss',
          'More sets won',
          'Fewer lost sets',
          'More own points scored',
          'Fewer opponent points conceded',
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
        title: 'Read-only tab',
        text: [
          'Select the lock in the toolbar to reopen the current tab as read-only. The tab keeps its own local snapshot, cannot change or save tournament data, and the lock cannot be removed afterward. Open the GitHub Pages app in a second tab when you need a local read-only view.',
          'Local server viewers are read-only automatically. The lock and documentation controls are hidden in every read-only or viewer tab.',
        ],
      },
      {
        title: 'Read-only display modes',
        items: [
          'The magnifying-glass-plus button enables the large view. It enlarges the typography and controls; on large screens it uses the tablet layout with the navigation drawer and no side margin. The mode is encoded as focus=1 in the URL.',
          'The update spinner enables automatic rotation between the table and rounds every 30 seconds. The mode is encoded as rotate=1 in the URL and can be combined with focus=1.',
          'After 10 seconds without interaction, the read-only rounds view centers the first currently running match. Interacting with the page starts the idle timer again.',
          'All simultaneously running rounds are grouped in one highlighted card in the read-only rounds view.',
          'In browser fullscreen, the cursor hides after 5 seconds of inactivity. The header is overlaid without taking screen space and appears when the pointer reaches the top edge; it retracts shortly after the pointer leaves it.',
          'Toolbar icon tooltips appear on hover and keyboard focus. Read-only display URLs can be shared directly, for example ?readonly=1&focus=1&rotate=1.',
        ],
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
  {
    slug: 'version-history',
    title: 'Version history',
    summary: 'Released versions and the changes included in each release.',
    sections: [
      {
        title: 'Releases',
        items: [
          'Unreleased — accessibility, focus, layout, Redux, CSS module, performance, print, comparison, pairing, bye, and footer improvements.',
          'v2.1.2 — Fix time handling between rounds.',
          'v2.1.1 — Improve start-time handling and round-related UX.',
          'v2.1.0 — Enhance tournament views and round management.',
          'v2.0.4 — Update dependency automation and formatting configuration.',
          'v2.0.3 — Increase the maximum winning-games setting to 99.',
          'v2.0.2 — Improve match scoring, read-only links, service-worker caching, and layouts.',
          'v2.0.1 — Improve interactive control semantics.',
          'v2.0.0 — Add the responsive interface, accessibility improvements, sharing, bilingual documentation, search, and storage architecture updates.',
          'v1.2.2 — Improve rerolling existing match scores.',
          'v1.2.1 — Enable matches across active rounds.',
          'v1.2.0 — Fix 404 handling, bye logic, and release workflow warnings.',
          'v1.1.1 — Maintenance release.',
          'v1.1.0 — Add PWA installation and offline support.',
          'v1.0.2 — Fix the build configuration.',
          'v1.0.1 — Maintenance release.',
          'v1.0.0 — Initial release.',
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
          'Öffne über das Zahnrad die Turniereinstellungen und lege Name, Teilnehmendentyp, Spielfelder, Gewinnsätze und Standardpunkte pro Satz fest. Änderungen werden erst mit „Speichern“ angewendet; „Abbrechen“ verwirft den Entwurf.',
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
          'Unter Runden legst du zunächst eine leere Runde an. Die Paarungen werden erst mit „Paarungen berechnen“ erzeugt; bei ungerader Anzahl erhält eine Person ein Freilos.',
          'Vor Ergebnissen kannst du neu auslosen, Namen oder Freilos ziehen und Rundeneinstellungen ändern. Starte danach über das Play-Symbol.',
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
    slug: 'system-overview',
    title: 'So funktioniert das System',
    summary: 'Der vollständige Ablauf von Paarung und Feldvergabe bis zur Ranglistenposition.',
    sections: [
      {
        title: 'Turnierdaten und aktive Teilnehmende',
        items: [
          'Zurückgezogene Teilnehmende werden bei neuen Paarungen ausgeschlossen, bleiben aber in der Tabelle sichtbar.',
          'Eine fertige Begegnung erzeugt einen Sieg und eine Niederlage sowie gewonnene/verlorene Sätze und die Punkte aus vollständigen Sätzen.',
          'Offene Begegnungen, unbekannte Plätze und Begegnungen mit gelöschten oder unbekannten Personen zählen nicht für die Rangliste.',
        ],
      },
      {
        title: 'So entsteht die erste Runde',
        text: [
          'Das Anlegen der ersten Runde berechnet noch keine Paarungen. Erst mit „Paarungen berechnen“ werden die aktiven Teilnehmenden in zwei Hälften geteilt und jeweils die Positionen beider Hälften gegeneinander gepaart. Da es die erste Runde ist, gibt es keine früheren Gegner, die berücksichtigt werden müssen.',
          'Bei einer ungeraden Anzahl aktiver Teilnehmender erhält eine Person ein Freilos. Bevorzugt werden Personen mit wenigen bereits gewerteten Freilosen; bei Gleichstand entscheidet der Zufall.',
          'Die Rundenansicht nutzt die Rangliste, die aus den Ergebnissen vor dieser Runde berechnet wurde. In der ersten Runde gibt es noch keine Ergebnisse, daher gilt die Anfangsrangliste. Spielfeldzuweisungen und Paarungen folgen dieser Reihenfolge.',
        ],
      },
      {
        title: 'So werden Folgerunden gepaart',
        items: [
          'Das Anlegen einer Folgerunde erzeugt zunächst nur eine leere Runde. Paarungen und unbekannte Plätze werden erst mit „Paarungen berechnen“ erzeugt.',
          'Die offizielle Rangliste wird aus allen bisher fertigen Ergebnissen berechnet.',
          'Teilnehmende mit abgeschlossener vorheriger Runde werden in die neue Runde übernommen. Noch nicht entschiedene Plätze werden als noch nicht bekannt dargestellt.',
          'Beginnend mit der ersten Person der Rangliste nimmt das System die erste noch verfügbare Person, gegen die sie noch nicht gespielt hat. Das wiederholt sich, bis keine Paarung mehr möglich ist.',
          'Hat eine Person bereits gegen alle übrigen verfügbaren Personen gespielt, wird die erste verfügbare Person als Fallback genommen. Ein Rematch ist dann unvermeidbar.',
          'Sobald unbekannte Plätze aufgelöst werden können, werden zunächst Personen mit gleichem Ergebnisstand und danach die nächste niedrigere Sieggruppe berücksichtigt. Kandidaten werden in offizieller Rangfolge gewählt und Rematches möglichst vermieden.',
        ],
      },
      {
        title: 'So entsteht eine Ranglistenposition',
        items: [
          'Ein Satz zählt nur, wenn beide Werte numerisch, nichtnegativ und unterschiedlich sind.',
          'Eine Begegnung ist fertig, sobald eine Seite die konfigurierte Zahl an Satzsiegen erreicht. Spätere Satzzeilen werden nicht gewertet.',
          'Ein Freilos zählt als bestmöglicher Sieg, sobald die folgende Runde startet: Alle Gewinnsätze der Runde gelten als gewonnen, mit der Standardpunktzahl pro Satz und null gegnerischen Punkten.',
          'Die offizielle Position wird sortiert nach: mehr Siege, spätere Runde des letzten Verlusts, mehr gewonnene Sätze, weniger verlorene Sätze, mehr eigene Punkte, weniger gegnerische Punkte und anschließend alphabetisch nach Name.',
          'Bei gleicher Siegzahl steht eine Person ohne Niederlage vor allen Personen mit Niederlage. Ein späterer letzter Verlust ist besser als ein früherer.',
        ],
        links: [{ label: 'Tabelle öffnen', to: '/table' }],
      },
      {
        title: 'Offizielle Position und Tabellensortierung',
        text: [
          'Die Positionsnummer verwendet immer die offiziellen Kriterien. Die Tabellenspalten können für eine andere Ansicht sortiert werden; eine Änderung der Spaltensortierung verändert weder die offizielle Position noch die Paarungslogik.',
          'Jede Runde hat eine eigene Rangliste, die nur aus den Ergebnissen der vorherigen Runden berechnet wird. Die Tabelle zeigt ausschließlich die aktuellste Gesamtrangliste; eine Spaltensortierung verändert weder die Reihenfolge innerhalb einer Runde noch die Paarungslogik.',
        ],
      },
      {
        title: 'So werden Spielfelder und Starts vergeben',
        items: [
          'Das globale Spielfeldlimit und das Limit der jeweiligen Runde gelten gemeinsam.',
          'Eine Begegnung mit teilweise eingetragenem Ergebnis hat Vorrang vor einer Begegnung ohne Ergebnis. Unbekannte Plätze können nicht starten, und eine Person kann nicht gleichzeitig zweimal spielen.',
          'Eine frühere offene Runde blockiert spätere Runden für die betroffenen Personen. Folgerunden starten automatisch, sobald ihre Plätze bekannt und Felder frei sind.',
          'Jede Begegnung speichert ihre Feldnummer. Gültige bestehende Zuweisungen bleiben erhalten; nach dem Abschluss wird das Feld für die nächste bereite Begegnung frei.',
          'Die erste Runde startet automatisch, sobald das erste Ergebnis eingetragen wird. Auch ein manueller Start vergibt die niedrigsten freien Felder in der deterministischen Reihenfolge.',
        ],
        links: [{ label: 'Runden öffnen', to: '/rounds' }],
      },
      {
        title: 'Rundenablauf im Überblick',
        items: [
          'Leere Runde erstellen.',
          'Mit „Paarungen berechnen“ Paarungen oder unbekannte Plätze erzeugen.',
          'Unbekannte Plätze auflösen, sobald frühere Ergebnisse feststehen.',
          'Bereite Begegnungen innerhalb der verfügbaren Feldkapazität starten.',
          'Ergebnisse eintragen; fertige Begegnungen aktualisieren die Rangliste und geben ihre Felder frei.',
          'Die aktualisierte offizielle Rangliste für die nächste Runde verwenden.',
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
          'Erlaubt sind 1 bis 99: 1 ist ein Satz, 2 Best-of-3, 3 Best-of-5.',
          'Die erste Runde nutzt den Standard, spätere erben die vorherige Runde. Bestehende Runden ändern sich nicht.',
        ],
      },
      {
        title: 'Standardpunkte pro Satz',
        text: [
          'Standard sind 21 Punkte, das Minimum ist 1. Die Einstellung wird für die synthetische Wertung gewerteter Freilose verwendet. Eine Änderung aktualisiert bestehende Freilose nach dem Speichern.',
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
    summary: 'Schweizer System, Freilose, unbekannte Plätze und parallele Spielfelder.',
    sections: [
      {
        title: 'Schweizer Paarung',
        text: [
          'Lege zuerst eine Runde an und wähle dann „Paarungen berechnen“. In der ersten Runde werden die aktiven Teilnehmenden in zwei Hälften geteilt und jeweils die Positionen beider Hälften gegeneinander gepaart. Ab Runde zwei folgt die Auslosung der offiziellen Rangliste: Jede verbleibende Person spielt gegen die erste Person in der Reihenfolge, gegen die sie noch nicht gespielt hat.',
          'Wenn kein ungespielter Gegner übrig bleibt, wird notwendigerweise die erste verfügbare Person genommen; dann kann ein Rematch entstehen.',
        ],
        links: [{ label: 'Runden öffnen', to: '/rounds' }],
      },
      {
        title: 'Freilose',
        text: [
          'Bevorzugt werden Personen mit wenigen bereits gewerteten Freilosen, Gleichstände entscheidet der Zufall. Ein Freilos zählt als bestmöglicher Sieg, sobald die folgende Runde startet: Alle Gewinnsätze gelten mit der Standardpunktzahl als gewonnen, gegnerische Punkte sind null.',
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
          'Namen derselben Runde einschließlich Freilos können gezogen werden.',
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
          'Jede laufende Begegnung speichert ihr Feld. Nach dem Abschluss wird das Feld für die nächste bereite Begegnung frei.',
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
          'Fertige Begegnungen erzeugen Sieg, Niederlage, Sätze und Punkte. Gewertete Freilose erzeugen den bestmöglichen Sieg, die Gewinnsätze und die entsprechenden Punkte. Offene, unbekannte oder gelöschte Begegnungen zählen nicht.',
        ],
      },
      {
        title: 'Rangfolge',
        items: [
          'Mehr Siege',
          'Spätere Runde des letzten Verlusts; ohne Verlust vor allen mit Verlust',
          'Mehr gewonnene Sätze',
          'Weniger verlorene Sätze',
          'Mehr eigene Punkte',
          'Weniger gegnerische Punkte',
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
        title: 'Read-only-Tab',
        text: [
          'Über das Schloss in der Kopfleiste lässt sich der aktuelle Tab als Read-only-Ansicht neu öffnen. Der Tab nutzt einen eigenen lokalen Stand, kann keine Turnierdaten ändern oder speichern, und der Lock kann danach nicht mehr entfernt werden. Öffne die GitHub-Pages-App dafür in einem zweiten Tab.',
          'Viewer über den lokalen Server sind automatisch schreibgeschützt. Lock und Dokumentation sind in jedem Read-only- oder Viewer-Tab ausgeblendet.',
        ],
      },
      {
        title: 'Anzeigemodi in Read-only',
        items: [
          'Die Lupe mit Plus aktiviert die große Ansicht. Schrift und Bedienelemente werden größer; auf großen Bildschirmen wird das Tablet-Layout mit ausklappbarer Navigation und ohne seitlichen Rand verwendet. Der Modus steht als focus=1 in der URL.',
          'Der Update-Kreisel aktiviert den automatischen Wechsel zwischen Tabelle und Runden alle 30 Sekunden. Der Modus steht als rotate=1 in der URL und kann mit focus=1 kombiniert werden.',
          'Nach 10 Sekunden ohne Interaktion zentriert die Read-only-Rundenansicht die erste aktuell laufende Begegnung. Jede Interaktion startet den Idle-Timer neu.',
          'Alle gleichzeitig laufenden Runden werden in der Read-only-Rundenansicht in einer hervorgehobenen Card gruppiert.',
          'Im Browser-Fullscreen wird der Cursor nach 5 Sekunden Inaktivität ausgeblendet. Die Kopfleiste liegt über dem Inhalt und nimmt keinen Platz weg; sie erscheint am oberen Bildschirmrand und fährt kurz nach dem Verlassen wieder ein.',
          'Tooltips für die Icons erscheinen bei Hover und Tastaturfokus. Read-only-Anzeigen können direkt geteilt werden, zum Beispiel ?readonly=1&focus=1&rotate=1.',
        ],
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
  {
    slug: 'version-history',
    title: 'Versionshistorie',
    summary: 'Veröffentlichte Versionen und die enthaltenen Änderungen.',
    sections: [
      {
        title: 'Veröffentlichungen',
        items: [
          'Unveröffentlicht — Verbesserungen an Barrierefreiheit, Fokus, Layout, Redux, CSS-Modulen, Performance, Druckansicht, Vergleich, Paarungen, Freilosen und Versionsanzeige.',
          'v2.1.2 — Zeitbehandlung zwischen Runden korrigiert.',
          'v2.1.1 — Startzeitbehandlung und Runden-UX verbessert.',
          'v2.1.0 — Turnieransichten und Rundenverwaltung erweitert.',
          'v2.0.4 — Abhängigkeitsautomatisierung und Formatierungskonfiguration aktualisiert.',
          'v2.0.3 — Maximale Einstellung für Gewinnsätze auf 99 erhöht.',
          'v2.0.2 — Begegnungserfassung, Read-only-Links, Service-Worker-Cache und Layouts verbessert.',
          'v2.0.1 — Semantik interaktiver Bedienelemente verbessert.',
          'v2.0.0 — Responsive Oberfläche, Barrierefreiheit, Teilen, zweisprachige Dokumentation, Suche und Speicherarchitektur erweitert.',
          'v1.2.2 — Erneutes Auslosen bestehender Ergebnisse verbessert.',
          'v1.2.1 — Begegnungen über aktive Runden hinweg ermöglicht.',
          'v1.2.0 — 404-Behandlung, Freiloslogik und Warnungen im Release-Workflow korrigiert.',
          'v1.1.1 — Wartungsrelease.',
          'v1.1.0 — PWA-Installation und Offline-Unterstützung ergänzt.',
          'v1.0.2 — Build-Konfiguration korrigiert.',
          'v1.0.1 — Wartungsrelease.',
          'v1.0.0 — Erste Veröffentlichung.',
        ],
      },
    ],
  },
]

export const getDocs = (language: typeof locale) => (language === 'de' ? de : en)
