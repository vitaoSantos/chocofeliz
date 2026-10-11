import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // O three.js sozinho passa do limite padrão de aviso; ele já fica num chunk separado (lazy)
    chunkSizeWarningLimit: 1200,
  },
})
