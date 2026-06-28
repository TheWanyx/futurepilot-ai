// Core domain types for FuturePilot AI.
// Everything a career "trial" needs is described here so the UI stays data-driven:
// add a new Career object and the whole experience (brief, sim, life-math, score,
// report) works without touching components.

export type CareerCategory =
  | 'Technology'
  | 'Healthcare'
  | 'Business & Finance'
  | 'Creative & Media'
  | 'Engineering'
  | 'Legal'
  | 'Education'
  | 'Skilled Trades'
  | 'Other'

export interface University {
  name: string
  program: string
  /** Current published annual tuition for state residents (USD). */
  inStateAnnualUSD: number
  /** Current published annual tuition for non-residents (USD). */
  outStateAnnualUSD: number
  url: string
}

export interface NamedCost {
  name: string
  costUSD: number
  url: string
  /** Weeks to complete, when relevant (bootcamps, apprenticeships). */
  weeks?: number
}

export interface SimOption {
  text: string
  correct: boolean
  feedback: string
}

/** A realistic on-the-job mini task plus the "AI coworker mistake" twist. */
export interface WorkSimulation {
  scenario: string
  task: string
  /** The decision the student makes — exactly one option is correct. */
  options: SimOption[]
  /** What an AI coworker confidently recommends. */
  aiSuggestion: string
  /** The subtle, real flaw in that recommendation. */
  aiMistake: string
  /** How a thoughtful human catches it. */
  correctHumanJudgment: string
  /** "What did the AI get wrong?" — one option matches aiMistake. */
  aiCatchOptions: SimOption[]
}

// ---------------------------------------------------------------------------
// Shift simulation — a game-like "play a real day" sequence of connected beats.
// ---------------------------------------------------------------------------

export interface ShiftOption {
  text: string
  /** Outcome quality: 1 = best pro call, 0.5 = defensible but flawed, 0 = wrong. */
  quality: number
  consequence: string
  tag: string
}

export interface ShiftBeat {
  clock: string
  title: string
  situation: string
  decision: string
  kind: 'decision' | 'ai-trap'
  /** The AI coworker's confident (flawed) suggestion — only for 'ai-trap' beats. */
  aiSuggestion: string
  options: ShiftOption[]
}

export interface Shift {
  intro: string
  closer: string
  beats: ShiftBeat[]
}

export interface AiImpact {
  /** Tasks AI already automates or will soon. */
  automates: string[]
  /** Where human judgment still creates the value. */
  humanValue: string[]
  /** 0–100 honest automation exposure (higher = more at risk). */
  riskLevel: number
  riskNote: string
}

/** Authored baseline 0–100 scores; runtime blends in user interactions. */
export interface ScoreProfile {
  money: number
  interest: number
  skill: number
  aiResilience: number
  lifestyle: number
}

export interface PlanStep {
  title: string
  detail: string
}

export interface Career {
  key: string
  title: string
  category: CareerCategory
  socCode?: string
  /** One blunt, honest sentence about what the job really is. */
  oneLineReality: string

  // --- Bureau of Labor Statistics figures ---
  medianPayUSD: number
  medianPayYear: number
  entryLevelPayUSD: number
  partTimeHourlyUSD: number
  /** Projected employment growth percent. */
  outlookPercent: number
  outlookPeriod: string
  totalJobs?: number
  blsUrl: string

  // --- Reality brief ---
  typicalDay: string[]
  workStyle: string
  boringHardPart: string
  keyTools: string[]

  // --- Crash course ---
  crashCourse: string[]

  // --- Work simulation ---
  workSimulation: WorkSimulation
  /** Game-like multi-beat shift. Curated careers have one; generated careers fall back. */
  shift?: Shift

  // --- AI impact ---
  aiImpact: AiImpact

  // --- Education & money inputs (Life Math + Path Options derive from these) ---
  typicalDegree: string
  programLengthYears: number
  communityCollegeAnnualUSD: number
  universities: University[]
  bootcamp?: NamedCost | null
  certificate?: NamedCost | null

  // --- 30-day plan ---
  thirtyDayPlan: PlanStep[]

  // --- Scoring ---
  scoreProfile: ScoreProfile

  // --- Provenance ---
  sources: string[]
  /** True when this profile was generated on the fly by AI (long-tail careers). */
  generated?: boolean
}

// ---------------------------------------------------------------------------
// Path Options (derived from a Career's cost fields at render time)
// ---------------------------------------------------------------------------

export type PathSpeed = 'slow' | 'medium' | 'fast'
export type RiskBand = 'low' | 'medium' | 'high'

export interface PathOption {
  id: string
  label: string
  durationLabel: string
  totalCostUSD: number
  payoffSpeed: PathSpeed
  debtRisk: RiskBand
  summary: string
  pros: string[]
  cons: string[]
}

// ---------------------------------------------------------------------------
// Life Math
// ---------------------------------------------------------------------------

export interface Region {
  id: string
  label: string
  /** Salary multiplier vs national median (cost-of-living adjusted demand). */
  payMultiplier: number
  /** Annual living cost while studying / early career (USD). */
  livingCostUSD: number
}

export interface LifeMathInputs {
  path: PathOption
  region: Region
  isResident: boolean
  /** Hours/week the student works part-time during study. */
  partTimeHours: number
  /** Share of education cost covered by scholarships/grants/family (0–1). */
  aidFraction: number
}

export interface LifeMathResult {
  educationCostUSD: number
  /** Cost left after aid and part-time earnings. */
  estimatedDebtUSD: number
  startingSalaryUSD: number
  medianSalaryUSD: number
  monthlyLoanPaymentUSD: number
  firstYearTakeHomeUSD: number
  debtToIncome: number
  breakEvenYears: number
  /** Cumulative net-worth-ish series (post-grad), for the chart. */
  series: { year: number; value: number }[]
  riskBand: RiskBand
  headline: string
}

// ---------------------------------------------------------------------------
// Reality Score
// ---------------------------------------------------------------------------

export interface ScoreInputs {
  /** 0–1 accuracy on the work simulation decisions. */
  simAccuracy: number
  /** Did the student catch the AI coworker's mistake? */
  caughtAiMistake: boolean
  /** Student's self-rated interest, 1–5. */
  interestSelfRating: number
  /** Debt-to-income from Life Math, when available. */
  debtToIncome?: number
}

export type Verdict = 'go' | 'caution' | 'explore'

export interface ScoreResult {
  overall: number
  dims: ScoreProfile
  verdict: Verdict
  verdictLabel: string
  verdictReason: string
}
