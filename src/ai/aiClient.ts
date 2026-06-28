import type { Career } from '../data/types'
import { geminiJson, geminiChat, GeminiError, type Part, type Turn } from './gemini'
import { groqJson, groqChat } from './groq'
import { clamp } from '../lib/format'
import { careers } from '../data/careers'

const KEY_STORAGE = 'rc_gemini_key'

// A free-tier Gemini key is shipped so "generate any career" works out of the box
// for anyone running the demo — no setup. A deploy can override it with the
// VITE_GEMINI_KEY env var, and a user can still bring their own in Settings.
// NOTE: a client-side key is public by nature; treat it as disposable and rotate
// it after the event.
const BUILT_IN_KEY = (import.meta.env.VITE_GEMINI_KEY as string | undefined) || ''

/** The user's own key, if they set one (does not include the built-in default). */
export function getUserKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

/** The key actually used for requests: the user's own, or the built-in default. */
export function getApiKey(): string {
  return getUserKey() || BUILT_IN_KEY
}

export const usingBuiltInKey = (): boolean => !getUserKey() && BUILT_IN_KEY.length > 10

export function setApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim())
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* storage may be unavailable; the built-in key still works */
  }
}

export const isAiConfigured = (): boolean => getApiKey().length > 10

// --- Groq fallback key (used automatically when Gemini rate-limits/errors) ---
const GROQ_STORAGE = 'rc_groq_key'
const BUILT_IN_GROQ_KEY = (import.meta.env.VITE_GROQ_KEY as string | undefined) || ''

export function getUserGroqKey(): string {
  try {
    return localStorage.getItem(GROQ_STORAGE) ?? ''
  } catch {
    return ''
  }
}
export const getGroqKey = (): string => getUserGroqKey() || BUILT_IN_GROQ_KEY
export const hasGroq = (): boolean => getGroqKey().length > 10
export function setGroqKey(key: string): void {
  try {
    if (key) localStorage.setItem(GROQ_STORAGE, key.trim())
    else localStorage.removeItem(GROQ_STORAGE)
  } catch {
    /* ignore */
  }
}

// Retry on a different provider only for transient failures, never auth/parse.
function retriable(e: unknown): boolean {
  return e instanceof GeminiError && (e.kind === 'rate' || e.kind === 'server' || e.kind === 'network')
}

interface AiJsonArgs {
  systemInstruction: string
  prompt?: string
  parts?: Part[]
  responseSchema: Record<string, unknown>
  signal?: AbortSignal
  maxTokens?: number
}

/** Structured output with automatic Gemini -> Groq fallback (text-only inputs). */
async function aiJson<T>(args: AiJsonArgs): Promise<T> {
  const hasMedia = args.parts?.some((p) => p.inlineData)
  try {
    return await geminiJson<T>({ apiKey: getApiKey(), ...args })
  } catch (e) {
    // Groq can't read images/audio, so media calls stay on Gemini.
    if (!hasMedia && retriable(e) && hasGroq()) return groqJson<T>({ apiKey: getGroqKey(), ...args })
    throw e
  }
}

