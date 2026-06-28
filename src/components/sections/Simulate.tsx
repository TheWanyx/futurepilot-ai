import { useState } from 'react'
import { Sparkles, ListChecks } from 'lucide-react'
import type { Career } from '../../data/types'
import { ShadowShift } from './ShadowShift'
import { ShiftSimulation } from './ShiftSimulation'

type Mode = 'live' | 'scripted'

export function Simulate({ career }: { career: Career }) {
  const [mode, setMode] = useState<Mode>('live')

  const Tab = ({ value, icon, label, hint }: { value: Mode; icon: React.ReactNode; label: string; hint: string }) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        mode === value ? 'bg-brand text-white' : 'text-ink-soft hover:text-ink'
      }`}
      title={hint}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-line bg-paper p-1">
        <Tab value="live" icon={<Sparkles size={15} />} label="Live AI shift" hint="Free-text role-play with an AI mentor" />
        <Tab value="scripted" icon={<ListChecks size={15} />} label="Quick shift" hint="Fast multiple-choice version, no AI needed" />
      </div>

      {mode === 'live' ? <ShadowShift career={career} /> : <ShiftSimulation career={career} />}
    </div>
  )
}
