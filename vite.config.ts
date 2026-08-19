import { defineConfig, transformWithOxc, type Plugin } from 'vite'
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
      const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
        version: string
      }
      const source = readFileSync(resolve('src/service-worker.ts'), 'utf8')
        .replace(/^.*<reference lib="webworker".*$/m, '')
        .replace(/^export {}\n/m, '')
        .replaceAll('__APP_VERSION__', packageJson.version)
        .replaceAll('__BASE_URL__', base)
      const result = await transformWithOxc(source, 'service-worker.ts', {})
      writeFileSync(resolve(outputDir, 'sw.js'), result.code)
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

export default defineConfig(({ mode }) => ({
  root: 'src',
  base: mode === 'production' ? (process.env.VITE_BASE_URL ?? '/tournament-planner/') : '/',
  plugins: [react(), tailwindcss(), serviceWorker(), inlineAssets()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: { output: { manualChunks: undefined } },
  },
}))
