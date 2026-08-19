import type { ReactNode } from 'react'
import { ArrowLeft, BarChart3, Menu, Settings2, Trophy, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { t } from '../i18n'

type Props = {
  tournamentName: string
  roundCount: number
  currentRound: number
  children: ReactNode
}

export function AppLayout({ tournamentName, roundCount, currentRound, children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'
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
          to={target}
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
            <Link to="/table">{tournamentName}</Link>
          </h1>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn settings-trigger"
            aria-label={isSettingsPage ? t('back') : t('settings')}
            onClick={() => (isSettingsPage ? navigate(-1) : navigate('/settings'))}
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
