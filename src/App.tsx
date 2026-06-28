import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Settings, ArrowLeft, ArrowRight } from 'lucide-react'
import { BrandMark } from './components/ui'
import { Sidebar } from './components/Sidebar'
import { ConsoleHeader } from './components/ConsoleHeader'
import { StepNav } from './components/StepNav'
import { SettingsModal } from './components/SettingsModal'
import { CompareView } from './components/CompareView'
import { FindYourFit } from './components/FindYourFit'
import { CoachChat } from './components/CoachChat'
import { Toast, type ToastData, type ToastKind } from './components/Toast'
import { RealityBrief } from './components/sections/RealityBrief'
import { CrashCourse } from './components/sections/CrashCourse'
import { Simulate } from './components/sections/Simulate'
import { AiImpact } from './components/sections/AiImpact'
import { LifeMath } from './components/sections/LifeMath'
import { PathOptions } from './components/sections/PathOptions'
import { ActionPlan } from './components/sections/ActionPlan'
import { RealityScore } from './components/sections/RealityScore'
import { useTrial, SECTIONS } from './state/trial'
import { resolveCareer } from './state/selectors'
import { careers } from './data/careers'

export default function App() {
  const { state, dispatch, progress } = useTrial()
  const [drawer, setDrawer] = useState(false)
  const [settings, setSettings] = useState(false)
  const [compare, setCompare] = useState(false)
  const [findFit, setFindFit] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const trialRef = useRef<HTMLDivElement>(null)
  const prevSection = useRef(progress.activeSection)

  const career = resolveCareer(state.selectedKey, state.generated) ?? careers[0]

  // Recover if a stale selected key points nowhere.
  useEffect(() => {
    if (!resolveCareer(state.selectedKey, state.generated)) dispatch({ type: 'SELECT', key: careers[0].key })
  }, [state.selectedKey, state.generated, dispatch])

  const notify = (message: string, kind: ToastKind = 'info') =>
    setToast({ id: Date.now(), message, kind })

  // "Run the trial" — mark started and glide the student down into the steps,
  // even when the active step didn't change (so it never feels like a dead click).
  const enterTrial = () => {
    dispatch({ type: 'START' })
    requestAnimationFrame(() => trialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(t)
  }, [toast])

  // Scroll the trial area into view only when the step actually changes.
  // (Comparing to the previous value avoids a spurious scroll on mount — including
  // React StrictMode's double effect invocation in dev.)
  useEffect(() => {
    if (prevSection.current === progress.activeSection) return
    prevSection.current = progress.activeSection
    trialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [progress.activeSection])

  const idx = SECTIONS.findIndex((s) => s.id === progress.activeSection)

  const renderSection = () => {
    switch (progress.activeSection) {
      case 'brief': return <RealityBrief career={career} />
      case 'course': return <CrashCourse career={career} />
      case 'sim': return <Simulate career={career} />
      case 'ai': return <AiImpact career={career} />
      case 'money': return <LifeMath career={career} />
      case 'paths': return <PathOptions career={career} />
      case 'plan': return <ActionPlan career={career} />
      case 'score': return <RealityScore career={career} onCompare={() => setCompare(true)} notify={notify} />
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 overflow-hidden border-r border-console-line bg-console lg:block">
        <Sidebar onOpenSettings={() => setSettings(true)} onFindFit={() => setFindFit(true)} notify={notify} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-console/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute inset-y-0 left-0 w-[290px] overflow-hidden bg-console"
            >
              <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 z-10 text-white/50 hover:text-white" aria-label="Close menu">
                <X size={18} />
              </button>
              <Sidebar onSelect={() => setDrawer(false)} onOpenSettings={() => { setDrawer(false); setSettings(true) }} onFindFit={() => { setDrawer(false); setFindFit(true) }} notify={notify} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-2 text-ink" aria-label="Open menu">
            <Menu size={20} />
            <span className="flex items-center gap-1.5 font-display text-sm font-bold">
              <BrandMark size={22} /> FuturePilot<span className="text-brand">AI</span>
            </span>
          </button>
          <button onClick={() => setSettings(true)} className="text-ink-soft hover:text-ink" aria-label="Settings">
            <Settings size={19} />
          </button>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <ConsoleHeader career={career} onEnter={enterTrial} />

            <div ref={trialRef} className="scroll-mt-4">
              <StepNav career={career} />
              <div className="py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={career.key + progress.activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {renderSection()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center justify-between border-t border-line pt-4">
                <button
                  type="button"
                  disabled={idx <= 0}
                  onClick={() => idx > 0 && dispatch({ type: 'SECTION', id: SECTIONS[idx - 1].id })}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={16} /> {idx > 0 ? SECTIONS[idx - 1].short : 'Back'}
                </button>
                <span className="font-mono text-xs text-ink-faint">{SECTIONS[idx].code} / 08</span>
                <button
                  type="button"
                  disabled={idx >= SECTIONS.length - 1}
                  onClick={() => idx < SECTIONS.length - 1 && dispatch({ type: 'SECTION', id: SECTIONS[idx + 1].id })}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {idx < SECTIONS.length - 1 ? SECTIONS[idx + 1].short : 'Done'} <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <footer className="pb-6 pt-2 text-center text-xs text-ink-faint">
              FuturePilot AI · test-drive your future before you bet years and money on it · figures from the U.S. Bureau of Labor Statistics
            </footer>
          </div>
        </main>
      </div>

      <SettingsModal open={settings} onClose={() => setSettings(false)} notify={notify} />
      <CompareView open={compare} onClose={() => setCompare(false)} />
      <FindYourFit open={findFit} onClose={() => setFindFit(false)} notify={notify} />
      <CoachChat career={career} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
