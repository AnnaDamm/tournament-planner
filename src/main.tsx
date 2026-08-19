import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'
import { locale, t } from './i18n'
import { AppContent } from './components/AppContent'
import { AppLayout } from './components/AppLayout'
import type { Participant } from './components/Players'
import {
  loadCourtCount,
  loadDefaultWinningGames,
  loadParticipantType,
  loadParticipants,
  loadRounds,
  loadTournamentName,
  parseTournamentSnapshot,
  type Round,
} from './storage'
import { useTournamentStorage } from './useTournamentStorage'
import {
  createParticipant,
  swapRoundPlayers as swapRoundPlayersInRounds,
  toggleParticipantWithdrawal,
  updateRoundsForCourtCount,
} from './tournamentActions'
import { downloadTournament } from './tournamentExport'
import { sortStats } from './tournamentStats'
import {
  calculateStandings,
  createRoundPlan,
  fillUnknownRound,
  getCurrentRoundNumber,
  isUnknownParticipantId,
  rerollRound,
  startReadyRounds,
  startRoundInRounds,
} from './tournament'

if (typeof document !== 'undefined') document.documentElement.lang = locale
function App() {
  const [players, setPlayers] = useState<Participant[]>(loadParticipants)
  const [tournamentName, setTournamentName] = useState(loadTournamentName)
  const [courtCount, setCourtCount] = useState(loadCourtCount)
  const [defaultWinningGames, setDefaultWinningGames] = useState(loadDefaultWinningGames)
  const [rounds, setRounds] = useState<Round[]>(() =>
    startReadyRounds(loadRounds(), loadCourtCount()),
  )
  const [participantType, setParticipantType] = useState<'players' | 'teams'>(loadParticipantType)
  const [sort, setSort] = useState('position')
  const [desc, setDesc] = useState(true)
  const [draft, setDraft] = useState('')
  const bulkRef = useRef<HTMLDialogElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)

  useTournamentStorage(
    players,
    setPlayers,
    rounds,
    setRounds,
    participantType,
    setParticipantType,
    courtCount,
    setCourtCount,
    defaultWinningGames,
    setDefaultWinningGames,
    tournamentName,
    setTournamentName,
  )

  useEffect(() => {
    document.title = `${tournamentName} — Tournament Manager`
  }, [tournamentName])

  const standings = useMemo(() => calculateStandings(players, rounds), [players, rounds])
  const standingsBeforeRounds = useMemo(
    () => rounds.map((_, index) => calculateStandings(players, rounds.slice(0, index))),
    [players, rounds],
  )
  const stats = useMemo(
    () =>
      standings.map((player) => ({
        ...player,
        played: player.wins + player.losses,
        diff: player.scored - player.conceded,
        points: player.scored,
      })),
    [standings],
  )
  const positions = useMemo(
    () =>
      new Map(sortStats(stats, 'position', true).map((player, index) => [player.id, index + 1])),
    [stats],
  )
  const sorted = useMemo(
    () =>
      sortStats(stats, sort, desc).map((player) => ({
        ...player,
        position: positions.get(player.id) ?? 0,
      })),
    [positions, sort, desc, stats],
  )

  const participantLabel = participantType === 'teams' ? t('teams') : t('players')
  const participantPlural = participantType === 'teams' ? t('allTeams') : t('all')
  const name = (id: string) =>
    isUnknownParticipantId(id)
      ? t('notYetKnown')
      : players.find((player) => player.id === id)?.name || t('unknown')
  const recordBeforeRound = (roundIndex: number, id: string) => {
    const player = standingsBeforeRounds[roundIndex]?.find((item) => item.id === id)
    return player ? `${player.wins}:${player.losses}` : '—'
  }
  const toggleSort = (key: string) =>
    sort === key ? setDesc((value) => !value) : (setSort(key), setDesc(key !== 'name'))
  const updateRound = (index: number, matches: Round['matches']) =>
    setRounds((current) =>
      startReadyRounds(
        current.map((round, roundIndex) => (roundIndex === index ? { ...round, matches } : round)),
        courtCount,
      ),
    )
  const startRound = (number: number) => setRounds((current) => startRoundInRounds(current, number))
  const swapRoundPlayers = (roundIndex: number, draggedId: string, targetId: string) =>
    setRounds((current) => swapRoundPlayersInRounds(current, roundIndex, draggedId, targetId))

  const makeRound = () =>
    players.filter((player) => !player.withdrawn).length < 2
      ? undefined
      : setRounds((current) => {
          const number = current.length + 1
          const plan = createRoundPlan(players, current, number)
          const previousRound = current.at(-1)
          return startReadyRounds(
            [
              ...current,
              {
                number,
                bye: plan.bye,
                winningGames: previousRound?.winningGames ?? defaultWinningGames,
                courtCount: previousRound?.courtCount ?? courtCount,
                matches: plan.matches,
                standings: plan.standings,
              },
            ],
            courtCount,
          )
        })
  const addBulk = () => {
    const names = draft
      .split('\n')
      .map((nameValue) => nameValue.trim())
      .filter(Boolean)
    setPlayers((current) => [...current, ...names.map((nameValue) => createParticipant(nameValue))])
    setDraft('')
    bulkRef.current?.close()
  }
  const rename = (player: Participant, value: string) =>
    setPlayers((current) =>
      current.map((item) => (item.id === player.id ? { ...item, name: value } : item)),
    )
  const deleteAll = () => {
    setPlayers([])
    setRounds([])
    confirmRef.current?.close()
  }

  const exportTournament = () =>
    downloadTournament({
      version: 1,
      tournamentName,
      players,
      rounds,
      participantType,
      courtCount,
      defaultWinningGames,
    })

  const importTournament = async (file: File) => {
    try {
      const snapshot = parseTournamentSnapshot(JSON.parse(await file.text()))
      if (!snapshot) return false
      setTournamentName(snapshot.tournamentName)
      setPlayers(snapshot.players)
      setRounds(snapshot.rounds)
      setParticipantType(snapshot.participantType)
      setCourtCount(snapshot.courtCount)
      setDefaultWinningGames(snapshot.defaultWinningGames)
      return true
    } catch {
      return false
    }
  }

  return (
    <AppLayout
      tournamentName={tournamentName}
      participantLabel={participantLabel}
      playerCount={players.filter((player) => !player.withdrawn).length}
      roundCount={rounds.length}
      currentRound={getCurrentRoundNumber(rounds, courtCount)}
    >
      <AppContent
        tournamentName={tournamentName}
        players={players}
        participantLabel={participantLabel}
        participantPlural={participantPlural}
        rounds={rounds}
        participantType={participantType}
        courtCount={courtCount}
        defaultWinningGames={defaultWinningGames}
        name={name}
        record={recordBeforeRound}
        sorted={sorted}
        sort={sort}
        desc={desc}
        onAdd={() => bulkRef.current?.showModal()}
        onDeleteParticipant={(id) =>
          setPlayers((current) => current.filter((player) => player.id !== id))
        }
        onRename={rename}
        onToggleWithdraw={(id) => setPlayers((current) => toggleParticipantWithdrawal(current, id))}
        onToggleSort={toggleSort}
        onCreateRound={makeRound}
        onStartRound={startRound}
        onUpdateRound={updateRound}
        onSetRoundSettings={(number, winningGames, roundCourtCount) =>
          setRounds((current) =>
            current.map((round) =>
              round.number === number
                ? { ...round, winningGames, courtCount: roundCourtCount }
                : round,
            ),
          )
        }
        onDeleteRound={(number) =>
          setRounds((current) => current.filter((round) => round.number !== number))
        }
        onFillUnknown={(number) =>
          setRounds((current) => {
            const index = current.findIndex((round) => round.number === number)
            if (index < 0) return current
            const previousRounds = current.slice(0, index)
            const filled = fillUnknownRound(current[index], players, previousRounds)
            return current.map((round, roundIndex) => (roundIndex === index ? filled : round))
          })
        }
        onReroll={(number) => setRounds((current) => rerollRound(players, current, number))}
        onSwapPlayers={swapRoundPlayers}
        setParticipantType={setParticipantType}
        setCourtCount={(value) => {
          setCourtCount(value)
          setRounds((current) => updateRoundsForCourtCount(current, value))
        }}
        setDefaultWinningGames={setDefaultWinningGames}
        setTournamentName={setTournamentName}
        onExport={exportTournament}
        onImport={importTournament}
        bulkRef={bulkRef}
        confirmRef={confirmRef}
        draft={draft}
        setDraft={setDraft}
        onAddParticipants={addBulk}
        onDeleteAllConfirmed={deleteAll}
        onDeleteAll={() => confirmRef.current?.showModal()}
      />
    </AppLayout>
  )
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>,
)
