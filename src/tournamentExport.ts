import type { TournamentSnapshot } from './tournamentTypes'

const fileSlug = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tournament'

export const downloadTournament = (snapshot: TournamentSnapshot) => {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileSlug(snapshot.tournamentName)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
