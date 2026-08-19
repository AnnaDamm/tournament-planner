import { Navigate, Route, Routes } from 'react-router-dom'
import type { Participant } from './Participant'
import { Rounds } from './Rounds'
import { SettingsPage } from './SettingsPage'
import { Table, type Stat } from './Table'
import type { Match, Round } from '../storage'

export type AppRoutesProps = {
  tournamentName: string
  players: Participant[]
  participantLabel: string
  rounds: Round[]
  participantType: 'players' | 'teams'
  courtCount: number
  defaultWinningGames: number
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  sorted: Stat[]
  sort: string
  desc: boolean
  onAdd: () => void
  onDeleteParticipant: (id: string) => void
  onRename: (player: Participant, name: string) => void
  onToggleWithdraw: (id: string) => void
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
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

export function AppRoutes({
  tournamentName,
  players,
  participantLabel,
  rounds,
  participantType,
  courtCount,
  defaultWinningGames,
  name,
  record,
  sorted,
  sort,
  desc,
  onAdd,
  onDeleteParticipant,
  onRename,
  onToggleWithdraw,
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
          />
        }
      />
      <Route
        path="/rounds"
        element={
          <Rounds
            rounds={rounds}
            players={players}
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
          />
        }
      />
      <Route
        path="/settings"
        element={
          <SettingsPage
            tournamentName={tournamentName}
            setTournamentName={setTournamentName}
            participantType={participantType}
            setParticipantType={setParticipantType}
            courtCount={courtCount}
            setCourtCount={setCourtCount}
            defaultWinningGames={defaultWinningGames}
            setDefaultWinningGames={setDefaultWinningGames}
            onExport={onExport}
            onImport={onImport}
            onDeleteAll={onDeleteAll}
          />
        }
      />
    </Routes>
  )
}
