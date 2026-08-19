import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'
import { locale } from './i18n'
import { TournamentApp } from './components/TournamentApp'
import { TournamentProvider } from './context/TournamentContext'

if (typeof document !== 'undefined') document.documentElement.lang = locale

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <TournamentProvider>
      <TournamentApp />
    </TournamentProvider>
  </BrowserRouter>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => registration.update())
  })
}
