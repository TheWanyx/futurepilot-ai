import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SignalStyle } from '../lib/signal'

/** FuturePilot brand mark: a navy console tile with a cockpit heading-indicator
 * needle (an aircraft climbing inside an instrument bezel). */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect width="64" height="64" rx="16" fill="#0e1a2b" />
      <circle cx="32" cy="33" r="15.5" fill="none" stroke="#4b47ff" strokeWidth="2.5" strokeOpacity="0.32" />
      <path d="M32 16.5 L40 45 L32 39 L24 45 Z" fill="#4b47ff" />
    </svg>
  )
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'ai' }) {
  const tones = {
    neutral: 'bg-canvas text-ink-soft border-line',
    brand: 'bg-brand-soft text-brand-ink border-brand/20',
    ai: 'bg-brand-soft text-brand-ink border-brand/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, signal, height = 8 }: { value: number; signal?: SignalStyle; height?: number }) {
  const fill = signal?.hex ?? 'var(--color-brand)'
  return (
    <div className="w-full overflow-hidden rounded-full bg-line" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: fill }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

export function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-sm text-ink-soft">{sub}</div>}
    </div>
  )
}

export function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rate your interest">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={26}
              className={active ? 'text-caution' : 'text-line-strong'}
              fill={active ? 'currentColor' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}

export function ListRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-[15px] leading-relaxed text-ink-soft">{children}</span>
    </li>
  )
}

export function SectionIntro({ code, title, blurb }: { code: string; title: string; blurb: string }) {
  return (
    <div className="mb-5">
      <div className="eyebrow">
        Step {code} / 08
      </div>
      <h2 className="mt-1 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{blurb}</p>
    </div>
  )
}
