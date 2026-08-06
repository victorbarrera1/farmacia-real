import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiDev } from './scripts/vite-api-dev'

// https://vite.dev/config/
export default defineConfig({
  // apiDev monta las funciones de api/ en el dev server (en producción las sirve Vercel)
  plugins: [react(), tailwindcss(), apiDev()],
})
