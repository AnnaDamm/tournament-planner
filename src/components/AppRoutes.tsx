import { Navigate, Route, Routes } from 'react-router-dom'
import type { LocalMasterConfig } from '../liveSharing'
import type { Participant, Round, TournamentSettings } from '../tournamentTypes'
import { hasEnteredScore } from '../tournament'
import { Rounds } from './Rounds'
import { SettingsPage } from './SettingsPage'
import { SharePage } from './SharePage'
import { Table, type Stat } from './Table'
import { DocumentationPage } from './DocumentationPage'

export type AppRoutesProps = {
  localMaster: LocalMasterConfig | null
  readOnly: boolean
  players: Participant[]
  participantLabel: string
  rounds: Round[]
  participantType: 'players' | 'teams'
  courtCount: number
  defaultWinningGames: number
  settings: TournamentSettings
  name: (id: string) => string
  record: (roundIndex: number, id: string) => string
  participantOrderByRound: string[][]
  sorted: Stat[]
  sort: string
  desc: boolean
  onAdd: () => void
  onToggleSort: (key: string) => void
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onDeleteAll: () => void
}

export function AppRoutes({
  localMaster,
  readOnly,
  players,
  participantLabel,
  rounds,
  courtCount,
  defaultWinningGames,
  settings,
  name,
  record,
  participantOrderByRound,
  sorted,
  sort,
  desc,
  onAdd,
  onToggleSort,
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
            defaultSetPoints={settings.defaultSetPoints}
            participantLabel={participantLabel}
            rounds={rounds}
            name={name}
            sort={sort}
            toggleSort={onToggleSort}
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
          <Rounds
            rounds={rounds}
            players={players}
            participantOrderByRound={participantOrderByRound}
            name={name}
            record={record}
            defaultCourtCount={courtCount}
            defaultWinningGames={defaultWinningGames}
            defaultSetPoints={settings.defaultSetPoints}
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
            <SettingsPage onExport={onExport} onImport={onImport} onDeleteAll={onDeleteAll} />
          )
        }
      />
      <Route path="/docs" element={<DocumentationPage />} />
      <Route path="/docs/:slug" element={<DocumentationPage />} />
    </Routes>
  )
}
