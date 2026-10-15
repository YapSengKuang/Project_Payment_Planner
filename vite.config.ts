import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { supabaseConfigProblem } from './src/lib/supabase-config.ts'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const problem = supabaseConfigProblem(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (command === 'build' && problem && (mode === 'release' || env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
    throw new Error(`Supabase build configuration: ${problem}`)
  }
  return {
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', restoreMocks: true },
  }
})
