import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      externalizeDeps: true
    }
  },
  preload: {
    build: {
      outDir: 'out/preload',
      externalizeDeps: true
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve('src/renderer/index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
