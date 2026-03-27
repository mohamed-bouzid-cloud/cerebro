import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
=======
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
=======
  resolve: {
    alias: {
      'cornerstone-wado-image-loader': path.resolve(__dirname, 'node_modules/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoader.bundle.min.js')
    }
  },
  optimizeDeps: {
    include: ['cornerstone-wado-image-loader', 'cornerstone-core', 'dicom-parser']
  }
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
})
