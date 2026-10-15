import { URL } from 'node:url'
export function requireLocalTestBackend(value) {
  const parsed = new URL(value)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || !['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Integration tests create disposable accounts and records. SUPABASE_URL must target localhost; hosted projects are forbidden.')
  }
}
