import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Rocket, Map, Sparkles, Loader2, Flag, BookOpen } from 'lucide-react'
import type { Career } from '../../data/types'
import { SectionIntro } from '../ui'
import { useTrial } from '../../state/trial'
import { activePath } from '../../state/selectors'
import { regionById } from '../../lib/regions'
import { generateRoadmap, type Roadmap } from '../../ai/aiClient'

function RoadmapPanel({ career }: { career: Career }) {
  const { progress } = useTrial()
  const pathLabel = activePath(career, progress).label
  const regionLabel = regionById(progress.regionId).label
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setBusy(true)
    setError('')
    try {
      setRoadmap(await generateRoadmap(career, pathLabel, regionLabel))
    } catch (e) {
      setError((e as Error).message || 'Could not build the roadmap. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-brand/25 bg-brand-soft/30 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><Map size={20} /></span>
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-ink">Personalized AI roadmap</h3>
            <p className="text-sm text-ink-soft">Zero → working {career.title}, via {pathLabel.toLowerCase()}. Real courses, books, and projects.</p>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {busy ? 'Building…' : roadmap ? 'Regenerate' : 'Generate my roadmap'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-risk">{error}</p>}
      </div>

      {roadmap && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <p className="mb-4 text-[15px] leading-relaxed text-ink-soft">{roadmap.summary}</p>
          <div className="relative space-y-3">
            <div className="absolute bottom-3 left-[15px] top-3 w-px bg-line" aria-hidden />
            {roadmap.phases.map((p, i) => (
              <div key={i} className="relative flex gap-4">
                <span className="relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-brand bg-paper font-mono text-xs font-bold text-brand">{i + 1}</span>
                <div className="flex-1 rounded-2xl border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="eyebrow text-brand">{p.timeframe}</span>
                    <h4 className="font-display text-base font-semibold text-ink">{p.title}</h4>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{p.focus}</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {p.actions.map((a, j) => (
                      <li key={j} className="flex gap-2 text-sm text-ink-soft"><Check size={15} className="mt-0.5 shrink-0 text-go" />{a}</li>
                    ))}
                  </ul>
                  {p.resources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.resources.map((r, j) => (
                        <span key={j} className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
                          <BookOpen size={11} /> {r.name} <span className="text-ink-faint">· {r.type}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-go-soft/60 px-2.5 py-1 text-xs font-medium text-go">
                    <Flag size={12} /> {p.milestone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function ActionPlan({ career }: { career: Career }) {
  const [done, setDone] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <div>
      <SectionIntro code="07" title="Your next 30 days — and beyond" blurb="Exactly what to do this month, plus an AI-built roadmap all the way to the job." />

      <div className="relative">
        <div className="absolute bottom-2 left-[19px] top-2 w-px bg-line" aria-hidden />
        <ol className="space-y-3">
          {career.thirtyDayPlan.map((step, i) => {
            const checked = done.has(i)
            return (
              <li key={i} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-start gap-4 rounded-2xl border border-line bg-paper p-4 text-left transition-colors hover:border-brand/40"
                >
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 bg-paper transition-colors"
                    style={{ borderColor: checked ? 'var(--color-go)' : 'var(--color-line-strong)' }}>
                    {checked ? <Check size={18} className="text-go" /> : <span className="font-mono text-sm font-semibold text-ink-soft">{i + 1}</span>}
                  </span>
                  <span>
                    <span className={`block font-display text-base font-semibold ${checked ? 'text-ink-faint line-through' : 'text-ink'}`}>
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-[15px] leading-relaxed text-ink-soft">{step.detail}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand/25 bg-brand-soft/40 p-4 text-sm text-brand-ink">
        <Rocket size={16} />
        Finish the mini project and you'll know more about this career than most people who major in it.
      </div>

      <RoadmapPanel career={career} />
    </div>
  )
}
