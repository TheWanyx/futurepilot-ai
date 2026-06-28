import type {
  Career,
  LifeMathResult,
  PathOption,
  ScoreInputs,
  ScoreResult,
  Shift,
} from '../data/types'
import { careers } from '../data/careers'
import { buildPathOptions } from '../lib/paths'
import { computeLifeMath } from '../lib/lifeMath'
import { computeRealityScore } from '../lib/score'
import { regionById } from '../lib/regions'
import type { CareerProgress } from './trial'

export function resolveCareer(key: string, generated: Career[]): Career | undefined {
  return careers.find((c) => c.key === key) ?? generated.find((c) => c.key === key)
}

export function activePath(career: Career, progress: CareerProgress): PathOption {
  const options = buildPathOptions(career)
  return options.find((o) => o.id === progress.pathId) ?? options[0]
}

export function lifeMathFor(career: Career, progress: CareerProgress): LifeMathResult {
  return computeLifeMath(career, {
    path: activePath(career, progress),
    region: regionById(progress.regionId),
    isResident: true,
    partTimeHours: progress.partTimeHours,
    aidFraction: progress.aidFraction,
  })
}

// ---------------------------------------------------------------------------
// Shift simulation
// ---------------------------------------------------------------------------

/** Curated careers ship a shift; AI-generated ones fall back to a 2-beat shift
 * built from their single work-sim dilemma so the experience still works. */
export function shiftFor(career: Career): Shift {
  if (career.shift) return career.shift
  const ws = career.workSimulation
  return {
    intro: `A real moment on the job as a ${career.title}.`,
    closer: `That kind of judgment call is what this work really turns on.`,
    beats: [
      {
        clock: 'On shift',
        title: 'The call',
        situation: ws.scenario,
        decision: ws.task,
        kind: 'decision',
        aiSuggestion: '',
        options: ws.options.map((o) => ({
          text: o.text,
          quality: o.correct ? 1 : 0,
          consequence: o.feedback,
          tag: o.correct ? 'Right call' : 'Off',
        })),
      },
      {
        clock: 'Minutes later',
        title: 'The AI coworker',
        situation: 'Your AI assistant jumps in with a confident recommendation.',
        decision: 'What did the AI get wrong?',
        kind: 'ai-trap',
        aiSuggestion: ws.aiSuggestion,
        options: ws.aiCatchOptions.map((o) => ({
          text: o.text,
          quality: o.correct ? 1 : 0,
          consequence: o.feedback,
          tag: o.correct ? 'Caught it' : 'Missed',
        })),
      },
    ],
  }
}

export interface ShiftStats {
  total: number
  answeredCount: number
  allAnswered: boolean
  avgQuality: number
  caughtAiMistake: boolean
  trapBeat: number
}

export function shiftStats(career: Career, progress: CareerProgress): ShiftStats {
  const beats = shiftFor(career).beats
  const choices = progress.shiftChoices ?? {}
  let qualitySum = 0
  let answeredCount = 0
  for (let i = 0; i < beats.length; i++) {
    const choice = choices[i]
    if (choice == null) continue
    answeredCount++
    qualitySum += beats[i].options[choice]?.quality ?? 0
  }
  const trapBeat = beats.findIndex((b) => b.kind === 'ai-trap')
  const trapChoice = trapBeat >= 0 ? choices[trapBeat] : undefined
  const caughtAiMistake = trapChoice != null && beats[trapBeat].options[trapChoice]?.quality === 1
  return {
    total: beats.length,
    answeredCount,
    allAnswered: answeredCount === beats.length,
    avgQuality: answeredCount ? qualitySum / answeredCount : 0,
    caughtAiMistake,
    trapBeat,
  }
}

export function scoreInputsFor(
  career: Career,
  progress: CareerProgress,
  lifeMath: LifeMathResult,
): ScoreInputs {
  const s = shiftStats(career, progress)
  // A finished live AI shadow shift takes precedence over the scripted one.
  const usedShadow = progress.shadowScore != null
  return {
    simAccuracy: usedShadow ? progress.shadowScore! / 100 : s.answeredCount ? s.avgQuality : 0.5,
    caughtAiMistake: usedShadow ? !!progress.shadowCaught : s.caughtAiMistake,
    interestSelfRating: progress.interestRating || 3,
    debtToIncome: lifeMath.debtToIncome,
  }
}

/** Has the student completed the simulation in either mode? */
export function simDone(career: Career, progress: CareerProgress): boolean {
  return progress.shadowScore != null || shiftStats(career, progress).allAnswered
}

export function scoreFor(career: Career, progress: CareerProgress): ScoreResult {
  const lm = lifeMathFor(career, progress)
  return computeRealityScore(career, scoreInputsFor(career, progress, lm))
}
