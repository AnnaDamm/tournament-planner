import type { ReactNode } from 'react'
import { BarChart3, Settings2, Trophy, Users } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { t } from '../i18n'

type Props = {
  participantLabel: string
  playerCount: number
  roundCount: number
  currentRound: number
  children: ReactNode
}

export function AppLayout({
  participantLabel,
  playerCount,
  roundCount,
  currentRound,
  children,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const navigation = [
    { label: participantLabel, target: '/participants', icon: Users },
    { label: t('table'), target: '/table', icon: BarChart3 },
    { label: t('rounds'), target: '/rounds', icon: Trophy },
  ]
  return (
    <div className="app-shell">
      <header>
        <div className="brand">
          <div className="brand-mark">
            <Trophy size={20} />
          </div>
          <div className="brand-title">Courtly</div>
        </div>
        <div className="header-actions">
          <span className="live">
            <i /> {t('local')}
          </span>
          <button
            className="icon-btn settings-trigger"
            aria-label={t('settings')}
            onClick={() => navigate('/settings')}
          >
            <Settings2 size={18} />
          </button>
          <div className="tooltip-popover" role="tooltip">
            {t('settings')}
          </div>
        </div>
      </header>
      <main>
        <aside>
          <div className="side-label">{t('tournament')}</div>
          {navigation.map(({ label, target, icon: Icon }) => (
            <NavLink
              key={target}
              to={target}
              className={`nav-item ${location.pathname === target ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
              {target === '/rounds' && currentRound > 0 && (
                <span className="nav-badge">{currentRound}</span>
              )}
            </NavLink>
          ))}
          <div className="side-card">
            <div className="side-card-icon">
              <Users size={17} />
            </div>
            <div>
              <b>
                {playerCount} {participantLabel}
              </b>
              <small>
                {roundCount} {t('rounds')}
              </small>
            </div>
          </div>
        </aside>
        <section className="content">{children}</section>
      </main>
    </div>
  )
}
