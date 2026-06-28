import { useState } from 'react'
import { Download, GitCompareArrows, Sparkles, Info, Loader2 } from 'lucide-react'
import type { Career } from '../../data/types'
import { SectionIntro, Stars } from '../ui'
import { ScoreRing } from '../ScoreRing'
import { useTrial } from '../../state/trial'
import { scoreFor, lifeMathFor, shiftStats } from '../../state/selectors'
import { DIMENSION_META } from '../../lib/score'
import { verdictSignal, scoreSignal } from '../../lib/signal'
import type { ToastKind } from '../Toast'

export function RealityScore({
  career,
  onCompare,
  notify,
}: {
  career: Career
  onCompare: () => void
  notify: (msg: string, kind?: ToastKind) => void
}) {
  const { progress, dispatch } = useTrial()
  const [building, setBuilding] = useState(false)

  // jsPDF is heavy — load it only when a report is actually requested.
  const downloadReport = async () => {
    setBuilding(true)
    try {
      const { generateReport } = await import('../../lib/report')
      generateReport(career, progress)
    } catch {
      notify('Could not build the PDF just now. Try again.', 'error')
    } finally {
      setBuilding(false)
    }
  }

  const score = scoreFor(career, progress)
  const lm = lifeMathFor(career, progress)
  const vsig = verdictSignal(score.verdict)
  const caught = progress.shadowScore != null ? !!progress.shadowCaught : shiftStats(career, progress).caughtAiMistake

  return (
    <div>
      <SectionIntro code="08" title="Your Reality Score" blurb="Everything from this trial — the work you did, the money math, and your own interest — rolled into one honest verdict." />

      {/* Interest rating */}
      <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-sm font-semibold text-ink">How much did this actually interest you?</div>
          <div className="text-sm text-ink-soft">{progress.interestRating ? 'Tap to adjust — it reshapes your score.' : 'Rate it to sharpen your verdict.'}</div>
        </div>
        <Stars value={progress.interestRating} onChange={(n) => dispatch({ type: 'INTEREST', value: n })} />
      </div>

      {/* Verdict */}
      <div className={`rounded-2xl border ${vsig.border} ${vsig.bg} p-5 sm:p-6`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={score.overall} signal={vsig} size={176} />
          <div className="flex-1 text-center sm:text-left">
            <div className={`eyebrow ${vsig.text}`}>Verdict · {vsig.label}</div>
            <h3 className="mt-1 font-display text-2xl font-bold text-ink">{score.verdictLabel}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{score.verdictReason}</p>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="card mt-4 p-5">
        <h3 className="mb-4 text-base font-semibold text-ink">The five dimensions</h3>
        <div className="space-y-3.5">
          {DIMENSION_META.map((dim) => {
            const val = score.dims[dim.key]
            const sig = scoreSignal(val)
            return (
              <div key={dim.key}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-ink">{dim.label}</span>
                  <span className="font-mono text-sm font-semibold" style={{ color: sig.hex }}>{val}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full" style={{ width: `${val}%`, background: sig.hex }} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">{dim.help}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Basis */}
      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-line bg-canvas/60 p-4 text-sm text-ink-soft">
        <Info size={16} className="mt-0.5 shrink-0 text-ink-faint" />
        <span>
          Based on: your work-sim decisions, {caught ? 'catching' : 'missing'} the AI coworker's mistake, your interest rating,
          and a debt-to-income of {Math.round(lm.debtToIncome * 100)}% on your chosen path.
        </span>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={downloadReport}
          disabled={building}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-card transition-transform hover:bg-brand-strong active:scale-[0.98] disabled:opacity-70"
        >
          {building ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {building ? 'Building report…' : 'Download career report'}
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-5 py-3 font-semibold text-ink transition-colors hover:border-brand/40"
        >
          <GitCompareArrows size={18} /> Compare careers
        </button>
      </div>

      {career.generated && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand/25 bg-brand-soft/40 p-4 text-sm text-brand-ink">
          <Sparkles size={16} /> This profile was generated by AI. Treat the figures as well-reasoned estimates, not audited data.
        </div>
      )}
    </div>
  )
}
