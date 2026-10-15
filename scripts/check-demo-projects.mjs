import assert from 'node:assert/strict'

export async function checkDemoProjects(a, b, anon) {
  const cleanup = []
  try {
    assert((await anon.rpc('load_demo_projects')).error, 'Anonymous seeding must fail')
    for (const date of [null, '1899-12-31', '9999-12-31']) {
      assert((await a.rpc('load_demo_projects', { p_start_date: date })).error)
    }
    const results = await Promise.all([1, 2].map(() => a.rpc('load_demo_projects', { p_start_date: '2026-11-01' })))
    for (const result of results) { assert.ifError(result.error); assert.equal(result.data.length, 2) }
    const projects = results[0].data
    cleanup.push(...projects.map(p => [a, p.id]))
    assert.deepEqual(results[1].data.map(p => p.id), projects.map(p => p.id))
    const [showcase, draft] = projects
    const expenses = await a.from('expenses').select().eq('project_id', showcase.id)
    const milestones = await a.from('milestones').select().eq('project_id', showcase.id)
    const revisions = await a.from('plan_revisions').select().eq('project_id', showcase.id).order('name')
    for (const result of [expenses, milestones, revisions]) assert.ifError(result.error)
    assert.equal(expenses.data.length, 3); assert.equal(milestones.data.length, 3); assert.equal(revisions.data.length, 4)
    const shift = (date, days) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10)
    const expectedGaps = [250000, 0, 100000, 330000]
    revisions.data.forEach((revision, i) => {
      const { baseline, settings } = revision
      const daily = new Map()
      const add = (date, amount) => daily.set(date, (daily.get(date) ?? 0) + amount)
      baseline.expenses.forEach(e => add(e.payment_date, -Math.round(e.amount_cents * (100 + settings.expenseIncreasePercent) / 100)))
      baseline.milestones.forEach(m => {
        const change = settings.changes.find(c => c.id === m.id)
        const date = change?.receipt_date ?? m.receipt_override_date ?? shift(m.invoice_date, m.payment_terms_days)
        add(shift(date, settings.receiptDelayDays), change?.amount_cents ?? m.amount_cents)
      })
      let balance = baseline.project.starting_cash_cents, lowest = balance
      for (const [, amount] of [...daily].sort(([a], [b]) => a.localeCompare(b))) { balance += amount; lowest = Math.min(lowest, balance) }
      assert.equal(Math.max(0, -lowest), expectedGaps[i], revision.name)
      assert.equal(balance, i === 3 ? 230000 : 300000)
    })
    const draftPayments = await a.from('milestones').select().eq('project_id', draft.id)
    assert.ifError(draftPayments.error)
    assert.equal(draft.price_cents - draftPayments.data.reduce((sum, m) => sum + m.amount_cents, 0), 680000)
    assert.ifError((await a.from('projects').update({ name: 'My edited demo' }).eq('id', showcase.id)).error)
    const repeated = await a.rpc('load_demo_projects', { p_start_date: '2027-01-01' })
    assert.ifError(repeated.error)
    assert.equal(repeated.data[0].name, 'My edited demo'); assert.equal(repeated.data[0].start_date, '2026-11-01')
    for (const table of ['projects', 'plan_revisions']) {
      const hidden = await b.from(table).select().eq(table === 'projects' ? 'id' : 'project_id', showcase.id)
      assert.ifError(hidden.error); assert.deepEqual(hidden.data, [])
    }
    assert((await a.from('demo_project_seeds').select()).error, 'Mapping must be private')
    const other = await b.rpc('load_demo_projects', { p_start_date: '2026-11-01' })
    assert.ifError(other.error)
    cleanup.push(...other.data.map(p => [b, p.id]))
    assert.equal(other.data.length, 2)
    assert(other.data.every(p => p.owner_id !== showcase.owner_id && !projects.some(x => x.id === p.id)))
    console.log('PASS: atomic demo seeding, concurrent retries, preserved edits, four verified forecast scenarios, incomplete draft and account isolation.')
  } finally {
    for (const [client, id] of cleanup) assert.ifError((await client.from('projects').delete().eq('id', id)).error)
  }
}
