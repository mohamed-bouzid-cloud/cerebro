import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'cornerstone-wado-image-loader': path.resolve(__dirname, 'node_modules/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoader.bundle.min.js')
    }
  },
  optimizeDeps: {
    include: ['cornerstone-wado-image-loader', 'cornerstone-core', 'dicom-parser']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
