import { Navigate, Route, Routes } from 'react-router-dom'
import type { LocalMasterConfig } from '../liveSharing'
import type { Match, Participant, Round } from '../tournamentTypes'
import { Rounds } from './Rounds'
import { SettingsPage } from './SettingsPage'
import { SharePage } from './SharePage'
import { Table, type Stat } from './Table'
import { DocumentationPage } from './DocumentationPage'

export type AppRoutesProps = {
  tournamentName: string
  localMaster: LocalMasterConfig | null
  readOnly: boolean
  players: Participant[]
  participantLabel: string
  rounds: Round[]
  participantType: 'players' | 'teams'
  courtCount: number
  defaultWinningGames: number
  scheduledStart: string
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  participantOrderByRound: string[][]
  sorted: Stat[]
  sort: string
  desc: boolean
  onAdd: () => void
  onDeleteParticipant: (id: string) => void
  onRename: (player: Participant, name: string) => void
  onToggleWithdraw: (id: string) => void
  onReorderParticipants: (draggedId: string, targetId: string) => void
  onShuffleParticipants: () => void
  onToggleSort: (key: string) => void
  onCreateRound: () => void
  onStartRound: (number: number) => void
  onUpdateRound: (index: number, matches: Match[]) => void
  onSetRoundSettings: (number: number, winningGames: number, courtCount: number) => void
  onDeleteRound: (number: number) => void
  onFillUnknown: (number: number) => void
  onReroll: (number: number) => void
  onSwapPlayers: (roundIndex: number, draggedId: string, targetId: string) => void
  setParticipantType: (value: 'players' | 'teams') => void
  setCourtCount: (value: number) => void
  setDefaultWinningGames: (value: number) => void
  setTournamentName: (value: string) => void
  setScheduledStart: (value: string) => void
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

export function AppRoutes({
  tournamentName,
  localMaster,
  readOnly,
  players,
  participantLabel,
  rounds,
  participantType,
  courtCount,
  defaultWinningGames,
  scheduledStart,
  name,
  record,
  participantOrderByRound,
  sorted,
  sort,
  desc,
  onAdd,
  onDeleteParticipant,
  onRename,
  onToggleWithdraw,
  onReorderParticipants,
  onShuffleParticipants,
  onToggleSort,
  onCreateRound,
  onStartRound,
  onUpdateRound,
  onSetRoundSettings,
  onDeleteRound,
  onFillUnknown,
  onReroll,
  onSwapPlayers,
  setParticipantType,
  setCourtCount,
  setDefaultWinningGames,
  setTournamentName,
  setScheduledStart,
  onExport,
  onImport,
  onDeleteAll,
}: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/table" replace />} />
      <Route path="/participants" element={<Navigate to="/table" replace />} />
      <Route
        path="/table"
        element={
          <Table
            sorted={sorted}
            players={players}
            defaultCourtCount={courtCount}
            participantLabel={participantLabel}
            rounds={rounds}
            name={name}
            sort={sort}
            toggleSort={onToggleSort}
            desc={desc}
            onAdd={onAdd}
            onDelete={onDeleteParticipant}
            onRename={onRename}
            onToggleWithdraw={onToggleWithdraw}
            onReorder={onReorderParticipants}
            onShuffle={onShuffleParticipants}
            canSeed={!readOnly && !rounds.some((round) => round.startedAt)}
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
          <Rounds
            rounds={rounds}
            players={players}
            participantOrderByRound={participantOrderByRound}
            name={name}
            record={record}
            defaultCourtCount={courtCount}
            defaultWinningGames={defaultWinningGames}
            onCreate={onCreateRound}
            onStart={onStartRound}
            onUpdate={onUpdateRound}
            onSetRoundSettings={onSetRoundSettings}
            onDelete={onDeleteRound}
            onFillUnknown={onFillUnknown}
            onReroll={onReroll}
            onSwapPlayers={onSwapPlayers}
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
              tournamentName={tournamentName}
              setTournamentName={setTournamentName}
              participantType={participantType}
              setParticipantType={setParticipantType}
              courtCount={courtCount}
              setCourtCount={setCourtCount}
              defaultWinningGames={defaultWinningGames}
              setDefaultWinningGames={setDefaultWinningGames}
              scheduledStart={scheduledStart}
              setScheduledStart={setScheduledStart}
              onExport={onExport}
              onImport={onImport}
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
