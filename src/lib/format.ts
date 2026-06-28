export function usd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n))
}

/** Compact money, e.g. $112.6k, $1.2M — for tight UI like chart axes. */
export function usdCompact(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export function pct(n: number, withSign = false): string {
  const sign = withSign && n > 0 ? '+' : ''
  return `${sign}${n}%`
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n))
}

/** Linear blend between a and b by t in [0,1]. */
export function blend(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
