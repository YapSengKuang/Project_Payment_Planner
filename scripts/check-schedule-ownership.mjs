import assert from 'node:assert/strict'
export async function checkExpenseOwnership(a, b, anon, projectId, otherOwner) {
  const input = { project_id: projectId, description: 'Materials', amount_cents: 300029, payment_date: '2026-11-05' }
  const created = await a.from('expenses').insert(input).select().single()
  assert.ifError(created.error)
  const id = created.data.id
  const foreign = await b.from('projects').insert({ owner_id: otherOwner, name: 'Other project', client_name: 'Other client', price_cents: 1000000, starting_cash_cents: 0, currency: 'AUD', start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' }).select().single()
  assert.ifError(foreign.error)
  try {
    const read = await a.from('expenses').select().eq('id', id).single()
    assert.ifError(read.error); assert.equal(read.data.amount_cents, 300029)
    const edited = await a.from('expenses').update({ description: 'Updated materials' }).eq('id', id).select().single()
    assert.ifError(edited.error); assert.equal(edited.data.description, 'Updated materials')
    const hidden = await b.from('expenses').select().eq('id', id)
    assert.ifError(hidden.error); assert.deepEqual(hidden.data, [])
    for (const op of [b.from('expenses').update({ amount_cents: 1 }).eq('id', id).select(), b.from('expenses').delete().eq('id', id).select()]) {
      const result = await op; assert.ifError(result.error); assert.deepEqual(result.data, [])
    }
    assert((await b.from('expenses').insert(input)).error)
    assert((await a.from('expenses').insert({ ...input, project_id: foreign.data.id })).error)
    assert((await a.from('expenses').update({ project_id: foreign.data.id }).eq('id', id)).error)
    assert((await anon.from('expenses').select()).error)
    for (const patch of [{ amount_cents: 0 }, { amount_cents: -1 }, { amount_cents: 100000000000 }, { description: ' ' }, { payment_date: '2026-02-30' }]) {
      assert((await a.from('expenses').update(patch).eq('id', id)).error, `Expense constraint: ${JSON.stringify(patch)}`)
    }
    assert((await a.from('projects').update({ tax_basis: 'exclusive' }).eq('id', projectId)).error, 'GST convention must lock when expenses exist')
    const deleted = await a.from('expenses').delete().eq('id', id).select()
    assert.ifError(deleted.error); assert.equal(deleted.data.length, 1)
    assert.deepEqual((await a.from('expenses').select().eq('id', id)).data, [])
    console.log('PASS: expense CRUD, cents/date validation, project ownership, anonymous denial and GST lock.')
  } finally {
    await a.from('expenses').delete().eq('id', id)
    await b.from('projects').delete().eq('id', foreign.data.id)
  }
}
