import { describe, it, expect } from 'vitest'
import { computeLifeMath, monthlyLoanPayment } from './lifeMath'
import { buildPathOptions } from './paths'
import { careerByKey } from '../data/careers'
import { DEFAULT_REGION } from './regions'

const career = careerByKey('software-developer')!
const uniPath = buildPathOptions(career).find((p) => p.id === 'university-in-state')!

describe('monthlyLoanPayment', () => {
  it('is zero for no principal', () => {
    expect(monthlyLoanPayment(0)).toBe(0)
  })

  it('amortises a known loan to the textbook payment', () => {
    // $20,000 at 6.5% over 10 years ≈ $227/mo
    const m = monthlyLoanPayment(20000)
    expect(m).toBeGreaterThan(220)
    expect(m).toBeLessThan(235)
  })
})

describe('computeLifeMath', () => {
  const inputs = {
    path: uniPath,
    region: DEFAULT_REGION,
    isResident: true,
    partTimeHours: 10,
    aidFraction: 0.3,
  }

  it('reduces debt as aid increases', () => {
    const lowAid = computeLifeMath(career, { ...inputs, aidFraction: 0 })
    const highAid = computeLifeMath(career, { ...inputs, aidFraction: 0.8 })
    expect(highAid.estimatedDebtUSD).toBeLessThan(lowAid.estimatedDebtUSD)
  })

  it('never produces negative debt', () => {
    const r = computeLifeMath(career, { ...inputs, aidFraction: 1, partTimeHours: 40 })
    expect(r.estimatedDebtUSD).toBeGreaterThanOrEqual(0)
  })

  it('returns an 11-point projection starting at minus the debt', () => {
    const r = computeLifeMath(career, inputs)
    expect(r.series).toHaveLength(11)
    expect(r.series[0]).toEqual({ year: 0, value: -r.estimatedDebtUSD })
  })

  it('scales starting salary by the region multiplier', () => {
    const national = computeLifeMath(career, inputs)
    const highCost = computeLifeMath(career, {
      ...inputs,
      region: { id: 'x', label: 'x', payMultiplier: 1.5, livingCostUSD: 24000 },
    })
    expect(highCost.startingSalaryUSD).toBeGreaterThan(national.startingSalaryUSD)
  })
})
