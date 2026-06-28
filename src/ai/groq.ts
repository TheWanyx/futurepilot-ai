// Groq fallback client — fast, free-tier OpenAI-compatible inference. Used when
// Gemini rate-limits or errors. Text + JSON only (no image/audio).
import { GeminiError, type Part, type Turn } from './gemini'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function turnsToMessages(history: Turn[]): Message[] {
  return history.map((t) => ({
    role: t.role === 'model' ? 'assistant' : 'user',
    content: t.parts.map((p) => p.text ?? '').join(''),
  }))
}

async function callGroq(apiKey: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal,
      body: JSON.stringify(body),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new GeminiError('Could not reach Groq.', 'network')
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new GeminiError('Groq key was rejected.', 'auth')
    if (res.status === 429) throw new GeminiError('Groq is rate-limited.', 'rate')
    throw new GeminiError(`Groq error (${res.status}).`, 'server')
  }
  return res.json()
}

function content(data: unknown): string {
  const d = data as { choices?: { message?: { content?: string } }[] }
  return d?.choices?.[0]?.message?.content ?? ''
}

interface ChatArgs {
  apiKey: string
  systemInstruction: string
  history: Turn[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

export async function groqChat({ apiKey, systemInstruction, history, signal, temperature = 0.85, maxTokens = 800 }: ChatArgs): Promise<string> {
  const data = await callGroq(
    apiKey,
    { model: GROQ_MODEL, messages: [{ role: 'system', content: systemInstruction }, ...turnsToMessages(history)], temperature, max_tokens: maxTokens },
    signal,
  )
  const text = content(data)
  if (!text) throw new GeminiError('Groq sent nothing back.', 'parse')
  return text.trim()
}

interface JsonArgs {
  apiKey: string
  systemInstruction: string
  prompt?: string
  parts?: Part[]
  responseSchema: Record<string, unknown>
  signal?: AbortSignal
  maxTokens?: number
}

export async function groqJson<T>({ apiKey, systemInstruction, prompt, parts, responseSchema, signal, maxTokens = 4096 }: JsonArgs): Promise<T> {
  const userText = parts ? parts.map((p) => p.text ?? '').filter(Boolean).join('\n') : prompt ?? ''
  const sys = `${systemInstruction}\n\nReturn ONLY a single valid minified JSON object — no markdown, no prose, no code fences — that conforms exactly to this JSON schema:\n${JSON.stringify(responseSchema)}`
  const messages: Message[] = [
    { role: 'system', content: sys },
    { role: 'user', content: userText || 'Produce the JSON now.' },
  ]
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await callGroq(apiKey, { model: GROQ_MODEL, messages, temperature: 0.6, max_tokens: maxTokens, response_format: { type: 'json_object' } }, signal)
    const text = content(data)
    if (text) {
      try {
        return JSON.parse(text) as T
      } catch {
        /* retry once */
      }
    }
  }
  throw new GeminiError('Groq sent malformed data.', 'parse')
}
