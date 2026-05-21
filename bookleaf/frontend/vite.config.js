import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const port = parseInt(env.VITE_PORT) || 5173
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        // Only active in local dev (when VITE_API_BASE_URL is empty)
        '/api': {
          target: backendUrl,
          changeOrigin: true
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  }
})
