import { Bot, Brain, Gauge } from 'lucide-react'
import type { Career } from '../../data/types'
import { SectionIntro } from '../ui'
import { ProgressBar } from '../ui'
import { aiRiskSignal } from '../../lib/signal'

export function AiImpact({ career }: { career: Career }) {
  const ai = career.aiImpact
  const sig = aiRiskSignal(ai.riskLevel)

  return (
    <div>
      <SectionIntro code="04" title="Will AI take this job?" blurb="The honest split: what AI already does for you, where humans still hold the value, and how exposed this role is over the next decade." />

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge size={18} className={sig.text} />
            <h3 className="text-base font-semibold text-ink">AI exposure</h3>
          </div>
          <div className="text-right">
            <span className="font-display text-3xl font-bold" style={{ color: sig.hex }}>
              {ai.riskLevel}
            </span>
            <span className="font-mono text-sm text-ink-faint">/100</span>
            <div className={`text-sm font-medium ${sig.text}`}>{sig.label}</div>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={ai.riskLevel} signal={sig} height={10} />
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-faint">
            <span>safer</span>
            <span>more automatable</span>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{ai.riskNote}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-risk/25 bg-risk-soft/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bot size={18} className="text-risk" />
            <h3 className="text-base font-semibold text-ink">AI already does this</h3>
          </div>
          <ul className="space-y-2.5">
            {ai.automates.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-risk/60" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-go/25 bg-go-soft/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Brain size={18} className="text-go" />
            <h3 className="text-base font-semibold text-ink">Where you still win</h3>
          </div>
          <ul className="space-y-2.5">
            {ai.humanValue.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-go/60" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
