import { randomBytes } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { getLanAddress } from './localNetwork.js'

type Snapshot = Record<string, unknown>

const port = Number(process.env.TOURNY_PORT ?? 8080)
const distDirectory = resolve(process.env.TOURNY_DIST_DIRECTORY ?? 'dist')
const masterToken = process.env.TOURNY_MASTER_TOKEN ?? randomBytes(32).toString('base64url')
const maxSnapshotSize = 1_000_000
const clients = new Set<ServerResponse>()

let latestSnapshot: Snapshot | null = null
let latestSnapshotJson: string | null = null
let indexTemplate = ''

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
}

const getViewerUrl = () =>
  process.env.TOURNY_VIEWER_URL || `http://${getLanAddress() ?? '127.0.0.1'}:${port}/`

const getHostname = (request: IncomingMessage) => {
  const host = request.headers.host ?? ''
  return host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0]
}

const isMasterRequest = (request: IncomingMessage) =>
  ['localhost', '127.0.0.1', '::1'].includes(getHostname(request))

const writeJson = (response: ServerResponse, status: number, value: unknown) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(value))
}

const sendSnapshot = (response: ServerResponse, snapshot: Snapshot) =>
  response.write(`data: ${JSON.stringify(snapshot)}\n\n`)

const broadcast = (snapshot: Snapshot) => {
  for (const response of clients) sendSnapshot(response, snapshot)
}

const readBody = (request: IncomingMessage) =>
  new Promise<string>((resolveBody, reject) => {
    let size = 0
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      size += Buffer.byteLength(chunk)
      if (size > maxSnapshotSize) {
        reject(new Error('Snapshot too large'))
        request.destroy()
        return
      }
      body += chunk
    })
    request.on('end', () => resolveBody(body))
    request.on('error', reject)
  })

const isSnapshot = (value: unknown): value is Snapshot =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const renderIndex = (request: IncomingMessage) => {
  const config = isMasterRequest(request)
    ? { mode: 'local', role: 'master', viewerUrl: getViewerUrl(), relayToken: masterToken }
    : { mode: 'local', role: 'viewer' }
  const script = `<script>window.__TOURNY_LIVE_CONFIG__=${JSON.stringify(config)}</script>`
  return indexTemplate.replace(/<script id="tourny-runtime-config">[\s\S]*?<\/script>/, script)
}

const serveStaticFile = async (response: ServerResponse, pathname: string) => {
  const normalizedPath = normalize(pathname).replace(/^[/\\]+/, '')
  const filePath = resolve(join(distDirectory, normalizedPath))
  if (!filePath.startsWith(`${distDirectory}/`)) return false

  try {
    if (!(await stat(filePath)).isFile()) return false
    const extension = extname(filePath)
    response.writeHead(200, {
      'content-type': mimeTypes[extension] ?? 'application/octet-stream',
      'cache-control': extension === '.html' ? 'no-store' : 'public, max-age=3600',
    })
    const stream = createReadStream(filePath)
    stream.on('error', () => response.destroy())
    stream.pipe(response)
    return true
  } catch {
    return false
  }
}

indexTemplate = await readFile(join(distDirectory, 'index.html'), 'utf8')

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method === 'GET' && url.pathname === '/api/events') {
    response.writeHead(200, {
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'content-type': 'text/event-stream; charset=utf-8',
    })
    response.write(': connected\n\n')
    clients.add(response)
    if (latestSnapshot) sendSnapshot(response, latestSnapshot)
    request.on('close', () => clients.delete(response))
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/snapshot') {
    if (request.headers['x-tourny-master'] !== masterToken) {
      writeJson(response, 401, { error: 'Master authorisation required' })
      return
    }

    try {
      const snapshot: unknown = JSON.parse(await readBody(request))
      if (!isSnapshot(snapshot)) {
        writeJson(response, 400, { error: 'Invalid snapshot' })
        return
      }

      const snapshotJson = JSON.stringify(snapshot)
      const changed = snapshotJson !== latestSnapshotJson
      latestSnapshot = snapshot
      latestSnapshotJson = snapshotJson
      if (changed) broadcast(snapshot)
      response.writeHead(204)
      response.end()
    } catch {
      writeJson(response, 400, { error: 'Invalid snapshot' })
    }
    return
  }

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'Method not allowed' })
    return
  }

  if (url.pathname !== '/' && (await serveStaticFile(response, url.pathname))) return

  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': 'text/html; charset=utf-8',
  })
  response.end(renderIndex(request))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Tourny master: http://localhost:${port}/`)
  console.log(`Viewer URL: ${getViewerUrl()}`)
})
