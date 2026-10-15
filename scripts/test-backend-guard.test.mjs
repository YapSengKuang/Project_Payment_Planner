import { expect, it } from 'vitest'
import { requireLocalTestBackend } from './test-backend-guard.mjs'
it('allows only loopback integration backends before creating disposable records', () => {
  for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321']) expect(() => requireLocalTestBackend(url)).not.toThrow()
  for (const url of ['https://example.supabase.co', 'http://localhost.example.com', 'https://127.0.0.1.example.com', 'file:///tmp/database']) expect(() => requireLocalTestBackend(url)).toThrow(/localhost/)
})
