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

export async function checkMilestoneOwnership(a, b, anon, projectId, otherOwner) {
  const input = { project_id: projectId, kind: 'milestone', name: 'Delivery', amount_cents: 800029, completion_date: '2026-11-01', invoice_date: '2026-11-03', payment_terms_days: 7 }
  const created = await a.from('milestones').insert(input).select().single()
  assert.ifError(created.error)
  const id = created.data.id
  const foreign = await b.from('projects').insert({ owner_id: otherOwner, name: 'Other payment project', client_name: 'Other client', price_cents: 1000000, starting_cash_cents: 0, currency: 'AUD', start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' }).select().single()
  assert.ifError(foreign.error)
  try {
    assert.equal(created.data.expected_receipt_date, '2026-11-10')
    assert((await a.from('milestones').update({ expected_receipt_date: '2026-11-01' }).eq('id', id)).error, 'Generated date cannot be forged')
    for (const patch of [{ receipt_override_date: '2026-11-20' }, { payment_terms_days: -1 }, { payment_terms_days: 366 }, { amount_cents: 0 }, { name: ' ' }, { kind: 'actual' }, { invoice_date: '2026-02-30' }]) {
      assert((await a.from('milestones').update(patch).eq('id', id)).error, `Milestone constraint: ${JSON.stringify(patch)}`)
    }
    const override = await a.from('milestones').update({ receipt_override_date: '2026-11-20', receipt_override_reason: 'Client agreed' }).eq('id', id).select().single()
    assert.ifError(override.error); assert.equal(override.data.expected_receipt_date, '2026-11-20')
    const cleared = await a.from('milestones').update({ receipt_override_date: null, receipt_override_reason: null, invoice_date: '2026-12-31' }).eq('id', id).select().single()
    assert.ifError(cleared.error); assert.equal(cleared.data.expected_receipt_date, '2027-01-07')
    const reopened = await a.from('milestones').select().eq('id', id).single()
    assert.ifError(reopened.error); assert.equal(reopened.data.amount_cents, 800029)
    const hidden = await b.from('milestones').select().eq('id', id)
    assert.ifError(hidden.error); assert.deepEqual(hidden.data, [])
    for (const op of [b.from('milestones').update({ name: 'Attack' }).eq('id', id).select(), b.from('milestones').delete().eq('id', id).select()]) {
      const result = await op; assert.ifError(result.error); assert.deepEqual(result.data, [])
    }
    assert((await b.from('milestones').insert(input)).error)
    assert((await a.from('milestones').insert({ ...input, project_id: foreign.data.id })).error)
    assert((await a.from('milestones').update({ project_id: foreign.data.id }).eq('id', id)).error)
    assert((await anon.from('milestones').select()).error)
    assert((await a.from('projects').update({ tax_basis: 'exclusive' }).eq('id', projectId)).error, 'GST convention must lock when milestones exist')
    const deleted = await a.from('milestones').delete().eq('id', id).select()
    assert.ifError(deleted.error); assert.equal(deleted.data.length, 1)
    assert.deepEqual((await a.from('milestones').select().eq('id', id)).data, [])
    console.log('PASS: milestone CRUD, generated receipt dates, override reasons, calendar rollover, validation, isolation and GST lock.')
  } finally {
    await a.from('milestones').delete().eq('id', id)
    await b.from('projects').delete().eq('id', foreign.data.id)
  }
}
