import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Send, X, Loader2, MessageCircle } from 'lucide-react'
import type { Career } from '../data/types'
import type { Turn } from '../ai/gemini'
import { coachReply, COACH_NAME } from '../ai/aiClient'

interface Msg {
  role: 'user' | 'model'
  text: string
}

const SUGGESTIONS = [
  'Is this career right for me?',
  'I have no idea what to do',
  'Compare two careers for me',
  'Will AI replace this job?',
]

export function CoachChat({ career }: { career: Career }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abort = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy, open])
  useEffect(() => () => abort.current?.abort(), [])

  async function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setError('')
    const next = [...msgs, { role: 'user' as const, text: t }]
    setMsgs(next)
    setBusy(true)
    abort.current?.abort()
    abort.current = new AbortController()
    try {
      const history: Turn[] = next.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))
      const reply = await coachReply(career, history, abort.current.signal)
      setMsgs([...next, { role: 'model', text: reply }])
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message || `${COACH_NAME} stepped away. Try again.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand py-3 pl-3 pr-4 text-sm font-semibold text-white shadow-[0_12px_32px_-8px_rgba(75,71,255,0.7)]"
            aria-label={`Ask ${COACH_NAME}, the career coach`}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15"><MessageCircle size={16} /></span>
            Ask {COACH_NAME}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="card fixed bottom-5 right-5 z-40 flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden"
            style={{ height: 'min(560px, calc(100vh - 3rem))' }}
            role="dialog"
            aria-label={`${COACH_NAME}, your career coach`}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-line bg-console px-4 py-3 text-white">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand"><Sparkles size={17} /></span>
              <div className="leading-tight">
                <div className="font-display text-sm font-bold">{COACH_NAME}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">your career coach</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/50 hover:text-white" aria-label="Close"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">
                  Hey — I’m {COACH_NAME}, your career coach. Ask me anything: <span className="text-ink-soft">“is nursing right for me?”, “data analyst vs software dev?”, “what if I’m bad at math but love building things?”</span>
                </div>
              </div>

              {msgs.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-brand/30 bg-brand-soft/50 px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:bg-brand-soft">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {msgs.map((m, i) => {
                const isUser = m.role === 'user'
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${isUser ? 'bg-brand text-white' : 'border border-line bg-paper text-ink'}`}>
                      {m.text}
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

            {/* Input */}
            <div className="flex items-end gap-2 border-t border-line p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder={`Ask ${COACH_NAME} about any career…`}
                className="max-h-24 flex-1 resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-[14px] text-ink focus:border-brand focus:outline-none"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
                aria-label="Send"
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
