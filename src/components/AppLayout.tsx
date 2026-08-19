import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react'
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

const positionPopover = (trigger: HTMLElement | null, popover: HTMLElement | null) => {
  if (!trigger || !popover) return
  const viewportGap = 16
  const triggerRect = trigger.getBoundingClientRect()
  const popoverWidth = popover.offsetWidth
  const popoverHeight = popover.offsetHeight
  const preferredTop = triggerRect.bottom + 10
  const left = Math.min(
    Math.max(triggerRect.right - popoverWidth, viewportGap),
    window.innerWidth - popoverWidth - viewportGap,
  )
  const top =
    preferredTop + popoverHeight <= window.innerHeight - viewportGap
      ? preferredTop
      : Math.max(viewportGap, triggerRect.top - popoverHeight - 10)
  popover.style.left = `${left}px`
  popover.style.top = `${top}px`
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
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const searchPopoverRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileNavCloseRef = useRef<HTMLButtonElement>(null)
  const findingCursorRef = useRef({ key: '', index: -1 })
  const matchCursorRef = useRef({ key: '', index: -1 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get('search') ?? '',
  )
  const pathWithSearch = (pathname: string) => ({ pathname, hash: location.hash })
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
  const findingCount = matchingParticipants.length
  const navigateFinding = (direction: 1 | -1) => {
    if (matchingParticipants.length === 0) return
    const cursor = findingCursorRef.current
    const nextIndex =
      cursor.key === normalizedSearch
        ? (cursor.index + direction + matchingParticipants.length) % matchingParticipants.length
        : direction > 0
          ? 0
          : matchingParticipants.length - 1
    findingCursorRef.current = { key: normalizedSearch, index: nextIndex }
    if (!isTablePage) navigate(pathWithSearch('/table'))
    scrollToTarget(`player-${matchingParticipants[nextIndex].participantId}`)
  }
  const updateSearch = (value: string) => {
    setSearchTerm(value)
    const hashParams = new URLSearchParams(location.hash.slice(1))
    if (value.trim()) hashParams.set('search', value)
    else hashParams.delete('search')
    const hash = hashParams.toString()
    navigate(
      { pathname: location.pathname, search: location.search, hash: hash ? `#${hash}` : '' },
      { replace: true },
    )
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setSearchTerm(new URLSearchParams(location.hash.slice(1)).get('search') ?? '')
  }, [location.hash])

  useEffect(() => {
    if (!searchOpen) return
    const handleResize = () => positionPopover(searchTriggerRef.current, searchPopoverRef.current)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [searchOpen])

  const handleSearchToggle = (event: SyntheticEvent<HTMLElement>) => {
    const isOpen = (event.nativeEvent as ToggleEvent).newState === 'open'
    setSearchOpen(isOpen)
    requestAnimationFrame(() => {
      if (isOpen) {
        positionPopover(searchTriggerRef.current, searchPopoverRef.current)
        searchInputRef.current?.focus()
      } else searchTriggerRef.current?.focus()
    })
  }
  const navigation = [
    { label: t('table'), target: '/table', icon: BarChart3 },
    { label: t('rounds'), target: '/rounds', icon: Trophy },
  ]

  const closeMobileNav = () => {
    mobileNavRef.current?.hidePopover()
    requestAnimationFrame(() => mobileNavTriggerRef.current?.focus())
  }
  const handleMobileNavToggle = () => {
    if (mobileNavRef.current?.matches(':popover-open')) {
      requestAnimationFrame(() => mobileNavCloseRef.current?.focus())
    } else {
      requestAnimationFrame(() => mobileNavTriggerRef.current?.focus())
    }
  }

  const renderNavigation = (mobile = false) => (
    <>
      {mobile && (
        <div className="mobile-nav-head">
          <div className="side-label" aria-hidden="true">
            {t('tournament')}
          </div>
          <button
            className="icon-btn mobile-nav-close"
            id="mobile-nav-close"
            ref={mobileNavCloseRef}
            type="button"
            aria-label={t('close')}
            popoverTarget="mobile-nav"
            popoverTargetAction="hide"
            onClick={closeMobileNav}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      )}
      {!mobile && (
        <div className="side-label" aria-hidden="true">
          {t('tournament')}
        </div>
      )}
      {navigation.map(({ label, target, icon: Icon }) => (
        <NavLink
          key={target}
          to={pathWithSearch(target)}
          onClick={mobile ? closeMobileNav : undefined}
          className={`nav-item ${location.pathname === target ? 'active' : ''}`}
        >
          <Icon size={18} aria-hidden="true" />
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
      <a className="skip-link" href="#main-content">
        {t('skipToContent')}
      </a>
      <header>
        <button
          className="icon-btn mobile-nav-trigger"
          ref={mobileNavTriggerRef}
          type="button"
          aria-label={t('menu')}
          aria-controls="mobile-nav"
          popoverTarget="mobile-nav"
          popoverTargetAction="toggle"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <div className="brand">
          <div className="brand-mark">
            <Trophy size={20} aria-hidden="true" />
          </div>
          <div className="brand-title" title={tournamentName}>
            <Link to={pathWithSearch('/table')}>{tournamentName}</Link>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-control">
            <button
              className={`icon-btn search-trigger ${searchTerm ? 'active' : ''}`}
              ref={searchTriggerRef}
              type="button"
              aria-label={t('playerSearch')}
              aria-expanded={searchOpen}
              aria-controls="player-search-popover"
              popoverTarget="player-search-popover"
              popoverTargetAction="toggle"
            >
              <Search size={18} aria-hidden="true" />
            </button>
            <section
              className="search-popover"
              ref={searchPopoverRef}
              id="player-search-popover"
              aria-label={t('playerSearch')}
              onToggle={handleSearchToggle}
              popover="auto"
            >
              <div className="search-input-wrap">
                <Search size={16} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="search"
                  list="participant-search-options"
                  value={searchTerm}
                  placeholder={t('playerSearch')}
                  aria-label={t('playerSearch')}
                  onChange={(event) => updateSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigateFinding(1)
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    aria-label={t('clearSearch')}
                    onClick={() => updateSearch('')}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
              <datalist id="participant-search-options">
                {participantNames.map((name, index) => (
                  <option value={name} key={`${name}-${index}`}>
                    {name}
                  </option>
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
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span aria-live="polite">
                    {findingCount} {t('searchResults')}
                  </span>
                  <button
                    type="button"
                    aria-label={t('nextFinding')}
                    title={t('nextFinding')}
                    onClick={() => navigateFinding(1)}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
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
                <ChevronDown size={15} aria-hidden="true" />
              </button>
            </section>
          </div>
          <button
            className="icon-btn"
            aria-label={t('documentation')}
            title={t('documentation')}
            onClick={() => navigate(pathWithSearch('/docs'))}
          >
            <BookOpen size={18} aria-hidden="true" />
          </button>
          {localMaster && (
            <>
              <button
                className="icon-btn"
                aria-label={t('viewerQrCode')}
                title={t('viewerQrCode')}
                onClick={() => navigate(pathWithSearch('/share'))}
              >
                <QrCode size={18} aria-hidden="true" />
              </button>
              <output
                className={`live-indicator ${isLive ? 'is-live' : 'is-offline'}`}
                aria-label={isLive ? t('liveConnectionOnline') : t('liveConnectionOffline')}
                title={isLive ? t('liveConnectionOnline') : t('liveConnectionOffline')}
              >
                <span aria-hidden="true" />
              </output>
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
                {isSettingsPage ? (
                  <ArrowLeft size={18} aria-hidden="true" />
                ) : (
                  <Settings2 size={18} aria-hidden="true" />
                )}
              </button>
              <div className="tooltip-popover" aria-hidden="true">
                {isSettingsPage ? t('back') : t('settings')}
              </div>
            </>
          )}
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <nav className="desktop-side-nav" aria-label={t('tournamentNavigation')}>
          {renderNavigation()}
        </nav>
        <nav
          id="mobile-nav"
          ref={mobileNavRef}
          onToggle={handleMobileNavToggle}
          className="mobile-side-nav"
          aria-label={t('tournamentNavigation')}
          popover="auto"
        >
          {renderNavigation(true)}
        </nav>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
