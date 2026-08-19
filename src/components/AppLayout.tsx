import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  Menu,
  Search,
  Settings2,
  Trophy,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { t } from '../i18n'

type Props = {
  tournamentName: string
  participantLabel: string
  participantNames: string[]
  playerCount: number
  roundCount: number
  currentRound: number
  children: ReactNode
}

export function AppLayout({
  tournamentName,
  participantLabel,
  participantNames,
  playerCount,
  roundCount,
  currentRound,
  children,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'
  const searchPopoverRef = useRef<HTMLDivElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('search') ?? '',
  )
  const pathWithSearch = (pathname: string) => ({ pathname, hash: window.location.hash })
  const findPlayer = (term: string) => {
    if (!term.trim()) return
    window.setTimeout(
      () =>
        (
          window as typeof window & {
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
        ).find(term.trim(), false, false, true, false, false, false),
      0,
    )
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
                <button
                  className="next-match-button"
                  type="button"
                  disabled={!searchTerm.trim()}
                  onClick={() => {
                    if (location.pathname !== '/rounds') navigate(pathWithSearch('/rounds'))
                    else findPlayer(searchTerm)
                  }}
                >
                  {t('nextMatch')} <ChevronDown size={15} />
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
          <button
            className="icon-btn settings-trigger"
            aria-label={isSettingsPage ? t('back') : t('settings')}
            onClick={() => (isSettingsPage ? navigate(-1) : navigate(pathWithSearch('/settings')))}
          >
            {isSettingsPage ? <ArrowLeft size={18} /> : <Settings2 size={18} />}
          </button>
          <div className="tooltip-popover" role="tooltip">
            {isSettingsPage ? t('back') : t('settings')}
          </div>
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
