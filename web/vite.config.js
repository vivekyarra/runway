import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative built asset URLs keep the checked-in demo portable.
  base: './',
  plugins: [react()],
})