interface AiChatArgs {
  systemInstruction: string
  history: Turn[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

/** Chat with automatic Gemini -> Groq fallback. */
async function aiChat(args: AiChatArgs): Promise<string> {
  try {
    return await geminiChat({ apiKey: getApiKey(), ...args })
  } catch (e) {
    if (retriable(e) && hasGroq()) return groqChat({ apiKey: getGroqKey(), ...args })
    throw e
  }
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

// Reusable schema fragments for Gemini's structured output.
const strArr = { type: 'array', items: { type: 'string' } }
const simOption = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    correct: { type: 'boolean' },
    feedback: { type: 'string' },
  },
  required: ['text', 'correct', 'feedback'],
}

const CAREER_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    category: {
      type: 'string',
      enum: ['Technology', 'Healthcare', 'Business & Finance', 'Creative & Media', 'Engineering', 'Legal', 'Education', 'Skilled Trades', 'Other'],
    },
    oneLineReality: { type: 'string' },
    medianPayUSD: { type: 'number' },
    medianPayYear: { type: 'number' },
    entryLevelPayUSD: { type: 'number' },
    partTimeHourlyUSD: { type: 'number' },
    outlookPercent: { type: 'number' },
    outlookPeriod: { type: 'string' },
    blsUrl: { type: 'string' },
    typicalDay: strArr,
    workStyle: { type: 'string' },
    boringHardPart: { type: 'string' },
    keyTools: strArr,
    crashCourse: strArr,
    workSimulation: {
      type: 'object',
      properties: {
        scenario: { type: 'string' },
        task: { type: 'string' },
        options: { type: 'array', items: simOption },
        aiSuggestion: { type: 'string' },
        aiMistake: { type: 'string' },
        correctHumanJudgment: { type: 'string' },
        aiCatchOptions: { type: 'array', items: simOption },
      },
      required: ['scenario', 'task', 'options', 'aiSuggestion', 'aiMistake', 'correctHumanJudgment', 'aiCatchOptions'],
    },
    aiImpact: {
      type: 'object',
      properties: {
        automates: strArr,
        humanValue: strArr,
        riskLevel: { type: 'number' },
        riskNote: { type: 'string' },
      },
      required: ['automates', 'humanValue', 'riskLevel', 'riskNote'],
    },
    typicalDegree: { type: 'string' },
    programLengthYears: { type: 'number' },
    communityCollegeAnnualUSD: { type: 'number' },
    universities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          program: { type: 'string' },
          inStateAnnualUSD: { type: 'number' },
          outStateAnnualUSD: { type: 'number' },
          url: { type: 'string' },
        },
        required: ['name', 'program', 'inStateAnnualUSD', 'outStateAnnualUSD', 'url'],
      },
    },
    thirtyDayPlan: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } },
        required: ['title', 'detail'],
      },
    },
    scoreProfile: {
      type: 'object',
      properties: {
        money: { type: 'number' },
        interest: { type: 'number' },
        skill: { type: 'number' },
        aiResilience: { type: 'number' },
        lifestyle: { type: 'number' },
      },
      required: ['money', 'interest', 'skill', 'aiResilience', 'lifestyle'],
    },
  },
  required: [
    'title', 'category', 'oneLineReality', 'medianPayUSD', 'entryLevelPayUSD', 'partTimeHourlyUSD',
    'outlookPercent', 'blsUrl', 'typicalDay', 'workStyle', 'boringHardPart', 'keyTools', 'crashCourse',
    'workSimulation', 'aiImpact', 'typicalDegree', 'programLengthYears', 'communityCollegeAnnualUSD',
    'universities', 'thirtyDayPlan', 'scoreProfile',
  ],
}

const SYSTEM = `You are a brutally honest US career analyst building a "reality check" career profile for a student simulator.
Be specific and realistic, never generic. Use recent US Bureau of Labor Statistics figures for pay and outlook (best estimate if unsure). List 3 REAL, well-known US universities with realistic current annual tuition (in-state and out-of-state).
Design a workSimulation that is a true-to-the-job mini decision with 3-4 options (exactly one correct) and rich feedback, then an AI-coworker suggestion that is confident but has a SUBTLE, REAL flaw, plus 3 aiCatchOptions where exactly one correctly names that flaw.
Every score (scoreProfile.money/interest/skill/aiResilience/lifestyle and aiImpact.riskLevel) is an integer from 0 to 100 — for example 72 or 45, NEVER on a 0-10 scale. All money fields are plain numbers (e.g. 95000).`

type GeneratedCareer = Omit<Career, 'key' | 'generated' | 'sources' | 'bootcamp' | 'certificate'>

/** Generate a full FuturePilot profile for any profession via Gemini. */
export async function generateCareerProfile(title: string, signal?: AbortSignal): Promise<Career> {
  if (!isAiConfigured()) throw new Error('no-key')

  const raw = await aiJson<GeneratedCareer>({
    systemInstruction: SYSTEM,
    prompt: `Build the complete FuturePilot profile for this profession: "${title}". Make every field concrete and honest for a curious student deciding whether to pursue it.`,
    responseSchema: CAREER_SCHEMA,
    signal,
  })

  // Harden the model output into a valid Career.
  const sp = raw.scoreProfile
  // If the model used a 0-10 scale (all five dims <= 10), rescale to 0-100.
  const dims = [sp.money, sp.interest, sp.skill, sp.aiResilience, sp.lifestyle]
  const scale = dims.every((v) => v > 0 && v <= 10) ? 10 : 1
  const riskScale = raw.aiImpact.riskLevel > 0 && raw.aiImpact.riskLevel <= 10 ? 10 : 1

  return {
    ...raw,
    key: 'ai-' + slug(title),
    title: raw.title || title,
    medianPayYear: raw.medianPayYear || new Date().getFullYear(),
    bootcamp: null,
    certificate: null,
    sources: [],
    generated: true,
    aiImpact: { ...raw.aiImpact, riskLevel: clamp(raw.aiImpact.riskLevel * riskScale) },
    scoreProfile: {
      money: clamp(sp.money * scale),
      interest: clamp(sp.interest * scale),
      skill: clamp(sp.skill * scale),
      aiResilience: clamp(sp.aiResilience * scale),
      lifestyle: clamp(sp.lifestyle * scale),
    },
  }
}

// ---------------------------------------------------------------------------
// Live AI Shadow Shift — a free-text role-play where the AI plays a senior
// at the job and runs the student through a real workday.
// ---------------------------------------------------------------------------

export const SHIFT_END_MARKER = '— END OF SHIFT —'

