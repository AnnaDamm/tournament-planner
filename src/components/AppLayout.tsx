import styles from './AppLayout.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LockOpen,
  Menu,
  RefreshCw,
  Search,
  Settings2,
  Trophy,
  X,
  ZoomIn,
  ZoomOut,
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
  const locationSearchParams = new URLSearchParams(location.search)
  const isReadOnlyTab = locationSearchParams.get('readonly') === '1'
  const readonlyFocusMode = readOnly && locationSearchParams.get('focus') === '1'
  const readonlyRotationMode = readOnly && locationSearchParams.get('rotate') === '1'
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const searchPopoverRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileNavCloseRef = useRef<HTMLButtonElement>(null)
  const findingCursorRef = useRef({ key: '', index: -1 })
  const matchCursorRef = useRef({ key: '', index: -1 })
  const fullscreenIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get('search') ?? '',
  )
  const pathWithSearch = (pathname: string) => ({
    pathname,
    search: location.search,
    hash: location.hash,
  })
  const toggleViewParam = (param: 'focus' | 'rotate', enabled: boolean) => {
    const nextSearchParams = new URLSearchParams(location.search)
    if (enabled) nextSearchParams.set(param, '1')
    else nextSearchParams.delete(param)
    const nextSearch = nextSearchParams.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
        hash: location.hash,
      },
      { replace: true },
    )
  }
  const readOnlyUrl = new URL(window.location.href)
  readOnlyUrl.searchParams.set('readonly', '1')
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

  useEffect(() => {
    const cursorHiddenClass = 'fullscreen-cursor-hidden'
    const headerOverlayActiveClass = 'header-overlay-active'
    const focusModeActiveClass = 'focus-mode-active'
    const topMenuScrolledClass = 'top-menu-scrolled'
    const fullscreenHeaderVisibleClass = 'fullscreen-header-visible'
    const fullscreenHeader = document.querySelector<HTMLElement>('header')
    const isFullscreenMode = () => {
      const screenSize = window.screen
      return (
        Boolean(document.fullscreenElement) ||
        Boolean(
          screenSize &&
          window.innerWidth === screenSize.width &&
          window.innerHeight === screenSize.height,
        )
      )
    }
    const clearIdleTimer = () => {
      if (fullscreenIdleTimerRef.current) clearTimeout(fullscreenIdleTimerRef.current)
      fullscreenIdleTimerRef.current = null
    }
    const setCursorHidden = (hidden: boolean) =>
      document.documentElement.classList.toggle(cursorHiddenClass, hidden)
    const setHeaderVisible = (visible: boolean) =>
      document.documentElement.classList.toggle(fullscreenHeaderVisibleClass, visible)
    const scheduleCursorHide = () => {
      clearIdleTimer()
      if (!isFullscreenMode()) return
      fullscreenIdleTimerRef.current = setTimeout(() => setCursorHidden(true), 3_000)
    }
    const handleDisplayModeChange = () => {
      clearIdleTimer()
      const isFullscreen = isFullscreenMode()
      const isHeaderOverlayActive = readonlyFocusMode || isFullscreen
      document.documentElement.classList.toggle(headerOverlayActiveClass, isHeaderOverlayActive)
      document.documentElement.classList.toggle(focusModeActiveClass, readonlyFocusMode)
      setHeaderVisible(false)
      setCursorHidden(false)
      if (isFullscreen) scheduleCursorHide()
    }
    const handlePointerActivity = (event: PointerEvent) => {
      const isFullscreen = isFullscreenMode()
      if (isFullscreen) {
        setCursorHidden(false)
        scheduleCursorHide()
      }
      if (!isFullscreen) return
      const headerHeight = fullscreenHeader?.offsetHeight ?? 92
      if (event.clientY <= 100) {
        setHeaderVisible(true)
      } else if (event.clientY > headerHeight) {
        setHeaderVisible(false)
      }
    }
    const syncTopMenuScrollState = () =>
      document.documentElement.classList.toggle(topMenuScrolledClass, window.scrollY > 0)

    document.addEventListener('fullscreenchange', handleDisplayModeChange)
    window.addEventListener('resize', handleDisplayModeChange)
    window.addEventListener('pointermove', handlePointerActivity)
    window.addEventListener('scroll', syncTopMenuScrollState, { passive: true })
    handleDisplayModeChange()
    syncTopMenuScrollState()

    return () => {
      clearIdleTimer()
      document.documentElement.classList.remove(headerOverlayActiveClass)
      document.documentElement.classList.remove(focusModeActiveClass)
      document.documentElement.classList.remove(topMenuScrolledClass)
      setHeaderVisible(false)
      setCursorHidden(false)
      document.removeEventListener('fullscreenchange', handleDisplayModeChange)
      window.removeEventListener('resize', handleDisplayModeChange)
      window.removeEventListener('pointermove', handlePointerActivity)
      window.removeEventListener('scroll', syncTopMenuScrollState)
    }
  }, [readonlyFocusMode])

  useEffect(() => {
    if (!readonlyRotationMode) return
    const interval = window.setInterval(() => {
      const nextPath = location.pathname === '/rounds' ? '/table' : '/rounds'
      navigate({ pathname: nextPath, search: location.search, hash: location.hash })
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [location.hash, location.pathname, location.search, navigate, readonlyRotationMode])

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
        <div className={classNames(sharedStyles, styles, 'mobile-nav-head')}>
          <button
            className={classNames(sharedStyles, styles, 'icon-btn mobile-nav-close')}
            id="mobile-nav-close"
            ref={mobileNavCloseRef}
            type="button"
            aria-label={t('close')}
            title={t('close')}
            popoverTarget="mobile-nav"
            popoverTargetAction="hide"
            onClick={closeMobileNav}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      )}
      {navigation.map(({ label, target, icon: Icon }) => (
        <NavLink
          key={target}
          to={pathWithSearch(target)}
          onClick={mobile ? closeMobileNav : undefined}
          className={classNames(
            sharedStyles,
            styles,
            `nav-item ${location.pathname === target ? 'active' : ''}`,
          )}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
          {target === '/rounds' && (
            <span className={classNames(sharedStyles, styles, 'nav-badge')}>
              {currentRound} / {roundCount}
            </span>
          )}
        </NavLink>
      ))}
    </>
  )

  return (
    <div
      className={classNames(
        sharedStyles,
        styles,
        `app-shell ${readonlyFocusMode ? 'readonly-focus-mode' : ''}`,
      )}
    >
      <a className={classNames(sharedStyles, styles, 'skip-link')} href="#main-content">
        {t('skipToContent')}
      </a>
      <div className={classNames(sharedStyles, styles, 'top-menu-slot')}>
        <header
          id="top-menu-header"
          className={classNames(sharedStyles, styles, 'top-menu-header')}
        >
          <button
            className={classNames(sharedStyles, styles, 'icon-btn mobile-nav-trigger')}
            ref={mobileNavTriggerRef}
            type="button"
            aria-label={t('menu')}
            title={t('menu')}
            aria-controls="mobile-nav"
            popoverTarget="mobile-nav"
            popoverTargetAction="toggle"
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <div className={classNames(sharedStyles, styles, 'brand')}>
            <div className={classNames(sharedStyles, styles, 'brand-mark')}>
              <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" aria-hidden="true" />
            </div>
            <div className={classNames(sharedStyles, styles, 'brand-title')} title={tournamentName}>
              <Link to={pathWithSearch('/table')}>{tournamentName}</Link>
            </div>
          </div>
          <div className={classNames(sharedStyles, styles, 'header-actions')}>
            <div className={classNames(sharedStyles, styles, 'search-control')}>
              <button
                className={classNames(
                  styles,
                  `icon-btn search-trigger ${searchTerm ? 'active' : ''}`,
                )}
                ref={searchTriggerRef}
                type="button"
                aria-label={t('playerSearch')}
                title={t('playerSearch')}
                aria-expanded={searchOpen}
                aria-controls="player-search-popover"
                popoverTarget="player-search-popover"
                popoverTargetAction="toggle"
              >
                <Search size={18} aria-hidden="true" />
              </button>
              <section
                className={classNames(sharedStyles, styles, 'search-popover')}
                ref={searchPopoverRef}
                id="player-search-popover"
                aria-label={t('playerSearch')}
                onToggle={handleSearchToggle}
                popover="auto"
              >
                <div className={classNames(sharedStyles, styles, 'search-input-wrap')}>
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
                      title={t('clearSearch')}
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
                  <div className={classNames(sharedStyles, styles, 'finding-navigation')}>
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
                  className={classNames(sharedStyles, styles, 'next-match-button')}
                  type="button"
                  disabled={matchingMatchIds.length === 0}
                  title={matchingMatchIds.length ? t('nextMatch') : t('noNextMatch')}
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
            {!readOnly && (
              <button
                className={classNames(sharedStyles, styles, 'icon-btn')}
                aria-label={t('documentation')}
                title={t('documentation')}
                onClick={() => navigate(pathWithSearch('/docs'))}
              >
                <BookOpen size={18} aria-hidden="true" />
              </button>
            )}
            {localMaster && (
              <>
                <output
                  className={classNames(
                    styles,
                    `live-indicator ${isLive ? 'is-live' : 'is-offline'}`,
                  )}
                  aria-label={isLive ? t('liveConnectionOnline') : t('liveConnectionOffline')}
                  title={isLive ? t('liveConnectionOnline') : t('liveConnectionOffline')}
                >
                  <span aria-hidden="true" />
                </output>
              </>
            )}
            {readOnly && (
              <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
                <button
                  className={classNames(
                    sharedStyles,
                    styles,
                    `icon-btn ${readonlyFocusMode ? 'active' : ''}`,
                  )}
                  type="button"
                  aria-label={t(readonlyFocusMode ? 'disableFocusMode' : 'enableFocusMode')}
                  title={t(readonlyFocusMode ? 'disableFocusMode' : 'enableFocusMode')}
                  aria-pressed={readonlyFocusMode}
                  onClick={() => toggleViewParam('focus', !readonlyFocusMode)}
                >
                  {readonlyFocusMode ? (
                    <ZoomOut size={18} aria-hidden="true" />
                  ) : (
                    <ZoomIn size={18} aria-hidden="true" />
                  )}
                </button>
                <div
                  className={classNames(sharedStyles, styles, 'tooltip-popover')}
                  aria-hidden="true"
                >
                  {t(readonlyFocusMode ? 'disableFocusMode' : 'enableFocusMode')}
                </div>
              </div>
            )}
            {readOnly && (
              <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
                <button
                  className={classNames(
                    styles,
                    `icon-btn ${readonlyRotationMode ? 'active view-rotation-active' : ''}`,
                  )}
                  type="button"
                  aria-label={t(
                    readonlyRotationMode ? 'disableRotationMode' : 'enableRotationMode',
                  )}
                  title={t(readonlyRotationMode ? 'disableRotationMode' : 'enableRotationMode')}
                  aria-pressed={readonlyRotationMode}
                  onClick={() => toggleViewParam('rotate', !readonlyRotationMode)}
                >
                  <RefreshCw size={18} aria-hidden="true" />
                </button>
                <div
                  className={classNames(sharedStyles, styles, 'tooltip-popover')}
                  aria-hidden="true"
                >
                  {t(readonlyRotationMode ? 'disableRotationMode' : 'enableRotationMode')}
                </div>
              </div>
            )}
            {!readOnly && (
              <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
                <a
                  className={classNames(
                    sharedStyles,
                    styles,
                    `icon-btn ${isReadOnlyTab ? 'active' : ''}`,
                  )}
                  href={readOnlyUrl.toString()}
                  aria-label={t('enableReadOnly')}
                  title={t('enableReadOnly')}
                >
                  <LockOpen size={18} aria-hidden="true" />
                </a>
                <div
                  className={classNames(sharedStyles, styles, 'tooltip-popover')}
                  aria-hidden="true"
                >
                  {t('enableReadOnly')}
                </div>
              </div>
            )}
            {!readOnly && (
              <div className={classNames(sharedStyles, styles, 'header-tooltip')}>
                <button
                  className={classNames(sharedStyles, styles, 'icon-btn settings-trigger')}
                  aria-label={isSettingsPage ? t('back') : t('settings')}
                  title={isSettingsPage ? t('back') : t('settings')}
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
                <div
                  className={classNames(sharedStyles, styles, 'tooltip-popover')}
                  aria-hidden="true"
                >
                  {isSettingsPage ? t('back') : t('settings')}
                </div>
              </div>
            )}
          </div>
        </header>
      </div>
      <div
        className={classNames(sharedStyles, styles, 'focus-left-reveal-zone')}
        aria-hidden="true"
      />
      <main id="main-content" tabIndex={-1}>
        <nav
          className={classNames(sharedStyles, styles, 'desktop-side-nav')}
          aria-label={t('tournamentNavigation')}
        >
          {renderNavigation()}
        </nav>
        <nav
          id="mobile-nav"
          ref={mobileNavRef}
          onToggle={handleMobileNavToggle}
          className={classNames(sharedStyles, styles, 'mobile-side-nav')}
          aria-label={t('tournamentNavigation')}
          popover="auto"
        >
          {renderNavigation(true)}
        </nav>
        <div className={classNames(sharedStyles, styles, 'content')}>{children}</div>
      </main>
      <footer className={classNames(sharedStyles, styles, 'app-footer')}>
        <div className={classNames(sharedStyles, styles, 'app-footer-inner')}>
          <span className={classNames(sharedStyles, styles, 'app-footer-name')}>
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" aria-hidden="true" />
            Tourny
            <span className={classNames(sharedStyles, styles, 'app-footer-version')}>
              {import.meta.env.VITE_APP_VERSION}
            </span>
          </span>
          <nav
            className={classNames(sharedStyles, styles, 'app-footer-links')}
            aria-label={t('footerLinks')}
          >
            <a
              href="https://github.com/AnnaDamm/tournament-planner"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className={classNames(sharedStyles, styles, 'app-footer-link-icon')}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.084-.73.084-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                />
              </svg>
              {t('github')}
            </a>
            <a
              href="https://github.com/AnnaDamm/tournament-planner/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('reportIssue')}
            </a>
            <a href="https://anna-damm.de/" target="_blank" rel="noopener noreferrer">
              {t('developerAuthor')}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
