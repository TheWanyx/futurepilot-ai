// Thin Google Gemini client. We use the free-tier `gemini-2.5-flash` model via
// the public Generative Language REST API. One fetch keeps deps tiny. Supports
// structured JSON output, multi-turn chat, and multimodal (image/audio) input.

export const GEMINI_MODEL = 'gemini-2.5-flash'
const ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`

export type GeminiErrorKind = 'auth' | 'rate' | 'network' | 'parse' | 'server'

export class GeminiError extends Error {
  kind: GeminiErrorKind
  constructor(message: string, kind: GeminiErrorKind) {
    super(message)
    this.name = 'GeminiError'
    this.kind = kind
  }
}

export interface Part {
  text?: string
  inlineData?: { mimeType: string; data: string }
}
export interface Turn {
  role: 'user' | 'model'
  parts: Part[]
}

async function callGemini(apiKey: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(ENDPOINT(GEMINI_MODEL, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(body),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new GeminiError('Could not reach Gemini. Check your connection.', 'network')
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) throw new GeminiError('That API key was rejected. Check it in Settings.', 'auth')
    if (res.status === 429) throw new GeminiError('Gemini is rate-limited right now. Wait a moment and retry.', 'rate')
    throw new GeminiError(`Gemini returned an error (${res.status}).`, 'server')
  }
  return res.json()
}

function extractText(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  return text
}

interface JsonArgs {
  apiKey: string
  systemInstruction: string
  /** Plain text prompt, or pass `parts` for multimodal. */
  prompt?: string
  parts?: Part[]
  responseSchema: Record<string, unknown>
  signal?: AbortSignal
  maxTokens?: number
}

export async function geminiJson<T>({
  apiKey,
  systemInstruction,
  prompt,
  parts,
  responseSchema,
  signal,
  maxTokens = 8192,
}: JsonArgs): Promise<T> {
  const userParts: Part[] = parts ?? [{ text: prompt ?? '' }]
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: userParts }],
    // Disable "thinking" so the whole token budget goes to the answer (faster,
    // and avoids truncating structured output).
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
      responseSchema,
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
    },
  }
  // HTTP errors propagate; an occasional empty/garbled body is retried once.
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await callGemini(apiKey, body, signal)
    const text = extractText(data)
    if (text) {
      try {
        return JSON.parse(text) as T
      } catch {
        /* fall through to one retry */
      }
    }
  }
  throw new GeminiError('Gemini sent malformed data. Try again.', 'parse')
}

interface ChatArgs {
  apiKey: string
  systemInstruction: string
  history: Turn[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

/** Multi-turn free-text chat — returns the model's next message. */
export async function geminiChat({
  apiKey,
  systemInstruction,
  history,
  signal,
  temperature = 0.85,
  maxTokens = 800,
}: ChatArgs): Promise<string> {
  const data = await callGemini(
    apiKey,
    {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: history,
      generationConfig: { temperature, maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
    },
    signal,
  )
  const text = extractText(data)
  if (!text) throw new GeminiError('Gemini went quiet. Try again.', 'parse')
  return text.trim()
}
