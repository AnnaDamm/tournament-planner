import type { Sport, TermKey } from './types'
import type { MessageKey } from '../../i18n'

const terms = (overrides: Partial<Record<TermKey, MessageKey>>): Sport['terms'] => ({
  gamesHeader: 'sets',
  gameScore: 'setScore',
  gamesPlural: 'sportsSetsPlural',
  winningGames: 'winningGames',
  winningGamesHelp: 'defaultWinningGamesHelp',
  defaultWinningGames: 'defaultWinningGames',
  defaultWinningGamesHelp: 'defaultWinningGamesHelp',
  gamePoints: 'defaultSetPoints',
  gamePointsHelp: 'defaultSetPointsHelp',
  pointsHeader: 'points',
  differenceHeader: 'difference',
  ...overrides,
})

const points = { win: 1, draw: 0.5, loss: 0 }

export const other: Sport = {
  id: 'other',
  labelKey: 'sportsOther',
  rules: 'sets',
  alternativeRules: ['outcomeOnly'],
  defaults: { format: { winningGames: 1, gamePoints: 21 }, matchPoints: { ...points } },
  terms: terms({}),
  editable: ['winningGames', 'gamePoints', 'fixedGames'],
}

export const badminton: Sport = {
  id: 'badminton',
  labelKey: 'sportsBadminton',
  rules: 'sets',
  defaults: { format: { winningGames: 2, gamePoints: 21 }, matchPoints: { ...points } },
  terms: terms({}),
  editable: ['winningGames', 'gamePoints'],
}

export const volleyball: Sport = {
  id: 'volleyball',
  labelKey: 'sportsVolleyball',
  rules: 'sets',
  defaults: { format: { winningGames: 3, gamePoints: 25 }, matchPoints: { ...points } },
  terms: terms({}),
  editable: ['winningGames', 'gamePoints'],
}

export const football: Sport = {
  id: 'football',
  labelKey: 'sportsFootball',
  rules: 'singleScore',
  defaults: {
    format: { winningGames: 1 },
    matchPoints: { win: 3, draw: 1, loss: 0 },
  },
  terms: terms({
    gamesHeader: 'sportsGoals',
    gameScore: 'sportsGoalsScore',
    gamesPlural: 'sportsGoalsPlural',
  }),
  editable: [],
}

export const esports: Sport = {
  id: 'esports',
  labelKey: 'sportsEsports',
  rules: 'gamesOnly',
  defaults: { format: { winningGames: 2 }, matchPoints: { ...points } },
  terms: terms({
    gamesHeader: 'sportsMaps',
    gameScore: 'sportsMapScore',
    gamesPlural: 'sportsMapsPlural',
    winningGames: 'sportsWinningMaps',
    winningGamesHelp: 'sportsDefaultWinningMapsHelp',
    defaultWinningGames: 'sportsDefaultWinningMaps',
    defaultWinningGamesHelp: 'sportsDefaultWinningMapsHelp',
  }),
  editable: ['winningGames', 'fixedGames'],
}

export const snooker: Sport = {
  id: 'snooker',
  labelKey: 'sportsSnooker',
  rules: 'sets',
  defaults: { format: { winningGames: 3 }, matchPoints: { ...points } },
  terms: terms({
    gamesHeader: 'sportsFrames',
    gameScore: 'sportsFrameScore',
    gamesPlural: 'sportsFramesPlural',
    winningGames: 'sportsWinningFrames',
    winningGamesHelp: 'sportsDefaultWinningFramesHelp',
    defaultWinningGames: 'sportsDefaultWinningFrames',
    defaultWinningGamesHelp: 'sportsDefaultWinningFramesHelp',
  }),
  editable: ['winningGames', 'fixedGames'],
}

export const darts: Sport = {
  id: 'darts',
  labelKey: 'sportsDarts',
  rules: 'countdown',
  defaults: { format: { winningGames: 3, gamePoints: 501 }, matchPoints: { ...points } },
  terms: terms({
    gamesHeader: 'sportsLegs',
    gameScore: 'sportsLegScore',
    gamesPlural: 'sportsLegsPlural',
    winningGames: 'sportsWinningLegs',
    winningGamesHelp: 'sportsDefaultWinningLegsHelp',
    defaultWinningGames: 'sportsDefaultWinningLegs',
    defaultWinningGamesHelp: 'sportsDefaultWinningLegsHelp',
    gamePoints: 'sportsStartScore',
    gamePointsHelp: 'sportsStartScoreHelp',
  }),
  editable: ['winningGames', 'gamePoints'],
}