function shadowSystem(career: Career): string {
  return `You are a busy but fair senior ${career.title} mentoring a curious student who is "shadowing" you for one real shift to feel what the job is like.

The job, honestly: ${career.oneLineReality}
The draining/hard part: ${career.boringHardPart}
Real tools/jargon you use: ${career.keyTools.join(', ')}

Run a LIVE role-play:
- Open by dropping them into ONE specific, realistic crisis or decision from this job (you can take inspiration from: "${career.workSimulation.scenario}"). Set the scene in 2-3 sentences and ask "What do you do?"
- React to each of their answers like a real senior would: name the real consequence, what a pro would have noticed, and whether they're on the right track. Then escalate with a tougher, connected follow-up.
- Somewhere in the middle, casually suggest an easy/AI-style shortcut that is subtly WRONG, and see if they push back. Reward good human judgment.
- Keep EVERY message short: 2-4 sentences, second person, in character, with real specifics — never generic.
- After about 4 of their answers, end the shift. Write "${SHIFT_END_MARKER}" on its own line, then a 2-3 sentence honest debrief: did they show the judgment this job actually needs, and would this career suit them?

Be warm to a beginner but brutally honest about the realities. Stay in character until the debrief.`
}

/** Get the AI mentor's next message in the live shadow shift. */
export function runShadowChat(career: Career, history: Turn[], signal?: AbortSignal): Promise<string> {
  return aiChat({ systemInstruction: shadowSystem(career), history, signal })
}

export interface ShadowAssessment {
  score: number
  caught: boolean
  headline: string
  strengths: string[]
  gaps: string[]
}

const ASSESS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    score: { type: 'number', description: '0-100 overall judgment shown across the shift' },
    caught: { type: 'boolean', description: 'Did the student push back on the subtly-wrong shortcut?' },
    headline: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'caught', 'headline', 'strengths', 'gaps'],
}

/** Grade a finished shadow-shift transcript into a structured assessment. */
export async function assessShadow(career: Career, transcript: string, signal?: AbortSignal): Promise<ShadowAssessment> {
  const r = await aiJson<ShadowAssessment>({
    systemInstruction: `You are evaluating how a student handled a live "shadow shift" role-play for the career ${career.title}. Judge the judgment they showed: realism, owning failure paths, and whether they caught the subtly-wrong shortcut. Score 0-100 (an integer, not 0-10). Be fair to a beginner but honest. Give 1-3 short strengths and 1-3 short gaps.`,
    prompt: `Here is the full transcript of the shadow shift:\n\n${transcript}`,
    responseSchema: ASSESS_SCHEMA,
    signal,
    maxTokens: 1024,
  })
  return { ...r, score: clamp(r.score > 0 && r.score <= 10 ? r.score * 10 : r.score) }
}

// ---------------------------------------------------------------------------
// Vera — the live career-coach chatbot. Talk about any career.
// ---------------------------------------------------------------------------

export const COACH_NAME = 'Vera'

function coachSystem(career: Career): string {
  const catalog = careers.map((c) => c.title).join(', ')
  return `You are ${COACH_NAME}, the FuturePilot AI career coach — warm, sharp, and refreshingly honest with teenagers and young adults figuring out their future.

The student is currently exploring "${career.title}": ${career.oneLineReality} Median pay is roughly $${Math.round(career.medianPayUSD / 1000)}k, AI-automation exposure ${career.aiImpact.riskLevel}/100, and the draining part is: ${career.boringHardPart}

You can talk about ANY career, compare two of them, reality-check a plan, or help someone who has no idea where to start. Careers they can open as a full trial in this app: ${catalog}.

Rules:
- Keep replies SHORT: 2-4 sentences, specific and real — never generic, never a wall of text, never preachy.
- Be encouraging but brutally honest about trade-offs (money, debt, AI risk, daily reality, lifestyle).
- Talk like a real mentor to a 16-year-old: plain language, concrete examples.
- Don't invent exact salaries you're unsure of — speak in ranges.
- When a career in the catalog fits what they're describing, suggest they open its trial in FuturePilot.`
}

/** One turn of the career-coach chat. `history` is the running conversation. */
export function coachReply(career: Career, history: Turn[], signal?: AbortSignal): Promise<string> {
  return aiChat({ systemInstruction: coachSystem(career), history, signal, maxTokens: 600 })
}

// ---------------------------------------------------------------------------
// Teach me — a live mini-lesson on a starter skill from the crash course.
// ---------------------------------------------------------------------------

export interface SkillLesson {
  what: string
  why: string
  example: string
  firstAction: string
}

