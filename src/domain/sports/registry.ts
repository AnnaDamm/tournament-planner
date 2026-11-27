import type { Sport, SportId } from './types'

const other: Sport = {
  id: 'other',
  labelKey: 'sportsOther',
  rules: 'sets',
  defaults: {
    format: { winningGames: 1, gamePoints: 21 },
    matchPoints: { win: 1, draw: 0.5, loss: 0 },
  },
  terms: {
    gamesHeader: 'sets',
    gameScore: 'setScore',
    winningGames: 'winningGames',
    winningGamesHelp: 'defaultWinningGamesHelp',
    defaultWinningGames: 'defaultWinningGames',
    defaultWinningGamesHelp: 'defaultWinningGamesHelp',
    gamePoints: 'defaultSetPoints',
    gamePointsHelp: 'defaultSetPointsHelp',
    pointsHeader: 'points',
    differenceHeader: 'difference',
  },
  editable: ['winningGames', 'gamePoints'],
}

// Append-only: one entry line per sport.
export const sports: Sport[] = [other]

export const getSport = (id: SportId): Sport => sports.find((sport) => sport.id === id) ?? other
