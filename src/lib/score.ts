import type { Career, ScoreInputs, ScoreProfile, ScoreResult, Verdict } from '../data/types'
import { clamp, blend } from './format'

const WEIGHTS: ScoreProfile = {
  money: 0.22,
  interest: 0.24,
  skill: 0.18,
  aiResilience: 0.2,
  lifestyle: 0.16,
}

export const DIMENSION_META: { key: keyof ScoreProfile; label: string; help: string }[] = [
  { key: 'money', label: 'Money', help: 'Pay and earning trajectory vs other careers.' },
  { key: 'interest', label: 'Interest', help: 'How well the real day-to-day matches what excites you.' },
  { key: 'skill', label: 'Skill fit', help: 'How attainable the required skills are for you right now.' },
  { key: 'aiResilience', label: 'AI resilience', help: 'How safe the role is from automation over the next decade.' },
  { key: 'lifestyle', label: 'Lifestyle', help: 'Work-life balance, stress, and schedule honesty.' },
]

/**
 * Blend a career's authored baseline with what the student actually did in the
 * trial: their sim accuracy, whether they caught the AI's mistake, their self-
 * rated interest, and their debt-to-income from Life Math.
 */
export function computeRealityScore(career: Career, inputs: ScoreInputs): ScoreResult {
  const base = career.scoreProfile

  // Interest is driven mostly by the student's own rating (1–5 -> 0–100).
  const interest = clamp(blend(base.interest, (inputs.interestSelfRating / 5) * 100, 0.6))

  // Sim accuracy nudges perceived skill fit; doing well proves the work suits them.
  const skill = clamp(blend(base.skill, inputs.simAccuracy * 100, 0.35))

  // Catching the AI's mistake is the whole thesis — it rewards human judgment.
  const aiResilience = clamp(base.aiResilience + (inputs.caughtAiMistake ? 8 : -5))

  // Heavy debt relative to income drags the money score down.
  let money = base.money
  if (inputs.debtToIncome !== undefined) {
    if (inputs.debtToIncome > 1.1) money = clamp(money - 14)
    else if (inputs.debtToIncome > 0.6) money = clamp(money - 6)
    else if (inputs.debtToIncome < 0.25) money = clamp(money + 5)
  }

  const lifestyle = base.lifestyle
  const dims: ScoreProfile = {
    money: Math.round(money),
    interest: Math.round(interest),
    skill: Math.round(skill),
    aiResilience: Math.round(aiResilience),
    lifestyle: Math.round(lifestyle),
  }

  const overall = Math.round(
    dims.money * WEIGHTS.money +
      dims.interest * WEIGHTS.interest +
      dims.skill * WEIGHTS.skill +
      dims.aiResilience * WEIGHTS.aiResilience +
      dims.lifestyle * WEIGHTS.lifestyle,
  )

  const { verdict, verdictLabel } = decideVerdict(overall, dims)
  const verdictReason = buildReason(career, dims, verdict, inputs)

  return { overall, dims, verdict, verdictLabel, verdictReason }
}

function decideVerdict(overall: number, dims: ScoreProfile): { verdict: Verdict; verdictLabel: string } {
  // Low interest caps the verdict no matter how good the numbers are.
  if (overall >= 70 && dims.interest >= 55) return { verdict: 'go', verdictLabel: 'Strong fit — worth a real shot' }
  if (overall >= 52) return { verdict: 'caution', verdictLabel: 'Promising — go in with eyes open' }
  return { verdict: 'explore', verdictLabel: 'Test more before you commit' }
}

const dimLabel: Record<keyof ScoreProfile, string> = {
  money: 'pay',
  interest: 'how well it matches your interest',
  skill: 'skill fit',
  aiResilience: 'AI resilience',
  lifestyle: 'work-life balance',
}

function buildReason(
  career: Career,
  dims: ScoreProfile,
  verdict: Verdict,
  inputs: ScoreInputs,
): string {
  const entries = (Object.keys(dims) as (keyof ScoreProfile)[]).map((k) => ({ k, v: dims[k] }))
  const top = entries.reduce((a, b) => (b.v > a.v ? b : a))
  const low = entries.reduce((a, b) => (b.v < a.v ? b : a))
  const caught = inputs.caughtAiMistake
    ? 'You caught the AI coworker’s mistake — exactly the human judgment this field still pays for.'
    : 'You missed the AI coworker’s mistake this round; that judgment is the skill to build before you rely on AI here.'

  const lead =
    verdict === 'go'
      ? `${career.title} lines up well for you`
      : verdict === 'caution'
        ? `${career.title} could work`
        : `${career.title} is worth exploring, but not betting on yet`

  return `${lead}: your strongest signal is ${dimLabel[top.k]} (${top.v}/100), your biggest watch-out is ${dimLabel[low.k]} (${low.v}/100). ${caught}`
}
