import { ExternalLink, TrendingUp } from 'lucide-react'
import type { Career } from '../../data/types'
import { SectionIntro, StatTile } from '../ui'
import { MiniChart } from '../MiniChart'
import { useTrial } from '../../state/trial'
import { REGIONS } from '../../lib/regions'
import { buildPathOptions } from '../../lib/paths'
import { lifeMathFor } from '../../state/selectors'
import { usd } from '../../lib/format'
import { bandSignal } from '../../lib/signal'

export function LifeMath({ career }: { career: Career }) {
  const { progress, dispatch } = useTrial()
  const paths = buildPathOptions(career)
  const activePathId = progress.pathId ?? paths[0].id
  const lm = lifeMathFor(career, progress)
  const band = bandSignal(lm.riskBand)

  return (
    <div>
      <SectionIntro code="05" title="The money, honestly" blurb="Real tuition, a real starting wage, and what your choices do to debt. Move the controls — watch the payoff curve shift." />

      {/* Controls */}
      <div className="card p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="eyebrow">Path</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {paths.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => dispatch({ type: 'PATH', id: p.id })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    p.id === activePathId ? 'border-brand bg-brand text-white' : 'border-line bg-paper text-ink-soft hover:border-brand/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="eyebrow">Where you’ll live & work</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => dispatch({ type: 'REGION', id: r.id })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    r.id === progress.regionId ? 'border-brand bg-brand text-white' : 'border-line bg-paper text-ink-soft hover:border-brand/40'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="eyebrow" htmlFor="parttime">Part-time work while studying</label>
              <span className="font-mono text-sm font-medium text-ink">{progress.partTimeHours} hrs/wk</span>
            </div>
            <input
              id="parttime"
              type="range"
              min={0}
              max={30}
              step={5}
              value={progress.partTimeHours}
              onChange={(e) => dispatch({ type: 'PARTTIME', hours: Number(e.target.value) })}
              className="mt-3 w-full accent-[var(--color-brand)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="eyebrow" htmlFor="aid">Scholarships / grants / family help</label>
              <span className="font-mono text-sm font-medium text-ink">{Math.round(progress.aidFraction * 100)}%</span>
            </div>
            <input
              id="aid"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={progress.aidFraction}
              onChange={(e) => dispatch({ type: 'AID', fraction: Number(e.target.value) })}
              className="mt-3 w-full accent-[var(--color-brand)]"
            />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className={`mt-4 rounded-2xl border ${band.border} ${band.bg} p-5`}>
        <p className="text-[15px] font-medium leading-relaxed text-ink">{lm.headline}</p>
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Education cost" value={usd(lm.educationCostUSD)} sub="tuition over the program" />
        <StatTile label="Likely debt" value={usd(lm.estimatedDebtUSD)} sub="after aid + part-time work" accent={band.hex} />
        <StatTile label="Starting salary" value={usd(lm.startingSalaryUSD)} sub={`median ${usd(lm.medianSalaryUSD)}`} />
        <StatTile label="Break-even" value={`${lm.breakEvenYears} yrs`} sub="incl. years in school" />
      </div>

      {/* Chart */}
      <div className="card mt-4 p-5">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-brand" />
          <h3 className="text-base font-semibold text-ink">Cash position after graduation</h3>
        </div>
        <p className="mb-2 text-sm text-ink-soft">
          Debt-to-income at start: <span className="font-semibold text-ink">{Math.round(lm.debtToIncome * 100)}%</span>
          {lm.monthlyLoanPaymentUSD > 0 && <> · loan ≈ <span className="font-semibold text-ink">{usd(lm.monthlyLoanPaymentUSD)}/mo</span></>}
        </p>
        <MiniChart series={lm.series} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-faint">
        <span>Salary figures: BLS median, region-adjusted.</span>
        <a href={career.blsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
          Source <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}
