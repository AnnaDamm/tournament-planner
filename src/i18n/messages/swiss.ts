// Messages of the swiss feature. Keys are prefixed with "swiss"; edit only this file for that feature.
export const swissEn = {
  swissMode: 'Swiss system',
  swissVariant: 'Variant',
  swissVariantStandard: 'Standard',
  swissVariantAccelerated: 'Accelerated (Baker)',
  swissVariantDanish: 'Danish',
  swissVariantStandardHelp:
    'Participants are paired by their current ranking; rematches are avoided.',
  swissVariantAcceleratedHelp:
    'In the first rounds the upper half of the seeding gets one virtual win for the pairing only. The ranking is not affected.',
  swissVariantDanishHelp:
    'The ranking is paired from the top (1-2, 3-4, ...). Rematches are allowed. The bye goes to the lowest ranked participant without a bye.',
  swissAcceleratedRounds: 'Accelerated rounds',
  swissAcceleratedRoundsHelp: 'Number of rounds in which the virtual win counts for the pairing.',
} as const

export const swissDe: { [Key in keyof typeof swissEn]: string } = {
  swissMode: 'Schweizer System',
  swissVariant: 'Variante',
  swissVariantStandard: 'Standard',
  swissVariantAccelerated: 'Beschleunigt (Baker)',
  swissVariantDanish: 'Dänisch',
  swissVariantStandardHelp:
    'Die Teilnehmenden werden nach aktuellem Ranking gepaart; Wiederholungen werden vermieden.',
  swissVariantAcceleratedHelp:
    'In den ersten Runden erhält die obere Hälfte der Setzliste einen virtuellen Sieg, der nur für die Paarung zählt. Die Rangliste bleibt unberührt.',
  swissVariantDanishHelp:
    'Das Ranking wird von oben gepaart (1-2, 3-4, ...). Wiederholungen sind erlaubt. Das Freilos geht an die am schlechtesten platzierte Person ohne Freilos.',
  swissAcceleratedRounds: 'Beschleunigte Runden',
  swissAcceleratedRoundsHelp:
    'Anzahl der Runden, in denen der virtuelle Sieg für die Paarung zählt.',
}
