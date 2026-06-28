import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Career } from '../data/types'
import { SECTIONS, useTrial, type CareerProgress, type SectionId } from '../state/trial'
import { simDone } from '../state/selectors'

function isComplete(id: SectionId, career: Career, p: CareerProgress): boolean {
  switch (id) {
    case 'sim':
      return simDone(career, p)
    case 'paths':
      return p.pathId != null
    case 'score':
      return p.interestRating > 0
    default:
      return false
  }
}

export function StepNav({ career }: { career: Career }) {
  const { progress, dispatch } = useTrial()

  return (
    <div className="sticky top-0 z-10 -mx-1 border-b border-line bg-canvas/85 px-1 py-2 backdrop-blur">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Trial steps">
        {SECTIONS.map((s) => {
          const active = progress.activeSection === s.id
          const done = isComplete(s.id, career, progress)
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              onClick={() => dispatch({ type: 'SECTION', id: s.id })}
              className={`relative flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'border-transparent text-white' : 'border-line bg-paper text-ink-soft hover:border-brand/40 hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="step-pill"
                  className="absolute inset-0 rounded-xl bg-brand"
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                />
              )}
              <span className="relative z-[1] flex items-center gap-2">
                <span className={`font-mono text-[11px] ${active ? 'text-white/70' : 'text-ink-faint'}`}>{s.code}</span>
                <span className="whitespace-nowrap">{s.short}</span>
                {done && <Check size={13} className={active ? 'text-white' : 'text-go'} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
