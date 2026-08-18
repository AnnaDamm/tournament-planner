import { defineConfig, type Plugin } from 'vite';
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function inlineAssets(): Plugin {
  return {
    name: 'inline-assets-in-index',
    closeBundle() {
      const outDir = resolve('dist');
      let source = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      for (const fileName of readdirSync(resolve(outDir, 'assets'))) {
        const filePath = resolve(outDir, 'assets', fileName);
        const content = readFileSync(filePath, 'utf8');
        if (fileName.endsWith('.css')) source = source.replace(/<link[^>]+rel="stylesheet"[^>]*>/, `<style>${content}</style>`);
        if (fileName.endsWith('.js')) source = source.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/, `<script>${content}</script>`);
        unlinkSync(filePath);
      }
      source = source.replace(/\s*<link rel="modulepreload"[^>]*>/g, '');
      writeFileSync(resolve(outDir, 'index.html'), source);
    }
  };
}

export default defineConfig({ plugins: [react(), tailwindcss(), inlineAssets()], build: { modulePreload: false, cssCodeSplit: false, rollupOptions: { output: { manualChunks: undefined } } } });
