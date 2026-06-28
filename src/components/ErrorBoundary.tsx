import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Catches any render-time error so a crash shows a recoverable card instead of
 * a blank white screen — with a one-tap "reset" that clears stale local state. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('FuturePilot caught an error:', error)
  }

  private reload = () => window.location.reload()

  private reset = () => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e1a2b',
          color: '#fff',
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 18px',
              borderRadius: 16,
              background: '#0b1623',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 64 64">
              <circle cx="32" cy="33" r="15.5" fill="none" stroke="#4b47ff" strokeWidth="2.5" strokeOpacity="0.4" />
              <path d="M32 16.5 L40 45 L32 39 L24 45 Z" fill="#4b47ff" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, margin: 0 }}>
            Hit a little turbulence
          </h1>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 15, lineHeight: 1.5, margin: '12px 0 22px' }}>
            Something went wrong on this screen. Reload to keep going — or reset if it keeps happening.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.reload}
              style={{ background: '#4b47ff', color: '#fff', border: 0, borderRadius: 12, padding: '11px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Reload
            </button>
            <button
              onClick={this.reset}
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 12, padding: '11px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Reset & reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
