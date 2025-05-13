import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  root: '.', // required for Vercel to locate index.html correctly
  publicDir: 'public', // explicitly point to public directory
})