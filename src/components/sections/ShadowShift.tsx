import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Sparkles, RotateCcw, Loader2, Trophy, Check, AlertTriangle, Play } from 'lucide-react'
import type { Career } from '../../data/types'
import type { Turn } from '../../ai/gemini'
import { runShadowChat, assessShadow, SHIFT_END_MARKER, type ShadowAssessment } from '../../ai/aiClient'
import { useTrial } from '../../state/trial'
import { SectionIntro } from '../ui'

const SEED: Turn = {
  role: 'user',
  parts: [{ text: "I'm shadowing you for one real shift. Drop me straight into a specific situation from your day and ask what I'd do." }],
}

interface Msg {
  role: 'user' | 'model'
  text: string
}

export function ShadowShift({ career }: { career: Career }) {
  const { dispatch } = useTrial()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [assessment, setAssessment] = useState<ShadowAssessment | null>(null)
  const [error, setError] = useState('')
  const abort = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])

  useEffect(() => () => abort.current?.abort(), [])

  const toTurns = (list: Msg[]): Turn[] => [SEED, ...list.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))]

  async function exchange(nextMsgs: Msg[]) {
    setBusy(true)
    setError('')
    abort.current?.abort()
    abort.current = new AbortController()
    try {
      const reply = await runShadowChat(career, toTurns(nextMsgs), abort.current.signal)
      const withReply = [...nextMsgs, { role: 'model' as const, text: reply }]
      setMsgs(withReply)
      if (reply.includes(SHIFT_END_MARKER)) {
        setEnded(true)
        grade(withReply)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message || 'The mentor stepped away. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function grade(transcript: Msg[]) {
    try {
      const text = transcript.map((m) => `${m.role === 'user' ? 'STUDENT' : 'MENTOR'}: ${m.text}`).join('\n\n')
      const a = await assessShadow(career, text)
      setAssessment(a)
      dispatch({ type: 'SHADOW_RESULT', score: a.score, caught: a.caught })
    } catch {
      /* assessment is a bonus; the shift still happened */
    }
  }

  const start = () => {
    setStarted(true)
    setMsgs([])
    setEnded(false)
    setAssessment(null)
    exchange([])
  }

  const send = () => {
    const t = input.trim()
    if (!t || busy || ended) return
    setInput('')
    exchange([...msgs, { role: 'user', text: t }])
  }

  const replay = () => {
    setStarted(false)
    setMsgs([])
    setEnded(false)
    setAssessment(null)
    setError('')
  }

  if (!started) {
    return (
      <div>
        <SectionIntro code="03" title="Shadow a real shift — live" blurb="Step into the job for a day. An AI mentor drops you into a real situation, reacts to what you actually say, and pushes you the way a senior would. Type like you'd really answer." />
        <div className="rounded-3xl border border-console-line bg-console p-8 text-center text-white">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand"><Bot size={26} /></span>
          <h3 className="font-display text-xl font-bold">Clock in as a {career.title}</h3>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/70">
            No multiple choice — a live back-and-forth. Handle whatever the day throws at you, and watch for the moment the easy answer is quietly wrong.
          </p>
          <button
            type="button"
            onClick={start}
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            <Play size={18} className="fill-white" /> Start the shift
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionIntro code="03" title="Shadow a real shift — live" blurb="You're on the clock. Answer like you mean it." />

      <div className="card flex h-[clamp(420px,60vh,640px)] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white"><Bot size={15} /></span>
          <span className="text-sm font-semibold text-ink">Senior {career.title}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-ink"><Sparkles size={11} /> Live AI</span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => {
            const isUser = m.role === 'user'
            const text = m.text.split(SHIFT_END_MARKER)
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${isUser ? 'bg-brand text-white' : 'border border-line bg-paper text-ink'}`}>
                  {text[0].trim()}
                  {text[1] !== undefined && (
                    <div className="mt-2 border-t border-line/60 pt-2 text-sm text-ink-soft">
                      <span className="eyebrow block">Shift debrief</span>
                      {text[1].trim()}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-line bg-paper px-4 py-3">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint" />
                </span>
              </div>
            </div>
          )}
          {error && <div className="rounded-xl border border-risk/30 bg-risk-soft/50 px-3 py-2 text-sm text-risk">{error}</div>}
          <div ref={scrollRef} />
        </div>

        {!ended && (
          <div className="flex items-end gap-2 border-t border-line p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="What do you do?"
              className="max-h-28 flex-1 resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-[15px] text-ink focus:border-brand focus:outline-none"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <button
              type="button"
              onClick={send}
              disabled={busy || !input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
              aria-label="Send"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Assessment */}
      {ended && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          {assessment ? (
            <div className="rounded-2xl border border-brand/25 bg-brand-soft/30 p-5">
              <div className="flex items-center gap-4">
                <Trophy size={26} className="text-brand" />
                <div>
                  <div className="font-display text-3xl font-bold text-ink">{assessment.score}<span className="text-lg text-ink-faint">/100</span></div>
                  <div className="eyebrow">Shift judgment</div>
                </div>
                <div className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${assessment.caught ? 'bg-go-soft text-go' : 'bg-caution-soft text-caution'}`}>
                  {assessment.caught ? <Check size={15} /> : <AlertTriangle size={15} />}
                  {assessment.caught ? 'Caught the trap' : 'Missed the trap'}
                </div>
              </div>
              <p className="mt-3 text-[15px] font-medium text-ink">{assessment.headline}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="eyebrow text-go">Strengths</div>
                  <ul className="mt-1 space-y-1">
                    {assessment.strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm text-ink-soft"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-go" />{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow text-caution">To work on</div>
                  <ul className="mt-1 space-y-1">
                    {assessment.gaps.map((s, i) => <li key={i} className="flex gap-2 text-sm text-ink-soft"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caution" />{s}</li>)}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-faint">This shift fed your Reality Score.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper p-4 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin text-brand" /> Grading your shift…
            </div>
          )}
          <button type="button" onClick={replay} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand/40">
            <RotateCcw size={16} /> New shift
          </button>
        </motion.div>
      )}
    </div>
  )
}
