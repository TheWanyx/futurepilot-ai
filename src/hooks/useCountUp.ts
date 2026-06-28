import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Animate a number from 0 to `target` with an ease-out, honoring reduced motion. */
export function useCountUp(target: number, durationMs = 900): number {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? target : 0)
  const frame = useRef(0)
  const start = useRef(0)

  useEffect(() => {
    if (reduce) {
      setValue(target)
      return
    }
    const tick = (t: number) => {
      if (!start.current) start.current = t
      const p = Math.min(1, (t - start.current) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(target * eased)
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    start.current = 0
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, durationMs, reduce])

  return value
}
