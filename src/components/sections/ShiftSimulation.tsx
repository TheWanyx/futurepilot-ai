import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Check, ArrowRight, RotateCcw, Clock, Zap, Trophy, UserCheck } from 'lucide-react'
import type { Career, ShiftBeat, ShiftOption } from '../../data/types'
import { SectionIntro } from '../ui'
import { useTrial } from '../../state/trial'
import { shiftFor, shiftStats } from '../../state/selectors'

function qualityMeta(q: number): { hex: string; label: string; soft: string } {
  if (q >= 1) return { hex: '#16b981', label: 'Strong call', soft: 'bg-go-soft/60 border-go/40' }
  if (q >= 0.5) return { hex: '#f59e0b', label: 'Defensible — but it costs you', soft: 'bg-caution-soft/60 border-caution/40' }
  return { hex: '#f0526a', label: 'That one bites back', soft: 'bg-risk-soft/60 border-risk/40' }
}

function OptionButton({
  option,
  letter,
  answered,
  chosen,
  isBest,
  onSelect,
}: {
  option: ShiftOption
  letter: string
  answered: boolean
  chosen: boolean
  isBest: boolean
  onSelect: () => void
}) {
  const meta = qualityMeta(option.quality)
  const base = 'w-full rounded-2xl border p-4 text-left transition-all'
  let cls = 'border-line bg-paper hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand-soft/30 cursor-pointer'
  if (answered) {
    cls = chosen ? `${meta.soft}` : 'border-line bg-paper opacity-60'
  }
  return (
    <button type="button" onClick={onSelect} disabled={answered} className={`${base} ${cls} ${answered ? 'cursor-default' : ''}`}>
      <div className="flex items-start gap-3">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-sm font-semibold"
          style={
            chosen && answered
              ? { background: meta.hex, color: '#fff' }
              : { background: 'var(--color-canvas)', color: 'var(--color-ink-soft)' }
          }
        >
          {chosen && answered ? <Check size={16} /> : letter}
        </span>
        <span className="flex-1 text-[15px] leading-relaxed text-ink">{option.text}</span>
        {answered && isBest && (
          <span className="shrink-0 rounded-full bg-go px-2 py-0.5 text-[11px] font-semibold text-white">Best</span>
        )}
      </div>
    </button>
  )
}