const SKILL_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    what: { type: 'string', description: 'Plainly, what this skill is — 1-2 sentences, no jargon.' },
    why: { type: 'string', description: 'Why it matters for this specific career — 1-2 sentences.' },
    example: { type: 'string', description: 'A tiny concrete taste a beginner can actually read: a 2-5 line code snippet, formula, or worked mini-example. Keep it short.' },
    firstAction: { type: 'string', description: 'The very first 10-minute thing they can do right now to try it.' },
  },
  required: ['what', 'why', 'example', 'firstAction'],
}

/** Teach one starter skill to a curious beginner, in the context of the career. */
export function explainSkill(career: Career, skill: string, signal?: AbortSignal): Promise<SkillLesson> {
  return aiJson<SkillLesson>({
    systemInstruction: `You are a warm, expert tutor for a teenager exploring what it's like to be a ${career.title}. Explain ONE starter skill simply: what it is, why it matters for ${career.title} specifically, a tiny concrete taste they can read (a 2-5 line snippet / formula / worked example — short!), and the first 10-minute action to try it themselves. Be encouraging and concrete. No long lists, no jargon dumps.`,
    prompt: `Teach me this starter skill for ${career.title}: "${skill}"`,
    responseSchema: SKILL_SCHEMA,
    signal,
    maxTokens: 1200,
  })
}

// ---------------------------------------------------------------------------
// AI Roadmap Generator — a personalized path to the career.
// ---------------------------------------------------------------------------

export interface RoadmapPhase {
  timeframe: string
  title: string
  focus: string
  actions: string[]
  resources: { name: string; type: string }[]
  milestone: string
}
export interface Roadmap {
  summary: string
  phases: RoadmapPhase[]
}

const ROADMAP_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', description: 'e.g. "Months 0-3"' },
          title: { type: 'string' },
          focus: { type: 'string' },
          actions: { type: 'array', items: { type: 'string' } },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, type: { type: 'string', description: 'course / book / project / cert / community' } },
              required: ['name', 'type'],
            },
          },
          milestone: { type: 'string' },
        },
        required: ['timeframe', 'title', 'focus', 'actions', 'resources', 'milestone'],
      },
    },
  },
  required: ['summary', 'phases'],
}

export function generateRoadmap(
  career: Career,
  pathLabel: string,
  regionLabel: string,
  signal?: AbortSignal,
): Promise<Roadmap> {
  return aiJson<Roadmap>({
    systemInstruction: `You are an expert, no-nonsense career mentor. Build a concrete, personalized roadmap from a motivated beginner (a high-school / early-college student, starting from zero) to a working ${career.title}, taking the "${pathLabel}" route, living in ${regionLabel}.
Use 4-5 phases with real timeframes. Each phase: a clear focus, 3-5 specific actions, 2-4 REAL named resources (actual courses, books, tools, certs, or communities — be specific), and one concrete milestone that proves progress. No fluff, no vague advice. Tailor to ${career.title} specifically (its real tools: ${career.keyTools.join(', ')}).`,
    prompt: `Build the roadmap to become a ${career.title} via the ${pathLabel} path.`,
    responseSchema: ROADMAP_SCHEMA,
    signal,
    maxTokens: 4096,
  })
}

// ---------------------------------------------------------------------------
// Multimodal "Find your fit" — recommend careers from a photo and/or voice.
// ---------------------------------------------------------------------------

export interface FitRec {
  title: string
  careerKey: string
  fit: number
  why: string
}
export interface FitResult {
  read: string
  recommendations: FitRec[]
}

const FIT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    read: { type: 'string', description: 'One warm sentence on what you perceived about this person from their input.' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          careerKey: { type: 'string', description: 'A key from the catalog, or "other" if none fits.' },
          fit: { type: 'number', description: '0-100 fit score' },
          why: { type: 'string', description: 'Why it fits what you observed, second person.' },
        },
        required: ['title', 'careerKey', 'fit', 'why'],
      },
    },
  },
  required: ['read', 'recommendations'],
}

/** Recommend careers from multimodal input (image and/or audio parts). */
export async function recommendFit(media: Part[], note: string, signal?: AbortSignal): Promise<FitResult> {
  const catalog = careers.map((c) => `${c.key}: ${c.title} (${c.category})`).join('\n')
  const parts: Part[] = [
    ...media,
    {
      text: `From the input above${note ? ` and this note: "${note}"` : ''}, infer what energizes this person and recommend exactly 3 best-fit careers. Prefer careers from this catalog (use the exact key); only use careerKey "other" if nothing fits.\n\nCatalog:\n${catalog}`,
    },
  ]
  const r = await aiJson<FitResult>({
    systemInstruction: `You are a perceptive, encouraging career-discovery guide. A student shares a photo of things they like (or their space/work) and/or a voice note about their hobbies and what they enjoy. Read what genuinely energizes them and map it to careers. Be specific and warm, never generic. Scores are 0-100.`,
    parts,
    responseSchema: FIT_SCHEMA,
    signal,
    maxTokens: 2048,
  })
  return r
}
