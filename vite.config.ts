import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      // Expose GEMINI_API_KEY to the app (user has it without VITE_ prefix)
      '__GEMINI_API_KEY__': JSON.stringify(env.GEMINI_API_KEY),
    }
  }
})
