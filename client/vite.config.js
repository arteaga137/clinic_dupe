// Configuración de Vite (el servidor de desarrollo y "empaquetador").
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // permite escribir JSX (<div>...</div> dentro de JS)
  server: {
    port: 5173,
    // host: true expone el servidor en tu red local, para abrir la app
    // desde el móvil (conectado al mismo Wi-Fi) con la IP de tu Mac.
    host: true,
    // PROXY: el frontend (puerto 5173) y la API (puerto 3001) son dos
    // servidores distintos. Con esto, cuando React pide '/api/...', Vite
    // reenvía la petición a Express. Así el código usa rutas relativas
    // ('/api/patients') y no hay problemas de CORS.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
