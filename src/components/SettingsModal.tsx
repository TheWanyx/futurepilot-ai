import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, KeyRound, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import { getUserKey, setApiKey, usingBuiltInKey, getUserGroqKey, setGroqKey } from '../ai/aiClient'
import { GEMINI_MODEL } from '../ai/gemini'
import { GROQ_MODEL } from '../ai/groq'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string, kind?: 'error' | 'info' | 'success') => void
}

export function SettingsModal({ open, onClose, notify }: Props) {
  const [key, setKey] = useState('')
  const [groq, setGroq] = useState('')

  useEffect(() => {
    if (open) {
      setKey(getUserKey())
      setGroq(getUserGroqKey())
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const save = () => {
    setApiKey(key)
    setGroqKey(groq)
    notify(key.trim() || groq.trim() ? 'AI settings saved.' : 'Using the built-in free keys.', 'success')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-console/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="card relative w-full max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-label="AI settings"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-ink-faint hover:text-ink" aria-label="Close">
              <X size={18} />
            </button>

            <div className="mb-1 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <Sparkles size={18} />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">AI generation</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink-soft">
              {usingBuiltInKey()
                ? 'A free Gemini key is already built in — you can generate a full FuturePilot profile for any profession right now. Optionally use your own key below.'
                : 'Using your own Gemini key. Clear it to fall back to the built-in free key.'}
            </p>

            <label htmlFor="gemkey" className="eyebrow mt-5 block">Your Gemini API key (optional)</label>
            <input
              id="gemkey"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza…"
              className="mask-input mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
              name="rc-gemini-token"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
            />

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Get a free key at Google AI Studio <ExternalLink size={13} />
            </a>

            {/* Groq fallback */}
            <label htmlFor="groqkey" className="eyebrow mt-5 block">Groq API key — fallback (optional)</label>
            <input
              id="groqkey"
              type="text"
              value={groq}
              onChange={(e) => setGroq(e.target.value)}
              placeholder="gsk_…"
              className="mask-input mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
              name="rc-groq-token"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
            />
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Get a free key at Groq Console <ExternalLink size={13} />
            </a>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-canvas/70 p-3 text-xs leading-relaxed text-ink-soft">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-go" />
              Keys live only in your browser. Gemini (<span className="font-mono">{GEMINI_MODEL}</span>) runs everything; when it rate-limits, the app auto-falls back to Groq (<span className="font-mono">{GROQ_MODEL}</span>) so it keeps working.
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={save}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-strong"
              >
                <KeyRound size={16} /> Save
              </button>
              <button onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 font-medium text-ink-soft hover:border-brand/40">
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
