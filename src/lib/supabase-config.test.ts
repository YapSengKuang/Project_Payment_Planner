import { expect, it } from 'vitest'
import { supabaseConfigProblem } from './supabase-config'
const key = 'sb_publishable_abcdefghijklmnopqrstuvwxyz'
const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=/g, '')}.signature`
it('accepts hosted publishable keys and local legacy anon keys', () => {
  expect(supabaseConfigProblem('https://example.supabase.co', key)).toBeNull()
  expect(supabaseConfigProblem('http://127.0.0.1:54321', jwt('anon'))).toBeNull()
})
it('rejects absent, placeholder, secret and service-role keys without echoing them', () => {
  for (const supplied of ['', undefined, 'replace-with-public-key', 'sb_secret_topsecret', jwt('service_role'), 'broken.jwt.value']) {
    const problem = supabaseConfigProblem('https://example.supabase.co', supplied)
    expect(problem).toBeTruthy()
    if (supplied) expect(problem).not.toContain(supplied)
  }
})
it('rejects unsafe or malformed origins while allowing local development', () => {
  for (const url of ['', 'not-a-url', 'http://example.supabase.co', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com?secret=x', 'https://example.com#fragment']) expect(supabaseConfigProblem(url, key)).toBeTruthy()
  expect(supabaseConfigProblem('http://localhost:54321', key)).toBeNull()
})
