import type { DocPage } from '../content'

// Documentation pages of the swiss feature; getDocs inserts them before the limitations page.
export const swissDocs: { en: DocPage[]; de: DocPage[] } = {
  en: [
    {
      slug: 'swiss-variants',
      title: 'Swiss variants',
      summary: 'Standard, accelerated and Danish pairing for Swiss phases.',
      sections: [
        {
          title: 'Choose a variant',
          text: [
            'Open Tournament settings, select the Swiss phase and choose the variant. The variant can be changed until the phase has started.',
          ],
          links: [{ label: 'Open Settings', to: '/settings' }],
        },
        {
          title: 'Standard',
          text: ['Participants are paired by their ranking and rematches are avoided.'],
        },
        {
          title: 'Accelerated (Baker)',
          text: [
            'In the first rounds (default: 2) the upper half of the seeding, that is the participant order of the phase, receives one virtual win. The virtual win is used for the pairing only and never appears in the table. This pairs strong against strong earlier and sorts the field faster.',
          ],
        },
        {
          title: 'Danish',
          text: [
            'The ranking is paired from the top: 1 plays 2, 3 plays 4 and so on. Rematches are allowed. The bye goes to the lowest ranked participant who has not had one yet.',
          ],
        },
      ],
    },
  ],
  de: [
    {
      slug: 'swiss-variants',
      title: 'Schweizer-System-Varianten',
      summary: 'Standard, beschleunigte und dänische Paarung für Schweizer Phasen.',
      sections: [
        {
          title: 'Variante wählen',
          text: [
            'Öffne die Turniereinstellungen, wähle die Schweizer Phase und die Variante. Die Variante lässt sich ändern, bis die Phase gestartet wurde.',
          ],
          links: [{ label: 'Einstellungen öffnen', to: '/settings' }],
        },
        {
          title: 'Standard',
          text: ['Die Teilnehmenden werden nach Ranking gepaart, Wiederholungen werden vermieden.'],
        },
        {
          title: 'Beschleunigt (Baker)',
          text: [
            'In den ersten Runden (Standard: 2) erhält die obere Hälfte der Setzliste, also der Teilnehmerreihenfolge der Phase, einen virtuellen Sieg. Er zählt nur für die Paarung und erscheint nie in der Tabelle. So treffen Starke früher aufeinander und das Feld sortiert sich schneller.',
          ],
        },
        {
          title: 'Dänisch',
          text: [
            'Das Ranking wird von oben gepaart: 1 spielt gegen 2, 3 gegen 4 und so weiter. Wiederholungen sind erlaubt. Das Freilos geht an die am schlechtesten platzierte Person, die noch keines hatte.',
          ],
        },
      ],
    },
  ],
}
