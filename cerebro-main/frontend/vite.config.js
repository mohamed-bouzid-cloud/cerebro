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
<<<<<<< HEAD
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
=======
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
  }
})
