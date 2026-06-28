import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

export type ToastKind = 'error' | 'info' | 'success'
export interface ToastData {
  id: number
  message: string
  kind: ToastKind
}

const cfg: Record<ToastKind, { icon: typeof Info; cls: string }> = {
  success: { icon: CircleCheck, cls: 'border-go/30 text-go' },
  info: { icon: Info, cls: 'border-brand/30 text-brand' },
  error: { icon: TriangleAlert, cls: 'border-risk/30 text-risk' },
}

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border bg-paper px-4 py-3 shadow-pop ${cfg[toast.kind].cls}`}
          >
            {(() => {
              const Icon = cfg[toast.kind].icon
              return <Icon size={18} className="mt-0.5 shrink-0" />
            })()}
            <span className="text-sm font-medium text-ink">{toast.message}</span>
            <button onClick={onClose} className="ml-1 shrink-0 text-ink-faint hover:text-ink" aria-label="Dismiss">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
