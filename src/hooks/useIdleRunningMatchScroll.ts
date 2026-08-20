import { useEffect } from 'react'

export function useIdleRunningMatchScroll(readOnly: boolean, matchId: string | undefined) {
  useEffect(() => {
    if (!readOnly) return

    const scrollToRunningMatch = () => {
      if (!matchId) return
      const target = document.getElementById(`match-${matchId}`)
      if (!target) return
      const targetCenter = target.getBoundingClientRect().top + target.offsetHeight / 2
      window.scrollBy({
        top: targetCenter - window.innerHeight / 2,
        behavior: 'smooth',
      })
    }
    let idleTimer = window.setTimeout(scrollToRunningMatch, 10_000)
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(scrollToRunningMatch, 10_000)
    }
    window.addEventListener('pointerdown', resetIdleTimer)
    window.addEventListener('pointermove', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    window.addEventListener('touchstart', resetIdleTimer)
    window.addEventListener('wheel', resetIdleTimer)
    return () => {
      window.clearTimeout(idleTimer)
      window.removeEventListener('pointerdown', resetIdleTimer)
      window.removeEventListener('pointermove', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
      window.removeEventListener('touchstart', resetIdleTimer)
      window.removeEventListener('wheel', resetIdleTimer)
    }
  }, [matchId, readOnly])
}
