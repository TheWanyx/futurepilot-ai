import { motion, useReducedMotion } from 'framer-motion'
import { usdCompact } from '../lib/format'

interface Point {
  year: number
  value: number
}

/**
 * Cumulative-cash line: starts below zero (debt at graduation) and climbs.
 * The moment it crosses the zero line is the visual break-even — the payoff.
 */
export function MiniChart({ series, height = 200 }: { series: Point[]; height?: number }) {
  const reduce = useReducedMotion()
  const W = 640
  const H = height
  const padX = 8
  const padTop = 18
  const padBottom = 26

  const values = series.map((p) => p.value)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const span = max - min || 1

  const x = (i: number) => padX + (i / (series.length - 1)) * (W - padX * 2)
  const y = (v: number) => padTop + (1 - (v - min) / span) * (H - padTop - padBottom)

  const linePath = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${x(series.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`
  const zeroY = y(0)

  // Break-even: first index where the value turns non-negative.
  const beIndex = series.findIndex((p) => p.value >= 0)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Projected cumulative cash position over 10 years">
      <defs>
        <linearGradient id="rc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* zero baseline */}
      <line x1={padX} x2={W - padX} y1={zeroY} y2={zeroY} stroke="var(--color-line-strong)" strokeWidth="1" strokeDasharray="4 4" />
      <text x={padX} y={zeroY - 5} className="fill-ink-faint" style={{ font: "500 11px var(--font-mono)" }}>
        break-even
      </text>

      <motion.path
        d={areaPath}
        fill="url(#rc-area)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* break-even marker */}
      {beIndex > 0 && (
        <circle cx={x(beIndex)} cy={y(series[beIndex].value)} r="4.5" fill="var(--color-go)" stroke="white" strokeWidth="2" />
      )}
      {/* end marker + label */}
      <circle cx={x(series.length - 1)} cy={y(series[series.length - 1].value)} r="4.5" fill="var(--color-brand)" stroke="white" strokeWidth="2" />
      <text
        x={x(series.length - 1)}
        y={y(series[series.length - 1].value) - 10}
        textAnchor="end"
        className="fill-ink"
        style={{ font: '600 12px var(--font-mono)' }}
      >
        {usdCompact(series[series.length - 1].value)}
      </text>

      {/* x labels */}
      {[0, 2, 4, 6, 8, 10].map((yr) => (
        <text key={yr} x={x(yr)} y={H - 6} textAnchor="middle" className="fill-ink-faint" style={{ font: '500 10px var(--font-mono)' }}>
          {yr === 0 ? 'grad' : `${yr}y`}
        </text>
      ))}
    </svg>
  )
}
