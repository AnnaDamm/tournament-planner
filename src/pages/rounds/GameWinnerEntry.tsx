import styles from './GameWinnerEntry.module.css'
import sharedStyles from '../../styles/shared.module.css'
import { classNames } from '../../styles/classNames'
import type { CSSProperties } from 'react'
import { tf } from '../../i18n'
import { useTerm } from '../../i18n/useTerm'
import type { SetScore } from '../../tournamentTypes'

type Props = {
  draftGames: SetScore[]
  visibleGameCount: number
  gameCount: number
  playerA: string
  playerB: string
  setGame: (gameIndex: number, game: SetScore) => void
  scheduleCommit: () => void
  keyboardMoveActive?: boolean
}

const WIN_A: SetScore = { a: '1', b: '0' }
const WIN_B: SetScore = { a: '0', b: '1' }

/** Games without points (e.g. eSports maps): each game only selects its winner. */
export function GameWinnerEntry({
  draftGames,
  visibleGameCount,
  gameCount,
  playerA,
  playerB,
  setGame,
  scheduleCommit,
  keyboardMoveActive = false,
}: Props) {
  const term = useTerm()
  const style = { '--set-count': gameCount } as CSSProperties
  return (
    <div
      className={classNames(sharedStyles, styles, 'game-winners')}
      style={style}
      inert={keyboardMoveActive}
    >
      {Array.from({ length: visibleGameCount }, (_, index) => {
        const game = draftGames[index] ?? { a: '', b: '' }
        const choose = (value: SetScore) => {
          const same = game.a === value.a && game.b === value.b
          setGame(index, same ? { a: '', b: '' } : value)
          scheduleCommit()
        }
        return (
          <fieldset key={index} className={classNames(sharedStyles, styles, 'game-winner')}>
            <legend className={classNames(sharedStyles, 'sr-only')}>
              {term('gameScore')} {index + 1}
            </legend>
            {[
              { value: WIN_A, name: playerA, text: '1 : 0' },
              { value: WIN_B, name: playerB, text: '0 : 1' },
            ].map((option) => (
              <button
                key={option.text}
                type="button"
                className={classNames(sharedStyles, styles, 'game-winner-button')}
                aria-pressed={game.a === option.value.a && game.b === option.value.b}
                aria-label={`${term('gameScore')} ${index + 1}: ${tf('sportsOutcomeWins', { name: option.name })}`}
                title={tf('sportsOutcomeWins', { name: option.name })}
                onClick={() => choose(option.value)}
              >
                {option.text}
              </button>
            ))}
          </fieldset>
        )
      })}
    </div>
  )
}
