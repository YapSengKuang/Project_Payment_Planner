type Props = { busy: boolean; disabled: boolean; onLoad: () => void }
export default function DemoProjects({ busy, disabled, onLoad }: Props) {
  return <section className="panel demo-projects" aria-label="Feature showcase">
    <div className="section-top"><div><p className="eyebrow">TRY THE FEATURES</p><h2>Explore with sample projects</h2></div><button className="button secondary" disabled={busy || disabled} onClick={onLoad}>{busy ? 'Loading demo projects…' : 'Load demo projects'}</button></div>
    <p>Creates two private, fictional projects in your account. Later clicks reopen the same examples and preserve your edits.</p>
    <ul><li><strong>Website redesign:</strong> expenses, a deposit, two milestones, invoice terms and an explained receipt override. Forecast starts with a $2,500 gap.</li>
      <li><strong>Plan & compare:</strong> four saved examples show original terms, a larger deposit with no gap, a deposit cap leaving a $1,000 gap, and late receipts with higher costs. Edit a proposal, save a new revision or print it.</li>
      <li><strong>Incomplete draft:</strong> starting cash and an unfinished payment schedule show the draft warnings and amount still to allocate.</li></ul>
    <p className="summary-note">Dates start from today when first created. Sample projects are editable working drafts; your other projects are unchanged.</p>
  </section>
}
