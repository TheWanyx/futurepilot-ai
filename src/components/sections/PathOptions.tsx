import { Check, Clock3, GraduationCap, Coins } from 'lucide-react'
import type { Career, PathOption } from '../../data/types'
import { SectionIntro } from '../ui'
import { useTrial } from '../../state/trial'
import { buildPathOptions } from '../../lib/paths'
import { usd } from '../../lib/format'
import { bandSignal } from '../../lib/signal'

const speedLabel: Record<PathOption['payoffSpeed'], string> = {
  slow: 'Slow payoff',
  medium: 'Medium payoff',
  fast: 'Fast payoff',
}

function PathCard({ path, active, onSelect }: { path: PathOption; active: boolean; onSelect: () => void }) {
  const band = bandSignal(path.debtRisk)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 ${
        active ? 'border-brand bg-brand-soft/40 shadow-[0_0_0_1px_var(--color-brand)]' : 'border-line bg-paper hover:border-brand/40 hover:shadow-pop'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-brand" />
          <h3 className="font-display text-base font-semibold text-ink">{path.label}</h3>
        </div>
        {active && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
            <Check size={12} /> Active
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{path.summary}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
          <Clock3 size={13} /> {path.durationLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
          <Coins size={13} /> {usd(path.totalCostUSD)}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${band.border} ${band.bg} ${band.text}`}>
          {band.label}
        </span>
        <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
          {speedLabel[path.payoffSpeed]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ul className="space-y-1.5">
          {path.pros.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-go" /> {p}
            </li>
          ))}
        </ul>
        <ul className="space-y-1.5">
          {path.cons.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-risk" /> {c}
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}

export function PathOptions({ career }: { career: Career }) {
  const { progress, dispatch } = useTrial()
  const paths = buildPathOptions(career)
  const activeId = progress.pathId ?? paths[0].id

  return (
    <div>
      <SectionIntro code="06" title="More than one way in" blurb="A degree isn't the only route. Pick the path that fits your money and timeline — it feeds straight into your Life Math and score." />
      <div className="grid gap-4 lg:grid-cols-2">
        {paths.map((p) => (
          <PathCard key={p.id} path={p} active={p.id === activeId} onSelect={() => dispatch({ type: 'PATH', id: p.id })} />
        ))}
      </div>
    </div>
  )
}
