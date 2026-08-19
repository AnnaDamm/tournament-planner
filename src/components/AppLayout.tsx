import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  QrCode,
  Settings2,
  Trophy,
  Wifi,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { t } from '../i18n'
import type { LocalMasterConfig } from '../liveSharing'

type Props = {
  tournamentName: string
  localMaster: LocalMasterConfig | null
  readOnly: boolean
  isLive: boolean
  participantNames: string[]
  participantTargets: { participantName: string; participantId: string }[]
  nextMatchTargets: { participantName: string; matchId: string }[]
  roundCount: number
  currentRound: number
  children: ReactNode
}

type WindowWithFind = typeof window & {
  find: (
    text: string,
    caseSensitive?: boolean,
    backwards?: boolean,
    wrapAround?: boolean,
    wholeWord?: boolean,
    searchInFrames?: boolean,
    showDialog?: boolean,
  ) => boolean
}

const findPlayer = (term: string, backwards = false) => {
  if (!term.trim()) return
  window.setTimeout(
    () => (window as WindowWithFind).find(term.trim(), false, backwards, true, false, false, false),
    0,
  )
}

const scrollToTarget = (elementId: string, attemptsLeft = 10) => {
  window.setTimeout(() => {
    const targetElement = document.getElementById(elementId)
    if (!targetElement) {
      if (attemptsLeft > 1) scrollToTarget(elementId, attemptsLeft - 1)
      return
    }
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    targetElement.classList.add('search-target')
    window.setTimeout(() => targetElement.classList.remove('search-target'), 1800)
  }, 25)
}

