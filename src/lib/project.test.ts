import { describe, expect, it } from 'vitest'
import { MAX_CENTS, toCents, validateProject, validDate } from './project'
import type { ProjectFormValues } from './project'
const valid: ProjectFormValues = { name: ' Site build ', client_name: ' Client ', price: '10000.10', starting_cash: '0', start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' }
describe('exact money input', () => {
  it('converts decimal values without floating point rounding', () => {
    expect(toCents('0.29')).toBe(29)
    expect(toCents('10000.1')).toBe(1000010)
    expect(toCents(' 12.00 ')).toBe(1200)
    expect(toCents('999999999.99')).toBe(MAX_CENTS)
  })
  it.each(['-1', '1.001', '1e3', '', 'Infinity', '1,000', 'NaN', '1000000000'])('rejects %s', value => expect(toCents(value)).toBeNull())
})
describe('project validation', () => {
  it('returns trimmed fields and integer cents', () => {
    expect(validateProject(valid).input).toMatchObject({ name: 'Site build', client_name: 'Client', price_cents: 1000010, starting_cash_cents: 0, currency: 'AUD' })
  })
  it('requires a positive price, nonnegative cash and required text', () => {
    expect(validateProject({ ...valid, name: ' ', client_name: '', price: '0', starting_cash: '-1' }).errors).toHaveProperty('name')
    expect(Object.keys(validateProject({ ...valid, name: ' ', client_name: '', price: '0', starting_cash: '-1' }).errors)).toHaveLength(4)
  })
  it('rejects invalid date ranges and permits same-day projects', () => {
    expect(validateProject({ ...valid, end_date: '2026-10-31' }).errors.end_date).toBeDefined()
    expect(validateProject({ ...valid, end_date: valid.start_date }).input).toBeDefined()
    expect(validDate('2026-02-30')).toBe(false)
    expect(validDate('2028-02-29')).toBe(true)
    expect(validDate('2026-2-03')).toBe(false)
  })
})
