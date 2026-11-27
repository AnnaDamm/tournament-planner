// Messages of the sports feature. Keys are prefixed with "sports"; edit only this file for that feature.
export const sportsEn = {
  sportsOther: 'Other',
} as const

export const sportsDe: { [Key in keyof typeof sportsEn]: string } = {
  sportsOther: 'Sonstige',
}
