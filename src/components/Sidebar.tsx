import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Loader2, KeyRound, Compass } from 'lucide-react'
import { BrandMark } from './ui'
import { careersByCategory } from '../data/careers'
import { careerIcon } from '../lib/icons'
import { usd } from '../lib/format'
import { useTrial } from '../state/trial'
import { generateCareerProfile, isAiConfigured } from '../ai/aiClient'
import type { Career } from '../data/types'

interface Props {
  onSelect?: () => void
  onOpenSettings: () => void
  onFindFit: () => void
  notify: (msg: string, kind?: 'error' | 'info' | 'success') => void
}

export function Sidebar({ onSelect, onOpenSettings, onFindFit, notify }: Props) {
  const { state, dispatch } = useTrial()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const groups = useMemo(() => careersByCategory(), [])
  const q = query.trim().toLowerCase()

  const select = (key: string) => {
    dispatch({ type: 'SELECT', key })
    onSelect?.()
  }

  const matches = (title: string) => !q || title.toLowerCase().includes(q)
  const anyMatch =
    state.generated.some((c) => matches(c.title)) || groups.some((g) => g.items.some((c) => matches(c.title)))

  async function handleGenerate() {
    if (!isAiConfigured()) {
      notify('Add a free Gemini key in Settings to generate any career.', 'info')
      onOpenSettings()
      return
    }
    setLoading(true)
    try {
      const career: Career = await generateCareerProfile(query.trim())
      dispatch({ type: 'ADD_GENERATED', career })
      setQuery('')
      onSelect?.()
      notify(`Generated a full FuturePilot profile for ${career.title}.`, 'success')
    } catch (err) {
      const msg = err instanceof Error && err.message !== 'no-key' ? err.message : 'Could not generate that career. Try again.'
      notify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const Item = ({ c }: { c: Career }) => {
    const Icon = careerIcon(c.key, c.category, c.generated)
    const active = state.selectedKey === c.key
    return (
      <button
        type="button"
        onClick={() => select(c.key)}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
          active ? 'bg-console-soft text-white' : 'text-white/70 hover:translate-x-0.5 hover:bg-white/5 hover:text-white'
        }`}
      >
        {active && (
          <motion.span
            layoutId="side-active"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand"
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        )}
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${active ? 'bg-brand text-white' : 'bg-white/5 text-white/70 group-hover:text-white'}`}>
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{c.title}</span>
          <span className="block font-mono text-[11px] text-white/40">{usd(c.medianPayUSD)}/yr</span>
        </span>
        {c.generated && <Sparkles size={13} className="shrink-0 text-brand" />}
      </button>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <BrandMark size={38} />
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold tracking-tight text-white">FuturePilot<span className="text-brand"> AI</span></div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">test-drive your future</div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-console-line bg-console-soft px-3 py-2">
          <Search size={15} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any career…"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            aria-label="Search careers"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
          />
        </div>
        <button
          type="button"
          onClick={onFindFit}
          className="mt-2 flex w-full items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/20"
        >
          <Compass size={15} className="text-brand" /> Not sure? Find your fit
        </button>
      </div>

      {/* List */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {state.generated.filter((c) => matches(c.title)).length > 0 && (
          <div>
            <div className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-brand/80">AI-generated</div>
            <div className="space-y-0.5">
              {state.generated.filter((c) => matches(c.title)).map((c) => (
                <Item key={c.key} c={c} />
              ))}
            </div>
          </div>
        )}

        {groups.map((g) => {
          const items = g.items.filter((c) => matches(c.title))
          if (!items.length) return null
          return (
            <div key={g.category}>
              <div className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/35">{g.category}</div>
              <div className="space-y-0.5">
                {items.map((c) => (
                  <Item key={c.key} c={c} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Generate with AI */}
        {q.length >= 3 && !anyMatch && (
          <div className="px-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex w-full items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-3 py-3 text-left text-sm text-white transition-colors hover:bg-brand/20 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-brand" /> : <Sparkles size={16} className="text-brand" />}
              <span>
                {loading ? 'Generating…' : <>Generate <span className="font-semibold">“{query.trim()}”</span> with AI</>}
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex items-center gap-2 border-t border-console-line px-5 py-3.5 text-sm text-white/55 transition-colors hover:text-white"
      >
        <KeyRound size={15} />
        {isAiConfigured() ? 'AI connected · settings' : 'Connect free AI'}
        <span className={`ml-auto h-2 w-2 rounded-full ${isAiConfigured() ? 'bg-go' : 'bg-white/25'}`} />
      </button>
    </div>
  )
}
