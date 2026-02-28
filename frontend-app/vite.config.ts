import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // @ts-ignore - Vite plugin type mismatch
  plugins: [react()],
})
