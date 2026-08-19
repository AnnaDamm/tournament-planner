declare global {
  interface Window {
    __TOURNY_LIVE_CONFIG__?: {
      mode?: unknown
      role?: unknown
      viewerUrl?: unknown
      relayToken?: unknown
    }
  }
}

export type LocalMasterConfig = {
  role: 'master'
  viewerUrl: string
  relayToken?: string
}

export type LocalViewerConfig = { role: 'viewer' }

export type LocalSession = LocalMasterConfig | LocalViewerConfig

export const isReadOnlyTab = () =>
  new URLSearchParams(window.location.search).get('readonly') === '1'

const isViewerUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const getLocalSession = (): LocalSession | null => {
  const config = window.__TOURNY_LIVE_CONFIG__
  const isLocalMode = config?.mode === 'local' || import.meta.env.VITE_LOCAL_MODE === 'true'
  const role = config?.role ?? import.meta.env.VITE_LOCAL_ROLE
  const viewerUrl = config?.viewerUrl ?? import.meta.env.VITE_VIEWER_URL
  const relayToken = typeof config?.relayToken === 'string' ? config.relayToken : undefined

  if (!isLocalMode) return null
  if (role === 'viewer') return { role }
  if (role === 'master' && isViewerUrl(viewerUrl)) return { role, viewerUrl, relayToken }
  return null
}

export const getLocalMasterConfig = (): LocalMasterConfig | null => {
  const session = getLocalSession()
  return session?.role === 'master' ? session : null
}
