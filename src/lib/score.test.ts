import { describe, it, expect } from 'vitest'
import { computeRealityScore } from './score'
import { careers, careerByKey } from '../data/careers'

const dataAnalyst = careerByKey('data-analyst')!

const baseInputs = {
  simAccuracy: 0.75,
  caughtAiMistake: true,
  interestSelfRating: 4,
  debtToIncome: 0.4,
}

describe('computeRealityScore', () => {
  it('keeps every dimension and the overall within 0–100', () => {
    for (const c of careers) {
      const r = computeRealityScore(c, baseInputs)
      expect(r.overall).toBeGreaterThanOrEqual(0)
      expect(r.overall).toBeLessThanOrEqual(100)
      for (const v of Object.values(r.dims)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    }
  })

  it('rewards catching the AI mistake with higher AI resilience', () => {
    const caught = computeRealityScore(dataAnalyst, { ...baseInputs, caughtAiMistake: true })
    const missed = computeRealityScore(dataAnalyst, { ...baseInputs, caughtAiMistake: false })
    expect(caught.dims.aiResilience).toBeGreaterThan(missed.dims.aiResilience)
  })

  it('lets a strong self-rated interest lift the interest dimension', () => {
    const low = computeRealityScore(dataAnalyst, { ...baseInputs, interestSelfRating: 1 })
    const high = computeRealityScore(dataAnalyst, { ...baseInputs, interestSelfRating: 5 })
    expect(high.dims.interest).toBeGreaterThan(low.dims.interest)
  })

  it('caps the verdict at "go" only when interest is high enough', () => {
    const disengaged = computeRealityScore(dataAnalyst, {
      simAccuracy: 1,
      caughtAiMistake: true,
      interestSelfRating: 1,
      debtToIncome: 0.1,
    })
    expect(disengaged.verdict).not.toBe('go')
  })

  it('penalises money when debt-to-income is crushing', () => {
    const healthy = computeRealityScore(dataAnalyst, { ...baseInputs, debtToIncome: 0.2 })
    const crushing = computeRealityScore(dataAnalyst, { ...baseInputs, debtToIncome: 1.5 })
    expect(crushing.dims.money).toBeLessThan(healthy.dims.money)
  })
})
