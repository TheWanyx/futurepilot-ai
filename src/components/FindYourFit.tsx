import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Sparkles, ImageUp, Mic, Square, Loader2, ArrowRight, Compass } from 'lucide-react'
import { recommendFit, type FitResult } from '../ai/aiClient'
import type { Part } from '../ai/gemini'
import { careerByKey } from '../data/careers'
import { useTrial } from '../state/trial'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export function FindYourFit({ open, onClose, notify }: { open: boolean; onClose: () => void; notify: (m: string, k?: 'error' | 'info' | 'success') => void }) {
  const { dispatch } = useTrial()
  const [note, setNote] = useState('')
  const [image, setImage] = useState<{ mime: string; data: string; url: string } | null>(null)
  const [audio, setAudio] = useState<{ mime: string; data: string } | null>(null)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FitResult | null>(null)
  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const reset = () => {
    setNote(''); setImage(null); setAudio(null); setResult(null); setRecording(false)
  }
  const close = () => { reset(); onClose() }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await blobToBase64(file)
    setImage({ mime: file.type, data, url: URL.createObjectURL(file) })
  }

  async function toggleRecord() {
    if (recording) {
      rec.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunks.current = []
      mr.ondataavailable = (ev) => chunks.current.push(ev.data)
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: mr.mimeType })
        setAudio({ mime: (mr.mimeType || 'audio/webm').split(';')[0], data: await blobToBase64(blob) })
        setRecording(false)
      }
      rec.current = mr
      mr.start()
      setRecording(true)
    } catch {
      notify('Mic access was blocked. Use a photo or a note instead.', 'info')
    }
  }

  async function analyze() {
    if (!image && !audio && note.trim().length < 3) {
      notify('Add a photo, a voice note, or a few words about what you like.', 'info')
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const media: Part[] = []
      if (image) media.push({ inlineData: { mimeType: image.mime, data: image.data } })
      if (audio) media.push({ inlineData: { mimeType: audio.mime, data: audio.data } })
      setResult(await recommendFit(media, note.trim()))
    } catch (e) {
      notify((e as Error).message || 'Could not read that. Try a photo or a note.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const pick = (key: string) => {
    if (careerByKey(key)) {
      dispatch({ type: 'SELECT', key })
      notify('Jumped you into that career.', 'success')
      close()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-console/50 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="card relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Find your fit"
          >
            <button onClick={close} className="absolute right-4 top-4 z-10 text-ink-faint hover:text-ink" aria-label="Close"><X size={18} /></button>

            <div className="border-b border-line p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Compass size={18} /></span>
                <h2 className="font-display text-lg font-bold text-ink">Not sure what fits?</h2>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">Show the AI what you're into — a photo of something you love, a voice note about your hobbies, or a few words. It'll suggest careers that match.</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-canvas/60 p-4 text-center transition-colors hover:border-brand/50">
                  {image ? <img src={image.url} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <ImageUp size={22} className="text-brand" />}
                  <span className="text-xs font-medium text-ink-soft">{image ? 'Change photo' : 'Upload a photo'}</span>
                  <input type="file" accept="image/*" onChange={onImage} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={toggleRecord}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-colors ${
                    recording ? 'border-risk/50 bg-risk-soft/50' : audio ? 'border-go/50 bg-go-soft/40' : 'border-dashed border-line bg-canvas/60 hover:border-brand/50'
                  }`}
                >
                  {recording ? <Square size={22} className="text-risk" /> : <Mic size={22} className={audio ? 'text-go' : 'text-brand'} />}
                  <span className="text-xs font-medium text-ink-soft">{recording ? 'Stop recording' : audio ? 'Voice note ready ✓' : 'Record a voice note'}</span>
                </button>
              </div>

              <div>
                <label htmlFor="fitnote" className="eyebrow">Or just tell it (optional)</label>
                <textarea
                  id="fitnote"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="I love taking things apart, drawing, helping friends fix their problems…"
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </div>

              <button
                type="button"
                onClick={analyze}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {busy ? 'Reading you…' : 'Find my careers'}
              </button>

              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <p className="rounded-xl border border-brand/25 bg-brand-soft/30 p-3 text-sm italic leading-relaxed text-ink">{result.read}</p>
                  {result.recommendations.map((r, i) => {
                    const real = !!careerByKey(r.careerKey)
                    return (
                      <div key={i} className="rounded-2xl border border-line bg-paper p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-base font-semibold text-ink">{r.title}</h3>
                          <span className="font-mono text-sm font-bold text-brand">{r.fit}%</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.why}</p>
                        {real && (
                          <button type="button" onClick={() => pick(r.careerKey)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                            Try this career <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