function BeatView({ beat, index }: { beat: ShiftBeat; index: number }) {
  const { progress, dispatch } = useTrial()
  const chosen = progress.shiftChoices[index]
  const answered = chosen != null
  const bestIdx = beat.options.findIndex((o) => o.quality === 1)
  const isTrap = beat.kind === 'ai-trap'
  const chosenOpt = chosen != null ? beat.options[chosen] : null
  const meta = chosenOpt ? qualityMeta(chosenOpt.quality) : null

  return (
    <div>
      {/* Beat header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-console px-2.5 py-1 font-mono text-[11px] font-medium text-white">
          <Clock size={12} /> {beat.clock}
        </span>
        <h3 className="font-display text-lg font-semibold text-ink">{beat.title}</h3>
      </div>

      <div className="card p-5">
        <p className="text-[15px] leading-relaxed text-ink-soft">{beat.situation}</p>

        {isTrap && (
          <div className="mt-4 rounded-2xl border border-brand/25 bg-brand-soft/40 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white"><Bot size={15} /></span>
              <span className="text-sm font-semibold text-brand-ink">AI coworker suggests</span>
            </div>
            <p className="text-[15px] leading-relaxed text-ink">{beat.aiSuggestion}</p>
          </div>
        )}

        <p className="mt-4 font-display text-base font-semibold text-ink">{beat.decision}</p>
      </div>

      <div className="mt-3 space-y-3">
        {beat.options.map((o, i) => (
          <OptionButton
            key={i}
            option={o}
            letter={String.fromCharCode(65 + i)}
            answered={answered}
            chosen={chosen === i}
            isBest={i === bestIdx}
            onSelect={() => !answered && dispatch({ type: 'SHIFT_CHOICE', beat: index, option: i })}
          />
        ))}
      </div>

      {/* Consequence reveal */}
      <AnimatePresence>
        {answered && chosenOpt && meta && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <div className={`rounded-2xl border p-4 ${meta.soft}`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.hex }}>
                  {isTrap && chosenOpt.quality >= 1 ? 'You caught it' : isTrap && chosenOpt.quality < 1 ? 'The AI fooled you' : meta.label}
                </span>
                <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft">{chosenOpt.tag}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-soft">{chosenOpt.consequence}</p>
            </div>

            {chosen !== bestIdx && (
              <div className="flex items-start gap-2 rounded-2xl border border-go/30 bg-go-soft/40 p-4">
                <UserCheck size={16} className="mt-0.5 shrink-0 text-go" />
                <p className="text-sm leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">The strong call:</span> {beat.options[bestIdx].text}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ShiftSimulation({ career }: { career: Career }) {
  const { progress, dispatch } = useTrial()
  const shift = shiftFor(career)
  const beats = shift.beats
  const stats = shiftStats(career, progress)

  const firstUnanswered = beats.findIndex((_, i) => progress.shiftChoices[i] == null)
  const [viewIndex, setViewIndex] = useState(firstUnanswered === -1 ? beats.length : firstUnanswered)
  const atSummary = viewIndex >= beats.length
  const currentAnswered = !atSummary && progress.shiftChoices[viewIndex] != null
  const liveScore = Math.round(stats.avgQuality * 100)

  const replay = () => {
    dispatch({ type: 'RESET_SHIFT' })
    setViewIndex(0)
  }

  return (
    <div>
      <SectionIntro code="03" title="Play a real shift" blurb="Not a quiz — a day on the job. Four connected calls, real consequences, and one moment where the AI coworker is confidently wrong. See if you catch it." />

      {/* HUD */}
      <div className="mb-4 rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {beats.map((b, i) => {
              const done = progress.shiftChoices[i] != null
              const active = !atSummary && i === viewIndex
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-semibold transition-colors ${
                      done ? 'bg-go text-white' : active ? 'bg-brand text-white' : 'bg-canvas text-ink-faint'
                    }`}
                    title={b.clock}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  {i < beats.length - 1 && <div className={`h-0.5 w-5 rounded ${progress.shiftChoices[i] != null ? 'bg-go' : 'bg-line'}`} />}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Zap size={15} className="text-brand" />
            <span className="font-mono text-ink-faint">shift</span>
            <span className="font-display text-lg font-bold text-ink">{liveScore}</span>
          </div>
        </div>
      </div>

      {/* Intro line */}
      {!atSummary && viewIndex === firstUnanswered && firstUnanswered === 0 && progress.shiftChoices[0] == null && (
        <div className="mb-4 rounded-2xl border border-console-line bg-console p-4 text-[15px] italic leading-relaxed text-white/85">
          {shift.intro}
        </div>
      )}

      <AnimatePresence mode="wait">
        {atSummary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl border border-brand/25 bg-brand-soft/30 p-6 text-center">
              <Trophy size={28} className="mx-auto text-brand" />
              <div className="mt-2 font-display text-4xl font-bold text-ink">{liveScore}<span className="text-xl text-ink-faint">/100</span></div>
              <div className="eyebrow mt-1">Shift performance</div>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">{shift.closer}</p>
              <div className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${stats.caughtAiMistake ? 'bg-go-soft text-go' : 'bg-caution-soft text-caution'}`}>
                <Bot size={15} /> {stats.caughtAiMistake ? 'You caught the AI coworker’s mistake' : 'The AI coworker’s mistake slipped past you'}
              </div>
            </div>

            {/* recap */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {beats.map((b, i) => {
                const ch = progress.shiftChoices[i]
                const m = ch != null ? qualityMeta(b.options[ch].quality) : null
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3">
                    <span className="font-mono text-[11px] text-ink-faint">{b.clock}</span>
                    <span className="flex-1 truncate text-sm font-medium text-ink">{b.title}</span>
                    {m && <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.hex }} />}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={replay}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand/40"
            >
              <RotateCcw size={16} /> Replay the shift
            </button>
          </motion.div>
        ) : (
          <motion.div key={viewIndex} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
            <BeatView beat={beats[viewIndex]} index={viewIndex} />

            {currentAnswered && (
              <div className="mt-5 flex justify-end">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  type="button"
                  onClick={() => setViewIndex(viewIndex + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-strong"
                >
                  {viewIndex === beats.length - 1 ? 'See how the shift went' : 'Next call'} <ArrowRight size={18} />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
