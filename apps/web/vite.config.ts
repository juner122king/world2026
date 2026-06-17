import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { createDevContentPlugin } from './dev-content.js'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')

  return {
    plugins: [react(), createDevContentPlugin(env)],
    base: env.VITE_BASE_PATH || '/',
    publicDir: fileURLToPath(new URL('../../public-data', import.meta.url)),
    build: {
      outDir: '../../dist',
      emptyOutDir: true,
    },
  }
})
