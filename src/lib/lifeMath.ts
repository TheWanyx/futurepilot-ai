import type { Career, LifeMathInputs, LifeMathResult, RiskBand } from '../data/types'

const STUDENT_WAGE_USD = 16 // realistic part-time hourly while studying
const STUDY_WEEKS_PER_YEAR = 50
const EFFECTIVE_TAX = 0.2 // rough blended tax for an early-career single filer
const LOAN_APR = 0.065
const LOAN_YEARS = 10

/** Standard fixed-rate amortized monthly payment. */
export function monthlyLoanPayment(principal: number, apr = LOAN_APR, years = LOAN_YEARS): number {
  if (principal <= 0) return 0
  const r = apr / 12
  const n = years * 12
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

function riskFromDti(dti: number, debt: number): RiskBand {
  if (debt < 8000 || dti < 0.5) return 'low'
  if (dti < 1.1) return 'medium'
  return 'high'
}

/**
 * Turn an education path + a student's situation into the money reality:
 * debt after aid and part-time work, what early salary actually clears after
 * tax, living cost and loan payments, and how long until it pays off.
 */
export function computeLifeMath(career: Career, inputs: LifeMathInputs): LifeMathResult {
  const { path, region, partTimeHours, aidFraction } = inputs
  const studyYears = Math.max(1, Math.round(parseFloat(path.durationLabel) || career.programLengthYears || 4))

  const educationCost = path.totalCostUSD
  const aid = educationCost * Math.min(Math.max(aidFraction, 0), 1)
  const partTimeEarnings = partTimeHours * STUDENT_WAGE_USD * STUDY_WEEKS_PER_YEAR * studyYears
  const estimatedDebt = Math.max(0, educationCost - aid - partTimeEarnings)

  const startingSalary = Math.round(career.entryLevelPayUSD * region.payMultiplier)
  const medianSalary = Math.round(career.medianPayUSD * region.payMultiplier)

  const monthly = monthlyLoanPayment(estimatedDebt)
  const annualLoan = monthly * 12
  const firstYearTakeHome = Math.round(startingSalary * (1 - EFFECTIVE_TAX) - region.livingCostUSD - annualLoan)
  const debtToIncome = startingSalary > 0 ? estimatedDebt / startingSalary : 0

  // Cumulative cash position after graduation: salary ramps start -> median
  // over 5 years, minus tax, living cost and loan payments until the loan clears.
  const series: { year: number; value: number }[] = [{ year: 0, value: -Math.round(estimatedDebt) }]
  let cash = -estimatedDebt
  let remainingDebt = estimatedDebt
  for (let y = 1; y <= 10; y++) {
    const ramp = Math.min(1, y / 5)
    const salary = startingSalary + (medianSalary - startingSalary) * ramp
    const loanThisYear = remainingDebt > 0 ? Math.min(annualLoan, remainingDebt * (1 + LOAN_APR)) : 0
    remainingDebt = Math.max(0, remainingDebt - Math.max(0, annualLoan - estimatedDebt * LOAN_APR))
    const net = salary * (1 - EFFECTIVE_TAX) - region.livingCostUSD - loanThisYear
    cash += net
    series.push({ year: y, value: Math.round(cash) })
  }

  // Break-even = study years + years of post-grad surplus to erase total education cost.
  const annualSurplus = Math.max(1, startingSalary * (1 - EFFECTIVE_TAX) - region.livingCostUSD)
  const breakEvenYears = Math.round((studyYears + estimatedDebt / annualSurplus) * 10) / 10

  const riskBand = riskFromDti(debtToIncome, estimatedDebt)

  const headline =
    estimatedDebt <= 0
      ? `You can reach this job with roughly no debt — part-time work and aid cover the ${path.label.toLowerCase()}.`
      : riskBand === 'high'
        ? `Heads up: about ${Math.round(debtToIncome * 100)}% of your first-year salary in debt. That’s a heavy load for a ${startingSalary.toLocaleString('en-US')} starting wage.`
        : riskBand === 'medium'
          ? `Manageable but real: ~$${Math.round(monthly)}/mo in loan payments against a ${startingSalary.toLocaleString('en-US')} start.`
          : `Low-risk money path — debt stays small relative to what you’ll earn early on.`

  return {
    educationCostUSD: Math.round(educationCost),
    estimatedDebtUSD: Math.round(estimatedDebt),
    startingSalaryUSD: startingSalary,
    medianSalaryUSD: medianSalary,
    monthlyLoanPaymentUSD: Math.round(monthly),
    firstYearTakeHomeUSD: firstYearTakeHome,
    debtToIncome: Math.round(debtToIncome * 100) / 100,
    breakEvenYears,
    series,
    riskBand,
    headline,
  }
}
