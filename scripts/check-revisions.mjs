import assert from 'node:assert/strict'
export async function checkRevisions(a, b, anon, projectId) {
  const basePayment = { project_id: projectId, completion_date: '2026-11-01', invoice_date: '2026-11-01', payment_terms_days: 0 }
  const payments = await a.from('milestones').insert([
    { ...basePayment, name: 'Deposit', kind: 'deposit', amount_cents: 200000 },
    { ...basePayment, name: 'Delivery', kind: 'milestone', amount_cents: 800029, invoice_date: '2026-11-15' },
  ]).select()
  assert.ifError(payments.error)
  const expense = await a.from('expenses').insert({ project_id: projectId, description: 'Materials', amount_cents: 300029, payment_date: '2026-11-05' }).select().single()
  assert.ifError(expense.error)
  async function snapshot() {
    const project = await a.from('projects').select('*').eq('id', projectId).single()
    const expenses = await a.from('expenses').select('*').eq('project_id', projectId).order('id')
    const milestones = await a.from('milestones').select('*').eq('project_id', projectId).order('id')
    for (const result of [project, expenses, milestones]) assert.ifError(result.error)
    return { project: project.data, expenses: expenses.data, milestones: milestones.data }
  }
  const baseline = await snapshot()
  const settings = { receiptDelayDays: 0, expenseIncreasePercent: 0, depositCapCents: baseline.project.price_cents, changes: [] }
  const args = { p_project_id: projectId, p_name: 'Original terms', p_expected_baseline: baseline, p_settings: settings, p_source_revision_id: null }
  const first = await a.rpc('save_plan_revision', args).single()
  assert.ifError(first.error)
  assert.deepEqual(first.data.baseline, baseline)
  assert.deepEqual(first.data.settings, settings)
  assert.deepEqual((await b.from('plan_revisions').select().eq('id', first.data.id)).data, [])
  assert((await anon.from('plan_revisions').select()).error)
  assert((await b.rpc('save_plan_revision', args)).error)
  assert((await anon.rpc('save_plan_revision', args)).error)
  assert((await a.from('plan_revisions').insert({ project_id: projectId, name: 'Forged', baseline, settings })).error)
  assert((await a.from('plan_revisions').update({ name: 'Overwrite' }).eq('id', first.data.id)).error)
  assert((await a.from('plan_revisions').delete().eq('id', first.data.id)).error)
  const deposit = payments.data.find(row => row.kind === 'deposit')
  const delivery = payments.data.find(row => row.kind === 'milestone')
  const changes = [
    { id: deposit.id, amount_cents: 300029, receipt_date: '2026-11-01', reason: 'Cover materials' },
    { id: delivery.id, amount_cents: 700000, receipt_date: '2026-11-15', reason: 'Rebalance deposit' },
  ]
  for (const patch of [
    { receiptDelayDays: 366 }, { expenseIncreasePercent: -1 }, { expenseIncreasePercent: 0.5 },
    { depositCapCents: baseline.project.price_cents + 1 }, { depositCapCents: 1 }, { changes: [{ ...changes[0], reason: '' }] },
    { changes: [changes[0]] }, { changes: [changes[0], changes[0]] },
    { changes: [{ ...changes[0], id: 'not-owned' }] }, { changes: [{ ...changes[0], receipt_date: '2026-02-30' }] },
  ]) assert((await a.rpc('save_plan_revision', { ...args, p_settings: { ...settings, ...patch } })).error, `Reject ${JSON.stringify(patch)}`)
  const revised = await a.rpc('save_plan_revision', { ...args, p_name: 'Materials covered', p_settings: { ...settings, changes }, p_source_revision_id: first.data.id }).single()
  assert.ifError(revised.error)
  const edited = await a.from('expenses').update({ amount_cents: 400029 }).eq('id', expense.data.id)
  assert.ifError(edited.error)
  assert((await a.rpc('save_plan_revision', args)).error, 'Stale reviewed inputs must not capture changed data')
  const reopened = await a.from('plan_revisions').select('*').eq('id', first.data.id).single()
  assert.ifError(reopened.error)
  assert.deepEqual(reopened.data, first.data, 'Later schedule edits must not mutate any snapshot fields')
  const derived = await a.rpc('save_plan_revision', { ...args, p_name: 'Delay from preserved original', p_settings: { ...settings, receiptDelayDays: 7 }, p_source_revision_id: first.data.id }).single()
  assert.ifError(derived.error)
  assert.deepEqual(derived.data.baseline, baseline)
  assert.ifError((await a.from('milestones').delete().eq('project_id', projectId)).error)
  assert.ifError((await a.from('expenses').delete().eq('project_id', projectId)).error)
  console.log('PASS: immutable plan revisions, server snapshots, save/reopen/derive, stale-input rejection, validation, anonymous denial and two-account isolation.')
}
