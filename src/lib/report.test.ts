import { describe, it, expect, vi, beforeAll } from 'vitest'
import { careerByKey } from '../data/careers'
import { freshProgress } from '../state/trial'

// jsPDF's save() needs these blob/anchor APIs, which jsdom doesn't ship.
// (Any *.pdf it writes to the working dir is gitignored, so the repo stays clean.)
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

describe('generateReport', () => {
  it('builds a full PDF for a career without throwing', async () => {
    const { generateReport } = await import('./report')
    const career = careerByKey('data-analyst')!
    const progress = { ...freshProgress(), started: true, interestRating: 4, shiftChoices: { 0: 0, 1: 0, 2: 0, 3: 0 } }
    expect(() => generateReport(career, progress)).not.toThrow()
  })

  it('works for an AI-generated style career with empty sources', async () => {
    const { generateReport } = await import('./report')
    const base = careerByKey('electrician')!
    const generated = { ...base, generated: true, sources: [] }
    expect(() => generateReport(generated, freshProgress())).not.toThrow()
  })
})
