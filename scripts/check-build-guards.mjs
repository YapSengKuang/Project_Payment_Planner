import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'

const cases = [
  { label: 'missing configuration', url: '', key: '' },
  { label: 'secret key', url: 'https://example.supabase.co', key: 'sb_secret_disposable_test_marker' },
  { label: 'service-role JWT', url: 'https://example.supabase.co', key: `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature` },
  { label: 'insecure hosted URL', url: 'http://example.supabase.co', key: 'sb_publishable_abcdefghijklmnopqrstuvwxyz' },
]
for (const example of cases) {
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'release'], {
    encoding: 'utf8', env: { ...process.env, VITE_SUPABASE_URL: example.url, VITE_SUPABASE_PUBLISHABLE_KEY: example.key },
  })
  assert.ifError(result.error)
  const output = result.stdout + result.stderr
  assert.notEqual(result.status, 0, `${example.label} must stop the release build`)
  assert(output.includes('Supabase build configuration:'), `${example.label} must fail for configuration, not another build problem`)
  if (example.key) assert(!output.includes(example.key), 'Configuration errors must not disclose the key')
  console.log(`PASS: release build rejects ${example.label} without disclosing its key.`)
}
