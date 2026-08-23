import { defineConfig, transformWithOxc, type Plugin } from 'vite'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
  version: string
}

const getGitVersion = (args: string[]) => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

const getAppVersion = () =>
  process.env.VITE_APP_VERSION?.trim() ||
  getGitVersion(['describe', '--tags', '--exact-match', '--match', 'v[0-9]*', 'HEAD']) ||
  getGitVersion([
    'describe',
    '--tags',
    '--abbrev=0',
    '--first-parent',
    '--match',
    'v[0-9]*',
    'HEAD',
  ]) ||
  `v${packageJson.version}`

function serviceWorker(): Plugin {
  let outputDir = resolve('dist')
  let base = '/'
  return {
    name: 'service-worker',
    configResolved(config) {
      outputDir = resolve(config.root, config.build.outDir)
      base = config.base
    },
    async closeBundle() {
      const indexContent = readFileSync(resolve(outputDir, 'index.html'))
      const buildId = createHash('sha256').update(indexContent).digest('hex').slice(0, 16)
      const source = readFileSync(resolve('src/service-worker.ts'), 'utf8')
        .replace(/^.*<reference lib="webworker".*$/m, '')
        .replace(/^export {}\n/m, '')
        .replaceAll('__APP_VERSION__', `${getAppVersion()}-${buildId}`)
        .replaceAll('__BASE_URL__', base)
      const result = await transformWithOxc(source, 'service-worker.ts', {})
      writeFileSync(resolve(outputDir, 'sw.js'), result.code)
    },
  }
}

function webManifest(): Plugin {
  let outputDir = resolve('dist')
  let base = '/'
  return {
    name: 'web-manifest',
    configResolved(config) {
      outputDir = resolve(config.root, config.build.outDir)
      base = config.base
    },
    closeBundle() {
      const manifestPath = resolve(outputDir, 'manifest.webmanifest')
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        start_url: string
        scope: string
        icons: Array<{ src: string }>
      }
      manifest.start_url = base
      manifest.scope = base
      manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `${base}icon.svg` }))
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  }
}

function inlineAssets(): Plugin {
  let outputDir = resolve('dist')
  let assetBase = '/assets/'
  return {
    name: 'inline-assets-in-index',
    configResolved(config) {
      outputDir = resolve(config.root, config.build.outDir)
      assetBase = `${config.base}assets/`
    },
    closeBundle() {
      const outDir = outputDir
      const assetsPath = resolve(outDir, 'assets')
      let source = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      for (const fileName of readdirSync(assetsPath)) {
        const filePath = resolve(assetsPath, fileName)
        const content = readFileSync(filePath, 'utf8')
        const assetUrl = `${assetBase}${fileName}`
        if (fileName.endsWith('.css'))
          source = source.replace(
            new RegExp(`<link[^>]*href="${assetUrl}"[^>]*>`),
            () => `<style>${content}</style>`,
          )
        if (fileName.endsWith('.js')) {
          const safeContent = content.replace(/<\/script/gi, '<\\/script')
          source = source.replace(
            new RegExp(`<script[^>]*src="${assetUrl}"[^>]*><\\/script>`),
            () => `<script type="module">${safeContent}</script>`,
          )
        }
        unlinkSync(filePath)
      }
      source = source.replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
      writeFileSync(resolve(outDir, 'index.html'), source)
    },
  }
}

export default defineConfig(({ mode }) => {
  const appVersion = getAppVersion()

  return {
    root: 'src',
    base: mode === 'production' ? (process.env.VITE_BASE_URL ?? '/tournament-planner/') : '/',
    define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion) },
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      serviceWorker(),
      webManifest(),
      inlineAssets(),
    ],
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      modulePreload: false,
      cssCodeSplit: false,
      rollupOptions: { output: { manualChunks: undefined } },
    },
  }
})
