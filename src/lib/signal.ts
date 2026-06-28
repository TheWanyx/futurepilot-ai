import type { RiskBand, Verdict } from '../data/types'

// Maps the semantic Go / Caution / Risk triad to concrete styles + copy so the
// signal colors mean the same thing everywhere (verdict, AI risk, debt risk, score).

export interface SignalStyle {
  text: string
  bg: string
  border: string
  ring: string
  hex: string
  label: string
}

export function scoreSignal(score: number): SignalStyle {
  if (score >= 67) return { text: 'text-go', bg: 'bg-go-soft', border: 'border-go/30', ring: 'stroke-go', hex: '#16b981', label: 'Strong' }
  if (score >= 45) return { text: 'text-caution', bg: 'bg-caution-soft', border: 'border-caution/30', ring: 'stroke-caution', hex: '#f59e0b', label: 'Mixed' }
  return { text: 'text-risk', bg: 'bg-risk-soft', border: 'border-risk/30', ring: 'stroke-risk', hex: '#f0526a', label: 'Weak' }
}

export function verdictSignal(v: Verdict): SignalStyle {
  if (v === 'go') return { text: 'text-go', bg: 'bg-go-soft', border: 'border-go/30', ring: 'stroke-go', hex: '#16b981', label: 'GO' }
  if (v === 'caution') return { text: 'text-caution', bg: 'bg-caution-soft', border: 'border-caution/30', ring: 'stroke-caution', hex: '#f59e0b', label: 'THINK TWICE' }
  return { text: 'text-risk', bg: 'bg-risk-soft', border: 'border-risk/30', ring: 'stroke-risk', hex: '#f0526a', label: 'EXPLORE' }
}

// For AI automation risk the scale is inverted: high number = bad.
export function aiRiskSignal(risk: number): SignalStyle {
  if (risk >= 60) return { text: 'text-risk', bg: 'bg-risk-soft', border: 'border-risk/30', ring: 'stroke-risk', hex: '#f0526a', label: 'High exposure' }
  if (risk >= 40) return { text: 'text-caution', bg: 'bg-caution-soft', border: 'border-caution/30', ring: 'stroke-caution', hex: '#f59e0b', label: 'Moderate' }
  return { text: 'text-go', bg: 'bg-go-soft', border: 'border-go/30', ring: 'stroke-go', hex: '#16b981', label: 'Resilient' }
}

export function bandSignal(band: RiskBand): SignalStyle {
  if (band === 'low') return { text: 'text-go', bg: 'bg-go-soft', border: 'border-go/30', ring: 'stroke-go', hex: '#16b981', label: 'Low risk' }
  if (band === 'medium') return { text: 'text-caution', bg: 'bg-caution-soft', border: 'border-caution/30', ring: 'stroke-caution', hex: '#f59e0b', label: 'Medium risk' }
  return { text: 'text-risk', bg: 'bg-risk-soft', border: 'border-risk/30', ring: 'stroke-risk', hex: '#f0526a', label: 'High risk' }
}
