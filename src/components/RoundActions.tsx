import { Dices, ListPlus, Play, Settings2, X } from 'lucide-react'
import { t } from '../i18n'
import { hasEnteredScore, isUnknownParticipantId } from '../tournament'
import type { Round } from '../tournamentTypes'

type Props = {
  round: Round
  onSettings: () => void
  onStart: () => void
  onFillUnknown: () => void
  onReroll: () => void
  onDelete: () => void
}

export function RoundActions({
  round,
  onSettings,
  onStart,
  onFillUnknown,
  onReroll,
  onDelete,
}: Props) {
  const isUnstarted = round.matches.every((match) => !hasEnteredScore(match))
  return (
    <div className="round-actions">
      <button
        className="button ghost"
        type="button"
        aria-label={t('roundSettings')}
        title={t('roundSettings')}
        onClick={onSettings}
      >
        <Settings2 size={16} aria-hidden="true" />
      </button>
      {!round.startedAt && (
        <button
          className="button ghost"
          type="button"
          aria-label={t('startRound')}
          title={t('startRound')}
          onClick={onStart}
        >
          <Play size={14} aria-hidden="true" />
        </button>
      )}
      {round.matches.some(
        (match) => isUnknownParticipantId(match.a) || isUnknownParticipantId(match.b),
      ) && (
        <button
          className="button ghost"
          type="button"
          aria-label={t('fillMore')}
          title={t('fillMore')}
          onClick={onFillUnknown}
        >
          <ListPlus size={16} aria-hidden="true" />
        </button>
      )}
      {isUnstarted && (
        <button
          className="button ghost"
          type="button"
          aria-label={t('reroll')}
          title={t('reroll')}
          onClick={onReroll}
        >
          <Dices size={16} aria-hidden="true" />
        </button>
      )}
      {!round.matches.some((match) => match.scoreA || match.scoreB) && (
        <button
          className="button danger"
          type="button"
          aria-label={t('deleteRound')}
          title={t('deleteRound')}
          onClick={onDelete}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
