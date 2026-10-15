// Uses real Supabase Auth accounts and direct PostgREST requests. No service key needed.
// Run only against a local/dedicated test project with email confirmation disabled.
import assert from 'node:assert/strict'
import { checkRevisions } from './check-revisions.mjs'
import { checkExpenseOwnership, checkMilestoneOwnership } from './check-schedule-ownership.mjs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY
assert(url && key, 'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for a dedicated test backend.')
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const suffix = randomUUID()
const a = client(), b = client(), anon = client()
async function register(c, label) {
  const { data, error } = await c.auth.signUp({ email: `planner-${label}-${suffix}@example.com`, password: `T3st!${randomUUID()}` })
  assert.ifError(error)
  assert(data.session, 'Test backend must disable email confirmation. Never disable this on a production project for tests.')
  return data.user.id
}
const owner = await register(a, 'a')
const other = await register(b, 'b')
const input = { owner_id: owner, name: 'Isolation test', client_name: 'Test client', price_cents: 1000029, starting_cash_cents: 0, currency: 'AUD', start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' }
let id
try {
  const created = await a.from('projects').insert(input).select().single()
  assert.ifError(created.error); id = created.data.id
  await checkExpenseOwnership(a, b, anon, id, other)
  await checkMilestoneOwnership(a, b, anon, id, other)
  await checkRevisions(a, b, anon, id)
  const own = await a.from('projects').select().eq('id', id).single()
  assert.ifError(own.error); assert.equal(own.data.price_cents, 1000029)
  const hidden = await b.from('projects').select().eq('id', id)
  assert.ifError(hidden.error); assert.deepEqual(hidden.data, [])
  for (const operation of [b.from('projects').update({ name: 'Attack' }).eq('id', id).select(), b.from('projects').delete().eq('id', id).select()]) {
    const result = await operation
    assert.ifError(result.error); assert.deepEqual(result.data, [])
  }
  const forged = await b.from('projects').insert(input)
  assert(forged.error, 'Cross-owner insert must fail')
  const reassigned = await a.from('projects').update({ owner_id: other }).eq('id', id)
  assert(reassigned.error, 'Owner reassignment must fail')
  for (const patch of [{ price_cents: 0 }, { starting_cash_cents: -1 }, { end_date: '2026-10-31' }, { name: ' ' }, { currency: 'USD' }, { price_cents: 100000000000 }, { tax_basis: 'invalid' }]) {
    const invalid = await a.from('projects').update(patch).eq('id', id)
    assert(invalid.error, `Database must reject ${JSON.stringify(patch)}`)
  }
  for (const op of [anon.from('projects').select(), anon.from('projects').insert(input), anon.from('projects').update({ name: 'Attack' }).eq('id', id), anon.from('projects').delete().eq('id', id)]) {
    const result = await op
    assert(result.error || result.data?.length === 0, 'Anonymous access must not expose or change records')
  }
  const updated = await a.from('projects').update({ name: 'Updated project' }).eq('id', id).select().single()
  assert.ifError(updated.error); assert.equal(updated.data.name, 'Updated project')
  assert.equal(updated.data.created_at, created.data.created_at)
  const reopened = await a.from('projects').select().eq('id', id).single()
  assert.ifError(reopened.error); assert.equal(reopened.data.name, 'Updated project')
  console.log('PASS: real sign-up, project save/reopen/update, database validation, two-account isolation, owner reassignment and anonymous denial.')
} finally {
  if (id) {
    const deleted = await a.from('projects').delete().eq('id', id).select()
    assert.ifError(deleted.error); assert.equal(deleted.data.length, 1)
    const gone = await a.from('projects').select().eq('id', id)
    assert.deepEqual(gone.data, [])
  }
  await Promise.all([a.auth.signOut(), b.auth.signOut()])
  console.log('Test projects removed; disposable test Auth accounts remain until local database reset.')
}
