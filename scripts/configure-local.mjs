// Copies only public browser configuration; never writes admin keys or JWT secrets.
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
const output = execFileSync('npx', ['supabase', 'status', '-o', 'json'], { encoding: 'utf8' })
const info = JSON.parse(output)
if (existsSync('.env.local') || existsSync('.env.test')) {
  throw new Error('Local environment files already exist. Update them manually rather than overwriting configuration.')
}
const key = info.PUBLISHABLE_KEY || info.ANON_KEY
if (!info.API_URL || !key) throw new Error('Supabase did not return public configuration.')
writeFileSync('.env.local', `VITE_SUPABASE_URL=${info.API_URL}\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\n`, { mode: 0o600 })
writeFileSync('.env.test', `SUPABASE_URL=${info.API_URL}\nSUPABASE_PUBLISHABLE_KEY=${key}\n`, { mode: 0o600 })
console.log('Local public configuration written to ignored .env.local and .env.test.')
