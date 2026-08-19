import { defineConfig, type Plugin } from 'vite'
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
            () => `<script>${safeContent}</script>`,
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
  base: mode === 'production' ? '/tournament-planner/' : '/',
  plugins: [react(), tailwindcss(), inlineAssets()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: { output: { manualChunks: undefined } },
  },
}))
