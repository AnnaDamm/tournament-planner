import { Navigate, Route, Routes } from 'react-router-dom'
import { Players, type Participant } from './Players'
import { Rounds } from './Rounds'
import { SettingsPage } from './SettingsPage'
import { Table, type Stat } from './Table'
import type { Match, Round } from '../storage'

type Props = {
  players: Participant[]
  participantLabel: string
  participantPlural: string
  rounds: Round[]
  participantType: 'players' | 'teams'
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  sorted: Stat[]
  desc: boolean
  onAdd: () => void
  onDeleteParticipant: (id: string) => void
  onRename: (player: Participant, name: string) => void
  onToggleWithdraw: (id: string) => void
  onToggleSort: (key: string) => void
  onCreateRound: () => void
  onUpdateRound: (index: number, matches: Match[]) => void
  onSetWinningGames: (number: number, value: number) => void
  onDeleteRound: (number: number) => void
  onFillUnknown: (number: number) => void
  onSwapPlayers: (roundIndex: number, draggedId: string, targetId: string) => void
  setParticipantType: (value: 'players' | 'teams') => void
  onDeleteAll: () => void
}

export function AppRoutes({
  players,
  participantLabel,
  participantPlural,
  rounds,
  participantType,
  name,
  record,
  sorted,
  desc,
  onAdd,
  onDeleteParticipant,
  onRename,
  onToggleWithdraw,
  onToggleSort,
  onCreateRound,
  onUpdateRound,
  onSetWinningGames,
  onDeleteRound,
  onFillUnknown,
  onSwapPlayers,
  setParticipantType,
  onDeleteAll,
}: Props) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/participants" replace />} />
      <Route
        path="/participants"
        element={
          <Players
            players={players}
            participantLabel={participantLabel}
            participantPlural={participantPlural}
            rounds={rounds}
            name={name}
            onAdd={onAdd}
            onDelete={onDeleteParticipant}
            onRename={onRename}
            onToggleWithdraw={onToggleWithdraw}
          />
        }
      />
      <Route
        path="/table"
        element={<Table sorted={sorted} toggleSort={onToggleSort} desc={desc} />}
      />
      <Route
        path="/rounds"
        element={
          <Rounds
            rounds={rounds}
            players={players}
            name={name}
            record={record}
            onCreate={onCreateRound}
            onUpdate={onUpdateRound}
            onSetWinningGames={onSetWinningGames}
            onDelete={onDeleteRound}
            onFillUnknown={onFillUnknown}
            onSwapPlayers={onSwapPlayers}
          />
        }
      />
      <Route
        path="/settings"
        element={
          <SettingsPage
            participantType={participantType}
            setParticipantType={setParticipantType}
            onDeleteAll={onDeleteAll}
          />
        }
      />
    </Routes>
  )
}
