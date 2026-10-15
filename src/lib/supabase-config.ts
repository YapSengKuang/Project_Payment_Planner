// Public browser configuration only. Never include the supplied values in errors.
export function supabaseConfigProblem(url: unknown, key: unknown): string | null {
  if (typeof url !== 'string' || typeof key !== 'string' || !url || !key) return 'Set both public Supabase build variables.'
  try {
    const parsed = new URL(url)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') return 'Use an HTTPS Supabase project origin, or HTTP localhost for development.'
  } catch { return 'Use a valid Supabase project URL.' }
  if (/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)) return null
  // Legacy public anon JWTs are supported; service-role JWTs must never be bundled.
  try {
    const parts = key.split('.')
    if (parts.length !== 3 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) throw new Error()
    const claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (claims.role === 'anon') return null
  } catch { /* Return a safe message below. */ }
  return 'Use a public publishable or legacy anon key. Secret and service-role keys are forbidden.'
}
