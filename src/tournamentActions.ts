import type { ScoringRules } from './domain/scoring/types'
import type { Participant, Round } from './tournamentTypes'
import { createId, hasEnteredScore, isRoundComplete, startReadyRounds } from './tournament'

export const createParticipant = (name: string): Participant => ({ id: createId(), name })

export const toggleParticipantWithdrawal = (players: Participant[], id: string) =>
  players.map((player) => (player.id === id ? { ...player, withdrawn: !player.withdrawn } : player))

export const updateRoundsForCourtCount = (
  rules: ScoringRules,
  rounds: Round[],
  courtCount: number,
) => startReadyRounds(rules, rounds, courtCount)

export const swapRoundPlayers = (
  rules: ScoringRules,
  rounds: Round[],
  roundIndex: number,
  draggedId: string,
  targetId: string,
) => {
  if (!draggedId || draggedId === targetId) return rounds
  return rounds.map((round, index) => {
    if (index !== roundIndex) return round
    if (isRoundComplete(rules, round)) return round
    if (rounds[roundIndex + 1]?.startedAt && (round.bye === draggedId || round.bye === targetId))
      return round
    const draggedMatch = round.matches.find(
      (match) => match.a === draggedId || match.b === draggedId,
    )
    const targetMatch = round.matches.find((match) => match.a === targetId || match.b === targetId)
    if (draggedMatch && hasEnteredScore(draggedMatch)) return round
    if (targetMatch && hasEnteredScore(targetMatch)) return round
    return {
      ...round,
      bye: round.bye === draggedId ? targetId : round.bye === targetId ? draggedId : round.bye,
      matches: round.matches.map((match) => ({
        ...match,
        a: match.a === draggedId ? targetId : match.a === targetId ? draggedId : match.a,
        b: match.b === draggedId ? targetId : match.b === targetId ? draggedId : match.b,
      })),
    }
  })
}