// The layout owns the persistent cross-route search controls and their page-specific navigation.
// oxlint-disable-next-line eslint/max-lines-per-function
export function AppLayout({
  tournamentName,
  localMaster,
  readOnly,
  isLive,
  participantNames,
  participantTargets,
  nextMatchTargets,
  roundCount,
  currentRound,
  children,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'
  const searchPopoverRef = useRef<HTMLDivElement>(null)
  const findingCursorRef = useRef({ key: '', index: -1 })
  const matchCursorRef = useRef({ key: '', index: -1 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [pageFindingCount, setPageFindingCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('search') ?? '',
  )
  const pathWithSearch = (pathname: string) => ({ pathname, hash: window.location.hash })
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const isTablePage = location.pathname === '/table'
  const matchingParticipants = normalizedSearch
    ? participantTargets.filter(({ participantName }) =>
        participantName.toLocaleLowerCase().includes(normalizedSearch),
      )
    : []
  const matchingMatchIds = normalizedSearch
    ? [
        ...new Set(
          nextMatchTargets
            .filter(({ participantName }) =>
              participantName.toLocaleLowerCase().includes(normalizedSearch),
            )
            .map(({ matchId }) => matchId),
        ),
      ]
    : []
  const findingCount = isTablePage ? matchingParticipants.length : pageFindingCount
  const navigateFinding = (direction: 1 | -1) => {
    if (!isTablePage) {
      findPlayer(searchTerm, direction < 0)
      return
    }
    const cursor = findingCursorRef.current
    const nextIndex =
      cursor.key === normalizedSearch
        ? (cursor.index + direction + matchingParticipants.length) % matchingParticipants.length
        : direction > 0
          ? 0
          : matchingParticipants.length - 1
    findingCursorRef.current = { key: normalizedSearch, index: nextIndex }
    scrollToTarget(`player-${matchingParticipants[nextIndex].participantId}`)
  }
  const updateSearch = (value: string) => {
    setSearchTerm(value)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    if (value.trim()) hashParams.set('search', value)
    else hashParams.delete('search')
    const hash = hashParams.toString()
    window.history.replaceState(
      null,
      '',
      `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`,
    )
    if (!value.trim()) window.getSelection()?.removeAllRanges()
  }

  useEffect(() => {
    const readHash = () => {
      const term = new URLSearchParams(window.location.hash.slice(1)).get('search') ?? ''
      setSearchTerm(term)
    }
    window.addEventListener('hashchange', readHash)
    return () => window.removeEventListener('hashchange', readHash)
  }, [])

  useEffect(() => {
    if (searchTerm) findPlayer(searchTerm)
  }, [location.pathname, searchTerm])

  useEffect(() => {
    if (!normalizedSearch || isTablePage) {
      // oxlint-disable-next-line react/set-state-in-effect
      setPageFindingCount(0)
      return
    }
    const content = document.querySelector('.content')?.textContent?.toLocaleLowerCase() ?? ''
    let count = 0
    let position = 0
    while ((position = content.indexOf(normalizedSearch, position)) >= 0) {
      count += 1
      position += normalizedSearch.length
    }
    // oxlint-disable-next-line react/set-state-in-effect
    setPageFindingCount(count)
  }, [children, isTablePage, location.pathname, normalizedSearch])

  useEffect(() => {
    if (!searchOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!searchPopoverRef.current?.contains(event.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [searchOpen])
  const navigation = [
    { label: t('table'), target: '/table', icon: BarChart3 },
    { label: t('rounds'), target: '/rounds', icon: Trophy },
  ]

  const closeMobileNav = () => document.getElementById('mobile-nav-close')?.click()

  const renderNavigation = (mobile = false) => (
    <>
      {mobile && (
        <div className="mobile-nav-head">
          <div className="side-label">{t('tournament')}</div>
          <button
            className="icon-btn mobile-nav-close"
            id="mobile-nav-close"
            type="button"
            aria-label={t('close')}
            popoverTarget="mobile-nav"
            popoverTargetAction="hide"
          >
            <X size={20} />
          </button>
        </div>
      )}
      {!mobile && <div className="side-label">{t('tournament')}</div>}
      {navigation.map(({ label, target, icon: Icon }) => (
        <NavLink
          key={target}
          to={pathWithSearch(target)}
          onClick={mobile ? closeMobileNav : undefined}
          className={`nav-item ${location.pathname === target ? 'active' : ''}`}
        >
          <Icon size={18} />
          {label}
          {target === '/rounds' && (
            <span className="nav-badge">
              {currentRound} / {roundCount}
            </span>
          )}
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="app-shell">
      <header>
        <button
          className="icon-btn mobile-nav-trigger"
          type="button"
          aria-label={t('menu')}
          aria-controls="mobile-nav"
          popoverTarget="mobile-nav"
          popoverTargetAction="toggle"
        >
          <Menu size={21} />
        </button>
        <div className="brand">
          <div className="brand-mark">
            <Trophy size={20} />
          </div>
          <h1 className="brand-title" title={tournamentName}>
            <Link to={pathWithSearch('/table')}>{tournamentName}</Link>
          </h1>
        </div>
        <div className="header-actions">
          <div className="search-control" ref={searchPopoverRef}>
            <button
              className={`icon-btn search-trigger ${searchTerm ? 'active' : ''}`}
              type="button"
              aria-label={t('playerSearch')}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search size={18} />
            </button>
            {searchOpen && (
              <div className="search-popover">
                <div className="search-input-wrap">
                  <Search size={16} />
                  <input
                    autoFocus
                    type="search"
                    list="participant-search-options"
                    value={searchTerm}
                    placeholder={t('playerSearch')}
                    aria-label={t('playerSearch')}
                    onChange={(event) => updateSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') findPlayer(searchTerm)
                      if (event.key === 'Escape') setSearchOpen(false)
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      aria-label={t('clearSearch')}
                      onClick={() => updateSearch('')}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <datalist id="participant-search-options">
                  {participantNames.map((name, index) => (
                    <option value={name} key={`${name}-${index}`} />
                  ))}
                </datalist>
                {findingCount > 1 && (
                  <div className="finding-navigation">
                    <button
                      type="button"
                      aria-label={t('previousFinding')}
                      title={t('previousFinding')}
                      onClick={() => navigateFinding(-1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>{findingCount}</span>
                    <button
                      type="button"
                      aria-label={t('nextFinding')}
                      title={t('nextFinding')}
                      onClick={() => navigateFinding(1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                <button
                  className="next-match-button"
                  type="button"
                  disabled={matchingMatchIds.length === 0}
                  onClick={() => {
                    if (matchingMatchIds.length === 0) return
                    const cursor = matchCursorRef.current
                    const nextIndex =
                      cursor.key === normalizedSearch
                        ? (cursor.index + 1) % matchingMatchIds.length
                        : 0
                    matchCursorRef.current = { key: normalizedSearch, index: nextIndex }
                    if (location.pathname !== '/rounds') {
                      navigate(pathWithSearch('/rounds'))
                    }
                    scrollToTarget(`match-${matchingMatchIds[nextIndex]}`)
                  }}
                >
                  {matchingMatchIds.length ? t('nextMatch') : t('noNextMatch')}{' '}
                  <ChevronDown size={15} />
                </button>
              </div>
            )}
          </div>
          <button
            className="icon-btn"
            aria-label={t('documentation')}
            title={t('documentation')}
            onClick={() => navigate(pathWithSearch('/docs'))}
          >
            <BookOpen size={18} />
          </button>
          {localMaster && (
            <>
              <button
                className="icon-btn"
                aria-label={t('networkDocumentation')}
                title={t('networkDocumentation')}
                onClick={() => navigate(pathWithSearch('/network'))}
              >
                <Wifi size={18} />
              </button>
              <button
                className="icon-btn"
                aria-label={t('viewerQrCode')}
                title={t('viewerQrCode')}
                onClick={() => navigate(pathWithSearch('/share'))}
              >
                <QrCode size={18} />
              </button>
              <span
                className={`live-indicator ${isLive ? 'is-live' : 'is-offline'}`}
                role="status"
                aria-label={isLive ? t('liveConnectionOnline') : t('liveConnectionOffline')}
                title={isLive ? t('liveConnectionOnline') : t('liveConnectionOffline')}
              >
                <span aria-hidden="true" />
              </span>
            </>
          )}
          {!readOnly && (
            <>
              <button
                className="icon-btn settings-trigger"
                aria-label={isSettingsPage ? t('back') : t('settings')}
                onClick={() =>
                  isSettingsPage ? navigate(-1) : navigate(pathWithSearch('/settings'))
                }
              >
                {isSettingsPage ? <ArrowLeft size={18} /> : <Settings2 size={18} />}
              </button>
              <div className="tooltip-popover" role="tooltip">
                {isSettingsPage ? t('back') : t('settings')}
              </div>
            </>
          )}
        </div>
      </header>
      <main>
        <aside className="desktop-side-nav">{renderNavigation()}</aside>
        <aside id="mobile-nav" className="mobile-side-nav" popover="auto">
          {renderNavigation(true)}
        </aside>
        <section className="content">{children}</section>
      </main>
    </div>
  )
}
