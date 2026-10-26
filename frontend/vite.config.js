import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración para permitir acceso desde celulares y tablets en la red Wi-Fi
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Escucha en 0.0.0.0 (red local)
    port: 5173
  }
})
