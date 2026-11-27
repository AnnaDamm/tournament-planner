// Messages of the swiss feature. Keys are prefixed with "swiss"; edit only this file for that feature.
export const swissEn = {
  swissMode: 'Swiss system',
} as const

export const swissDe: { [Key in keyof typeof swissEn]: string } = {
  swissMode: 'Schweizer System',
}
