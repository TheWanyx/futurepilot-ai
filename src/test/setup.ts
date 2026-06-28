import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom doesn't implement these browser APIs that the UI (and framer-motion) touch.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    // Run animation-free in tests so transitions settle synchronously.
    matches: /prefers-reduced-motion/.test(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

Element.prototype.scrollIntoView = vi.fn()

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (RO as unknown as typeof ResizeObserver)
globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ?? (RO as unknown as typeof IntersectionObserver)
