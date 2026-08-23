import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { LocalMasterConfig } from '../liveSharing'
import { t } from '../i18n'
import { downloadTournament } from '../tournamentExport'
import { parseTournamentSnapshot } from '../tournamentSnapshot'
import { hasEnteredScore, getMatchResult, isUnknownParticipantId } from '../tournament'
import {
  selectCourtCount,
  selectDefaultSetPoints,
  selectDefaultWinningGames,
  selectParticipantOrderByRound,
  selectParticipantType,
  selectPlayers,
  selectRounds,
  selectScheduledRounds,
  selectSortedParticipants,
  selectStandingsBeforeRounds,
} from '../tournamentSelectors'
import { importTournamentSnapshot } from '../tournamentCommands'
import { useAppDispatch, useAppSelector, useAppStore } from '../storeHooks'
import { DocumentationPage } from '../pages/documentation/DocumentationPage'
import { RankingsPage } from '../pages/rankings/RankingsPage'
import { RoundsPage } from '../pages/rounds/RoundsPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { SharePage } from '../pages/share/SharePage'

export type AppRoutesProps = {
  localMaster: LocalMasterConfig | null
  readOnly: boolean
  onAdd: () => void
  onDeleteAll: () => void
  onKeyboardMoveActiveChange: (active: boolean) => void
}

export function AppRoutes({
  localMaster,
  readOnly,
  onAdd,
  onDeleteAll,
  onKeyboardMoveActiveChange,
}: AppRoutesProps) {
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const [sort, setSort] = useState('position')
  const [desc, setDesc] = useState(true)
  const players = useAppSelector(selectPlayers)
  const rounds = useAppSelector(selectRounds)
  const scheduledRounds = useAppSelector(selectScheduledRounds)
  const participantOrderByRound = useAppSelector(selectParticipantOrderByRound)
  const defaultSetPoints = useAppSelector(selectDefaultSetPoints)
  const defaultWinningGames = useAppSelector(selectDefaultWinningGames)
  const courtCount = useAppSelector(selectCourtCount)
  const participantType = useAppSelector(selectParticipantType)
  const standingsBeforeRounds = useAppSelector(selectStandingsBeforeRounds)
  const sorted = useAppSelector((state) => selectSortedParticipants(state, sort, desc))
  const participantLabel = participantType === 'teams' ? t('teams') : t('players')

  const name = useCallback(
    (id: string) =>
      isUnknownParticipantId(id)
        ? t('notYetKnown')
        : players.find((player) => player.id === id)?.name || t('unknown'),
    [players],
  )
  const record = useCallback(
    (roundIndex: number, id: string) => {
      const player = standingsBeforeRounds[roundIndex]?.find((item) => item.id === id)
      if (!player) return '—'

      const round = rounds[roundIndex]
      const match = round?.matches.find((item) => item.a === id || item.b === id)
      const result = match ? getMatchResult(match, Math.max(1, round.winningGames || 1)) : null
      const isBye = round?.bye === id
      const nextWins = result?.winner === id || isBye ? player.wins + 1 : player.wins

      return result || isBye ? `${player.wins} → ${nextWins}` : String(player.wins)
    },
    [rounds, standingsBeforeRounds],
  )
  const toggleSort = useCallback(
    (key: string) => {
      if (sort === key) setDesc((value) => !value)
      else {
        setSort(key)
        setDesc(key !== 'name')
      }
    },
    [sort],
  )
  const exportTournament = useCallback(
    () => downloadTournament(store.getState().tournament),
    [store],
  )
  const importTournament = useCallback(
    async (file: File) => {
      try {
        const imported = parseTournamentSnapshot(JSON.parse(await file.text()))
        if (!imported) return false
        dispatch(importTournamentSnapshot(imported))
        return true
      } catch {
        return false
      }
    },
    [dispatch],
  )

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/table" replace />} />
      <Route path="/participants" element={<Navigate to="/table" replace />} />
      <Route
        path="/table"
        element={
          <RankingsPage
            sorted={sorted}
            players={players}
            defaultCourtCount={courtCount}
            defaultSetPoints={defaultSetPoints}
            participantLabel={participantLabel}
            rounds={scheduledRounds}
            name={name}
            sort={sort}
            toggleSort={toggleSort}
            desc={desc}
            onAdd={onAdd}
            canSeed={
              !readOnly &&
              !rounds.some((round) => round.matches.some((match) => hasEnteredScore(match)))
            }
            readOnly={readOnly}
          />
        }
      />
      <Route
        path="/share"
        element={
          localMaster ? (
            <SharePage viewerUrl={localMaster.viewerUrl} />
          ) : (
            <Navigate to="/table" replace />
          )
        }
      />
      <Route
        path="/rounds"
        element={
          <RoundsPage
            rounds={scheduledRounds}
            players={players}
            participantOrderByRound={participantOrderByRound}
            name={name}
            record={record}
            defaultCourtCount={courtCount}
            defaultWinningGames={defaultWinningGames}
            defaultSetPoints={defaultSetPoints}
            onKeyboardMoveActiveChange={onKeyboardMoveActiveChange}
            readOnly={readOnly}
          />
        }
      />
      <Route
        path="/settings"
        element={
          readOnly ? (
            <Navigate to="/table" replace />
          ) : (
            <SettingsPage
              onExport={exportTournament}
              onImport={importTournament}
              onDeleteAll={onDeleteAll}
            />
          )
        }
      />
      <Route path="/docs" element={<DocumentationPage />} />
      <Route path="/docs/:slug" element={<DocumentationPage />} />
    </Routes>
  )
}
