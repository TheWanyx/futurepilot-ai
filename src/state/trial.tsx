import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { Career } from '../data/types'

export type SectionId =
  | 'brief'
  | 'course'
  | 'sim'
  | 'ai'
  | 'money'
  | 'paths'
  | 'plan'
  | 'score'

export interface SectionMeta {
  id: SectionId
  code: string
  label: string
  short: string
}

// The trial is an 8-step mission. Order is the sequence the student moves through.
export const SECTIONS: SectionMeta[] = [
  { id: 'brief', code: '01', label: 'Reality Brief', short: 'Reality' },
  { id: 'course', code: '02', label: 'Crash Course', short: 'Learn' },
  { id: 'sim', code: '03', label: 'Work Simulation', short: 'Simulate' },
  { id: 'ai', code: '04', label: 'AI Impact Check', short: 'AI Impact' },
  { id: 'money', code: '05', label: 'Life Math', short: 'Money' },
  { id: 'paths', code: '06', label: 'Path Options', short: 'Paths' },
  { id: 'plan', code: '07', label: '30-Day Plan', short: 'Plan' },
  { id: 'score', code: '08', label: 'Reality Score', short: 'Verdict' },
]

export interface CareerProgress {
  started: boolean
  activeSection: SectionId
  /** Shift simulation: beat index -> chosen option index. */
  shiftChoices: Record<number, number>
  /** Result of a finished live AI shadow shift (overrides scripted when present). */
  shadowScore?: number
  shadowCaught?: boolean
  interestRating: number // 1–5, 0 = unset
  regionId: string
  pathId: string | null
  partTimeHours: number
  aidFraction: number
}

export function freshProgress(): CareerProgress {
  return {
    started: false,
    activeSection: 'brief',
    shiftChoices: {},
    interestRating: 0,
    regionId: 'national',
    pathId: null,
    partTimeHours: 10,
    aidFraction: 0.3,
  }
}

interface State {
  selectedKey: string
  progress: Record<string, CareerProgress>
  generated: Career[]
}

type Action =
  | { type: 'SELECT'; key: string }
  | { type: 'START' }
  | { type: 'SECTION'; id: SectionId }
  | { type: 'SHIFT_CHOICE'; beat: number; option: number }
  | { type: 'RESET_SHIFT' }
  | { type: 'SHADOW_RESULT'; score: number; caught: boolean }
  | { type: 'INTEREST'; value: number }
  | { type: 'REGION'; id: string }
  | { type: 'PATH'; id: string }
  | { type: 'PARTTIME'; hours: number }
  | { type: 'AID'; fraction: number }
  | { type: 'ADD_GENERATED'; career: Career }
  | { type: 'RESET' }

const STORAGE = 'rc_state_v1'

function loadState(defaultKey: string): State {
  const base: State = { selectedKey: defaultKey, progress: {}, generated: [] }
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<State>
    // Merge each stored progress onto fresh defaults so older saves (missing
    // newer fields like shiftChoices) can't crash the new UI.
    const progress: Record<string, CareerProgress> = {}
    for (const [k, v] of Object.entries(parsed.progress ?? {})) {
      progress[k] = { ...freshProgress(), ...(v as Partial<CareerProgress>) }
    }
    return {
      selectedKey: parsed.selectedKey || defaultKey,
      progress,
      generated: parsed.generated ?? [],
    }
  } catch {
    return base
  }
}

function withProgress(state: State, fn: (p: CareerProgress) => CareerProgress): State {
  const current = state.progress[state.selectedKey] ?? freshProgress()
  return {
    ...state,
    progress: { ...state.progress, [state.selectedKey]: fn(current) },
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selectedKey: action.key }
    case 'START':
      return withProgress(state, (p) => ({ ...p, started: true, activeSection: p.started ? p.activeSection : 'brief' }))
    case 'SECTION':
      return withProgress(state, (p) => ({ ...p, started: true, activeSection: action.id }))
    case 'SHIFT_CHOICE':
      return withProgress(state, (p) => ({
        ...p,
        shiftChoices: { ...p.shiftChoices, [action.beat]: action.option },
      }))
    case 'RESET_SHIFT':
      return withProgress(state, (p) => ({ ...p, shiftChoices: {} }))
    case 'SHADOW_RESULT':
      return withProgress(state, (p) => ({ ...p, shadowScore: action.score, shadowCaught: action.caught }))
    case 'INTEREST':
      return withProgress(state, (p) => ({ ...p, interestRating: action.value }))
    case 'REGION':
      return withProgress(state, (p) => ({ ...p, regionId: action.id }))
    case 'PATH':
      return withProgress(state, (p) => ({ ...p, pathId: action.id }))
    case 'PARTTIME':
      return withProgress(state, (p) => ({ ...p, partTimeHours: action.hours }))
    case 'AID':
      return withProgress(state, (p) => ({ ...p, aidFraction: action.fraction }))
    case 'ADD_GENERATED': {
      const exists = state.generated.some((c) => c.key === action.career.key)
      return {
        ...state,
        generated: exists ? state.generated : [...state.generated, action.career],
        selectedKey: action.career.key,
      }
    }
    case 'RESET':
      return withProgress(state, () => freshProgress())
    default:
      return state
  }
}

interface TrialContextValue {
  state: State
  dispatch: React.Dispatch<Action>
  progress: CareerProgress
}

const TrialContext = createContext<TrialContextValue | null>(null)

export function TrialProvider({ defaultKey, children }: { defaultKey: string; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultKey, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state))
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [state])

  const progress = state.progress[state.selectedKey] ?? freshProgress()
  const value = useMemo(() => ({ state, dispatch, progress }), [state, progress])
  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>
}

export function useTrial(): TrialContextValue {
  const ctx = useContext(TrialContext)
  if (!ctx) throw new Error('useTrial must be used within TrialProvider')
  return ctx
}
