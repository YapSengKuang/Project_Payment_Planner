import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Project } from '../lib/project'
import type { Milestone } from '../lib/schedule'
import ScheduleSummary from './ScheduleSummary'
it('shows underallocated drafts, exact completion, and overallocations after a price change', () => {
  const project = { price_cents: 1000000 } as Project
  const milestones = [{ amount_cents: 200000 }] as Milestone[]
  const { rerender } = render(<ScheduleSummary project={project} expenses={[]} milestones={milestones}/>)
  expect(screen.getByRole('status')).toHaveTextContent('Schedule incomplete')
  expect(screen.getByText(/Allocate another \$8,000.00/)).toBeInTheDocument()
  rerender(<ScheduleSummary project={project} expenses={[]} milestones={[...milestones, { amount_cents: 800000 } as Milestone]}/>)
  expect(screen.getByRole('status')).toHaveTextContent('Payment schedule complete')
  rerender(<ScheduleSummary project={{ ...project, price_cents: 100000 }} expenses={[]} milestones={milestones}/>)
  expect(screen.getByRole('status')).toHaveTextContent('Schedule incomplete')
  expect(screen.getByText('Overallocated')).toBeInTheDocument()
})
