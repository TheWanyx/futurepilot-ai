import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'
import type { SignalStyle } from '../lib/signal'

interface Props {
  score: number
  signal: SignalStyle
  size?: number
  stroke?: number
  caption?: string
  dark?: boolean
}

/**
 * The signature instrument: a gauge that "boots up" — the arc sweeps in and the
 * number counts up — reading the overall Reality Score like a cockpit dial.
 */
export function ScoreRing({ score, signal, size = 168, stroke = 12, caption, dark }: Props) {
  const reduce = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const display = Math.round(useCountUp(pct))
  const trackColor = dark ? 'rgba(255,255,255,0.12)' : 'var(--color-line)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={signal.hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - pct / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-display text-[2.7rem] font-bold leading-none tracking-tight"
          style={{ color: signal.hex }}
        >
          {display}
        </div>
        <div className={`eyebrow mt-1 ${dark ? '!text-white/55' : ''}`}>{caption ?? 'Reality Score'}</div>
      </div>
    </div>
  )
}
