import type { Career, PathOption, RiskBand } from '../data/types'

const avg = (nums: number[]): number =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0

function debtBand(totalCost: number): RiskBand {
  if (totalCost <= 12000) return 'low'
  if (totalCost <= 60000) return 'medium'
  return 'high'
}

/**
 * Derive the comparable education/entry paths for a career from its real cost
 * fields. Every path a student could realistically take to this job, with an
 * honest cost, time, and debt-risk read — so Path Options and Life Math share
 * one source of truth.
 */
export function buildPathOptions(career: Career): PathOption[] {
  const years = career.programLengthYears || 4
  const inState = avg(career.universities.map((u) => u.inStateAnnualUSD))
  const outState = avg(career.universities.map((u) => u.outStateAnnualUSD))
  const options: PathOption[] = []

  // 1. Public university, in-state
  const uniInCost = inState * years
  options.push({
    id: 'university-in-state',
    label: 'Public university (in-state)',
    durationLabel: `${years} years`,
    totalCostUSD: uniInCost,
    payoffSpeed: 'slow',
    debtRisk: debtBand(uniInCost),
    summary: `A ${years}-year ${career.typicalDegree.toLowerCase().includes('bachelor') ? 'bachelor’s' : 'degree'} at your state’s public university — the default route most employers recognize.`,
    pros: ['Widely recognized credential', 'Internships, campus recruiting, alumni network', 'Lowest-risk path into licensed/regulated roles'],
    cons: ['4 years before full-time income', 'Largest time commitment', 'Cost varies a lot by school'],
  })

  // 2. Out-of-state / private university (only if meaningfully pricier)
  if (outState > inState * 1.4) {
    const uniOutCost = outState * years
    options.push({
      id: 'university-out-state',
      label: 'Out-of-state / private university',
      durationLabel: `${years} years`,
      totalCostUSD: uniOutCost,
      payoffSpeed: 'slow',
      debtRisk: 'high',
      summary: 'Same degree, much higher sticker price. Only worth it with strong aid or a standout program.',
      pros: ['Access to specific top programs', 'Bigger brand on the résumé'],
      cons: ['Highest debt risk of any path', 'Out-of-state tuition rarely pays for itself', 'Negotiate aid before committing'],
    })
  }

  // 3. Community college → transfer (2+2)
  const ccCost = career.communityCollegeAnnualUSD * 2 + inState * 2
  options.push({
    id: 'community-transfer',
    label: 'Community college → transfer (2+2)',
    durationLabel: `${years} years`,
    totalCostUSD: ccCost,
    payoffSpeed: 'medium',
    debtRisk: debtBand(ccCost),
    summary: 'Two years at community college, then transfer to finish the degree — same diploma, far less debt.',
    pros: ['Cuts tuition sharply for the same degree', 'Smaller classes early on', 'Easier to work while studying'],
    cons: ['Credits must transfer cleanly — plan early', 'Less of the traditional campus experience'],
  })

  // 4. Bootcamp (when a credible one exists)
  if (career.bootcamp) {
    options.push({
      id: 'bootcamp',
      label: 'Bootcamp / intensive',
      durationLabel: career.bootcamp.weeks ? `${career.bootcamp.weeks} weeks` : 'A few months',
      totalCostUSD: career.bootcamp.costUSD,
      payoffSpeed: 'fast',
      debtRisk: debtBand(career.bootcamp.costUSD),
      summary: `${career.bootcamp.name} — skip the degree and go skills-first. Fastest route in, but you’ll prove yourself by portfolio.`,
      pros: ['Working in months, not years', 'Project-based and job-focused', 'A fraction of a degree’s cost'],
      cons: ['No credential cushion if hiring tightens', 'Outcomes vary widely by program', 'You drive your own job search'],
    })
  }

  // 5. Certificate / self-taught (when a credible one exists)
  if (career.certificate) {
    options.push({
      id: 'certificate',
      label: 'Certificate / self-taught',
      durationLabel: '3–9 months',
      totalCostUSD: career.certificate.costUSD,
      payoffSpeed: 'fast',
      debtRisk: 'low',
      summary: `${career.certificate.name} — the cheapest way to test whether the field is for you before you commit real money.`,
      pros: ['Almost no debt risk', 'Learn at your own pace', 'Great for trying the field on'],
      cons: ['Weakest signal to employers alone', 'Needs a portfolio to back it up', 'Rarely enough for licensed roles'],
    })
  }

  return options
}
