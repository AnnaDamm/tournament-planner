import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'
import { locale, t } from './i18n'
import { AppDialogs } from './components/AppDialogs'
import { AppLayout } from './components/AppLayout'
import { AppRoutes } from './components/AppRoutes'
import type { Participant } from './components/Players'
import {
  loadParticipantType,
  loadParticipants,
  loadRounds,
  saveParticipantType,
  saveParticipants,
  saveRounds,
  type Round,
} from './storage'
import {
  calculateStandings,
  createRoundPlan,
  fillUnknownRound,
  getCurrentRoundNumber,
  hasEnteredScore,
  isRoundComplete,
  isUnknownParticipantId,
} from './tournament'

const uid = () => Math.random().toString(36).slice(2, 9)

const toggleWithdrawal = (setPlayers: Dispatch<SetStateAction<Participant[]>>, id: string) =>
  setPlayers((current) =>
    current.map((player) =>
      player.id === id ? { ...player, withdrawn: !player.withdrawn } : player,
    ),
  )

function App() {
  const [players, setPlayers] = useState<Participant[]>(loadParticipants)
  const [rounds, setRounds] = useState<Round[]>(loadRounds)
  const [participantType, setParticipantType] = useState<'players' | 'teams'>(loadParticipantType)
  const [sort, setSort] = useState('wins')
  const [desc, setDesc] = useState(true)
  const [draft, setDraft] = useState('')
  const bulkRef = useRef<HTMLDialogElement>(null)
  const confirmRef = useRef<HTMLDialogElement>(null)

  useEffect(() => saveParticipants(players), [players])
  useEffect(() => saveRounds(rounds), [rounds])
  useEffect(() => saveParticipantType(participantType), [participantType])

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
  const sorted = useMemo(
    () =>
      [...stats].sort((a, b) => {
        const value =
          sort === 'name'
            ? a.name.localeCompare(b.name)
            : Number(a[sort as keyof typeof a]) - Number(b[sort as keyof typeof b])
        return (desc ? -1 : 1) * (value || a.name.localeCompare(b.name))
      }),
    [stats, sort, desc],
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
      current.map((round, roundIndex) => (roundIndex === index ? { ...round, matches } : round)),
    )
  const swapRoundPlayers = (roundIndex: number, draggedId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    setRounds((current) =>
      current.map((round, index) => {
        if (index !== roundIndex) return round
        if (isRoundComplete(round)) return round
        const draggedMatch = round.matches.find(
          (match) => match.a === draggedId || match.b === draggedId,
        )
        const targetMatch = round.matches.find(
          (match) => match.a === targetId || match.b === targetId,
        )
        if (draggedMatch && hasEnteredScore(draggedMatch)) return round
        if (targetMatch && hasEnteredScore(targetMatch)) return round
        return {
          ...round,
          bye: round.bye === draggedId ? targetId : round.bye === targetId ? draggedId : round.bye,
          matches: round.matches.map((match) => ({
            ...match,
            a: match.a === draggedId ? targetId : match.a === targetId ? draggedId : match.a,
            b: match.b === draggedId ? targetId : match.b === targetId ? draggedId : match.b,
          })),
        }
      }),
    )
  }

  const makeRound = () =>
    players.filter((player) => !player.withdrawn).length < 2
      ? undefined
      : setRounds((current) => {
          const number = current.length + 1
          const plan = createRoundPlan(players, current, number)
          return [
            ...current,
            {
              number,
              bye: plan.bye,
              winningGames: 1,
              matches: plan.matches,
              standings: plan.standings,
            },
          ]
        })
  const addBulk = () => {
    const names = draft
      .split('\n')
      .map((nameValue) => nameValue.trim())
      .filter(Boolean)
    setPlayers((current) => [
      ...current,
      ...names.map((nameValue) => ({
        id: uid(),
        name: nameValue,
        wins: 0,
        losses: 0,
        scored: 0,
        conceded: 0,
      })),
    ])
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

  useEffect(() => {
    document.documentElement.lang = locale
  }, [])

  return (
    <AppLayout
      participantLabel={participantLabel}
      playerCount={players.filter((player) => !player.withdrawn).length}
      roundCount={rounds.length}
      currentRound={getCurrentRoundNumber(rounds)}
    >
      <AppRoutes
        players={players}
        participantLabel={participantLabel}
        participantPlural={participantPlural}
        rounds={rounds}
        participantType={participantType}
        name={name}
        record={recordBeforeRound}
        sorted={sorted}
        desc={desc}
        onAdd={() => bulkRef.current?.showModal()}
        onDeleteParticipant={(id) =>
          setPlayers((current) => current.filter((player) => player.id !== id))
        }
        onRename={rename}
        onToggleWithdraw={(id) => toggleWithdrawal(setPlayers, id)}
        onToggleSort={toggleSort}
        onCreateRound={makeRound}
        onUpdateRound={updateRound}
        onSetWinningGames={(number, value) =>
          setRounds((current) =>
            current.map((round) =>
              round.number === number ? { ...round, winningGames: value } : round,
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
        onSwapPlayers={swapRoundPlayers}
        setParticipantType={setParticipantType}
        onDeleteAll={() => confirmRef.current?.showModal()}
      />
      <AppDialogs
        participantType={participantType}
        bulkRef={bulkRef}
        confirmRef={confirmRef}
        draft={draft}
        setDraft={setDraft}
        onAdd={addBulk}
        onDeleteAll={deleteAll}
      />
    </AppLayout>
  )
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
