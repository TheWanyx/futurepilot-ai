import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Play, ArrowRight, Sparkles, DollarSign, TrendingUp, Bot } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Career } from '../data/types'
import { ScoreRing } from './ScoreRing'
import { useTrial } from '../state/trial'
import { scoreFor } from '../state/selectors'
import { verdictSignal, aiRiskSignal } from '../lib/signal'
import { careerIcon } from '../lib/icons'
import { usd, pct } from '../lib/format'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export function ConsoleHeader({ career, onEnter }: { career: Career; onEnter: () => void }) {
  const { progress } = useTrial()
  const reduce = useReducedMotion()
  const score = scoreFor(career, progress)
  const vsig = verdictSignal(score.verdict)
  const risk = aiRiskSignal(career.aiImpact.riskLevel)
  const Icon = careerIcon(career.key, career.category, career.generated)

  const Stat = ({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color?: string }) => (
    <motion.div variants={item} className="rounded-xl border border-console-line bg-console-soft/70 px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
        {icon} {label}
      </div>
      <div className="mt-0.5 font-display text-base font-semibold" style={{ color: color ?? '#fff' }}>{value}</div>
    </motion.div>
  )

  return (
    <div className="blueprint relative overflow-hidden rounded-3xl bg-console p-6 text-white shadow-console sm:p-8">
      {/* ambient glow that slowly breathes */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
        animate={reduce ? undefined : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.12, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-data/15 blur-3xl"
        animate={reduce ? undefined : { opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <motion.div key={career.key} variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
              <Icon size={16} className="text-brand" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-white/50">{career.category}</span>
            {career.generated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2 py-0.5 text-[11px] font-medium text-brand">
                <Sparkles size={11} /> AI-generated
              </span>
            )}
          </motion.div>

          <motion.h1 variants={item} className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {career.title}
          </motion.h1>
          <motion.p variants={item} className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/65">
            {career.oneLineReality}
          </motion.p>

          <motion.div variants={item} className="mt-5 grid grid-cols-2 gap-2.5 sm:max-w-lg sm:grid-cols-3">
            <Stat icon={<DollarSign size={11} />} label="Median pay" value={`${usd(career.medianPayUSD)}`} />
            <Stat icon={<TrendingUp size={11} />} label="10-yr outlook" value={pct(career.outlookPercent, true)} color={career.outlookPercent >= 0 ? '#6ee7b7' : '#fda4af'} />
            <Stat icon={<Bot size={11} />} label="AI exposure" value={`${career.aiImpact.riskLevel}/100`} color={risk.hex} />
          </motion.div>

          <motion.button
            variants={item}
            type="button"
            onClick={onEnter}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative mt-6 inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(75,71,255,0.7)]"
          >
            {/* sweeping shine */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {progress.started ? <ArrowRight size={18} /> : <Play size={18} className="fill-white" />}
            {progress.started ? 'Continue the trial' : 'Run the 20-minute trial'}
            {!progress.started && <span className="ml-1 hidden font-mono text-xs font-normal text-white/70 sm:inline">8 steps</span>}
          </motion.button>
        </motion.div>

        <div className="flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative">
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: `0 0 48px 0 ${vsig.hex}55` }}
                  animate={{ opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <ScoreRing score={score.overall} signal={vsig} size={172} dark caption="Live score" />
            </div>
            <div className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${vsig.bg} ${vsig.text}`}>{vsig.label}</div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
