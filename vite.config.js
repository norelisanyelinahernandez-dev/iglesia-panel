import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'pages-admin': [
            './src/pages/Dashboard.jsx',
            './src/pages/Miembros.jsx',
            './src/pages/Tesoreria.jsx',
            './src/pages/Finanzas.jsx',
            './src/pages/Reportes.jsx',
            './src/pages/Inventario.jsx',
            './src/pages/Respaldo.jsx',
          ],
          'pages-content': [
            './src/pages/Eventos.jsx',
            './src/pages/Programa.jsx',
            './src/pages/Anuncios.jsx',
            './src/pages/Asistencia.jsx',
            './src/pages/Pastora.jsx',
            './src/pages/Documentos.jsx',
          ],
          'pages-miembro': [
            './src/pages/DashboardMiembro.jsx',
            './src/pages/MiPerfilMiembro.jsx',
          ],
        }
      }
    }
  }
})
