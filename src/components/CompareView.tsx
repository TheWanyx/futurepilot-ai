import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { careers } from '../data/careers'
import { useTrial, freshProgress } from '../state/trial'
import { resolveCareer, scoreFor, lifeMathFor } from '../state/selectors'
import { careerIcon } from '../lib/icons'
import { usd } from '../lib/format'
import { verdictSignal } from '../lib/signal'
import type { Career } from '../data/types'

interface Row {
  label: string
  a: number
  b: number
  fmt: (n: number) => string
  higherBetter: boolean
}

function metricsFor(career: Career) {
  const fresh = freshProgress()
  const score = scoreFor(career, fresh)
  const lm = lifeMathFor(career, fresh)
  return {
    overall: score.overall,
    median: career.medianPayUSD,
    outlook: career.outlookPercent,
    aiResilience: 100 - career.aiImpact.riskLevel,
    debt: lm.estimatedDebtUSD,
    start: lm.startingSalaryUSD,
  }
}

export function CompareView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useTrial()
  const all = useMemo(() => [...state.generated, ...careers], [state.generated])
  const current = resolveCareer(state.selectedKey, state.generated) ?? careers[0]
  const [otherKey, setOtherKey] = useState(() => careers.find((c) => c.key !== current.key)!.key)
  const other = resolveCareer(otherKey, state.generated) ?? all[0]

  const ma = metricsFor(current)
  const mb = metricsFor(other)

  const rows: Row[] = [
    { label: 'Reality Score', a: ma.overall, b: mb.overall, fmt: (n) => `${n}/100`, higherBetter: true },
    { label: 'Median pay', a: ma.median, b: mb.median, fmt: usd, higherBetter: true },
    { label: 'Starting salary', a: ma.start, b: mb.start, fmt: usd, higherBetter: true },
    { label: '10-yr outlook', a: ma.outlook, b: mb.outlook, fmt: (n) => `${n > 0 ? '+' : ''}${n}%`, higherBetter: true },
    { label: 'AI resilience', a: ma.aiResilience, b: mb.aiResilience, fmt: (n) => `${n}/100`, higherBetter: true },
    { label: 'Likely debt', a: ma.debt, b: mb.debt, fmt: usd, higherBetter: false },
  ]

  const IconA = careerIcon(current.key, current.category, current.generated)
  const IconB = careerIcon(other.key, other.category, other.generated)
  const vA = verdictSignal(scoreFor(current, freshProgress()).verdict)

  const winner = (r: Row): 'a' | 'b' | 'tie' => {
    if (r.a === r.b) return 'tie'
    const aWins = r.higherBetter ? r.a > r.b : r.a < r.b
    return aWins ? 'a' : 'b'
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-console/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2 }}
            className="card relative w-full max-w-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Compare careers"
          >
            <button onClick={onClose} className="absolute right-4 top-4 z-10 text-ink-faint hover:text-ink" aria-label="Close">
              <X size={18} />
            </button>

            <div className="border-b border-line p-5">
              <h2 className="font-display text-lg font-bold text-ink">Compare two futures</h2>
              <p className="text-sm text-ink-soft">Side by side on the things that actually decide it.</p>
            </div>

            {/* Heads */}
            <div className="grid grid-cols-2 gap-px bg-line">
              <div className="bg-paper p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><IconA size={18} /></span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{current.title}</div>
                    <div className={`text-xs font-medium ${vA.text}`}>{vA.label}</div>
                  </div>
                </div>
              </div>
              <div className="bg-paper p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><IconB size={18} /></span>
                  <select
                    value={otherKey}
                    onChange={(e) => setOtherKey(e.target.value)}
                    className="min-w-0 flex-1 truncate rounded-lg border border-line bg-canvas px-2 py-1.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
                    aria-label="Choose a career to compare"
                  >
                    {all.filter((c) => c.key !== current.key).map((c) => (
                      <option key={c.key} value={c.key}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div className="max-h-[50vh] overflow-y-auto">
              {rows.map((r) => {
                const w = winner(r)
                return (
                  <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                    <div className={`text-right font-display text-lg font-semibold ${w === 'a' ? 'text-go' : 'text-ink-soft'}`}>{r.fmt(r.a)}</div>
                    <div className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-faint">{r.label}</div>
                    <div className={`font-display text-lg font-semibold ${w === 'b' ? 'text-go' : 'text-ink-soft'}`}>{r.fmt(r.b)}</div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-line bg-canvas/60 p-3 text-xs text-ink-faint">
              Green marks the stronger side <ArrowRight size={12} /> compare reflects each career's fundamentals
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
