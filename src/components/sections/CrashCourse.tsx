import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Circle, BookOpen, Sparkles, Loader2, Lightbulb, Rocket } from 'lucide-react'
import type { Career } from '../../data/types'
import { SectionIntro } from '../ui'
import { explainSkill, type SkillLesson } from '../../ai/aiClient'

export function CrashCourse({ career }: { career: Career }) {
  const [done, setDone] = useState<Set<number>>(new Set())
  const [open, setOpen] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Record<number, SkillLesson>>({})
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<Record<number, string>>({})

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  async function teach(i: number, skill: string) {
    if (open === i) {
      setOpen(null)
      return
    }
    setOpen(i)
    if (lessons[i] || loading === i) return
    setLoading(i)
    setError((e) => ({ ...e, [i]: '' }))
    try {
      const lesson = await explainSkill(career, skill)
      setLessons((l) => ({ ...l, [i]: lesson }))
    } catch (err) {
      setError((e) => ({ ...e, [i]: (err as Error).message || 'Could not load that lesson. Try again.' }))
    } finally {
      setLoading(null)
    }
  }

  const pct = Math.round((done.size / career.crashCourse.length) * 100)

  return (
    <div>
      <SectionIntro code="02" title="Your 5-minute crash course" blurb="The first things you'd actually learn — and you don't have to take my word for it. Tap “Teach me” on any line and an AI tutor explains it on the spot, with a real taste you can try." />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <BookOpen size={16} className="text-brand" />
            Starter syllabus
          </div>
          <div className="eyebrow">{done.size}/{career.crashCourse.length} · {pct}%</div>
        </div>
        <ol className="divide-y divide-line">
          {career.crashCourse.map((step, i) => {
            const checked = done.has(i)
            const lesson = lessons[i]
            return (
              <li key={i}>
                <div className="flex items-start gap-3 px-5 py-4">
                  <button type="button" onClick={() => toggle(i)} className="mt-0.5 shrink-0" aria-label="Mark done">
                    {checked ? <Check size={20} className="text-go" /> : <Circle size={20} className="text-line-strong" />}
                  </button>
                  <button type="button" onClick={() => toggle(i)} className="flex flex-1 items-baseline gap-2 text-left">
                    <span className="font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`text-[15px] leading-relaxed ${checked ? 'text-ink-faint line-through' : 'text-ink-soft'}`}>{step}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => teach(i, step)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      open === i ? 'border-brand bg-brand text-white' : 'border-brand/30 bg-brand-soft/50 text-brand-ink hover:bg-brand-soft'
                    }`}
                  >
                    {loading === i ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Teach me
                  </button>
                </div>

                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-5 mb-4 rounded-2xl border border-brand/20 bg-brand-soft/25 p-4">
                        {loading === i && (
                          <div className="flex items-center gap-2 text-sm text-ink-soft">
                            <Loader2 size={15} className="animate-spin text-brand" /> Your AI tutor is writing a quick lesson…
                          </div>
                        )}
                        {error[i] && <p className="text-sm text-risk">{error[i]}</p>}
                        {lesson && (
                          <div className="space-y-3">
                            <p className="text-[15px] leading-relaxed text-ink">{lesson.what}</p>
                            <div className="flex items-start gap-2 text-sm text-ink-soft">
                              <Lightbulb size={15} className="mt-0.5 shrink-0 text-caution" />
                              <span><span className="font-semibold text-ink">Why it matters:</span> {lesson.why}</span>
                            </div>
                            <div>
                              <div className="eyebrow mb-1">Try reading this</div>
                              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-console p-3 font-mono text-[13px] leading-relaxed text-white/90">{lesson.example}</pre>
                            </div>
                            <div className="flex items-start gap-2 rounded-xl border border-go/30 bg-go-soft/40 p-3 text-sm text-ink-soft">
                              <Rocket size={15} className="mt-0.5 shrink-0 text-go" />
                              <span><span className="font-semibold text-ink">First 10 minutes:</span> {lesson.firstAction}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
