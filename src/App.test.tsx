import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import App from './App'
import { TrialProvider } from './state/trial'

function renderApp() {
  return render(
    <TrialProvider defaultKey="data-analyst">
      <App />
    </TrialProvider>,
  )
}

describe('FuturePilot App (smoke)', () => {
  beforeEach(() => localStorage.clear())

  it('boots straight into a working trial for the default career', () => {
    renderApp()
    // brand + default career, no landing page
    expect(screen.getAllByText(/FuturePilot/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Data Analyst').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Run the 20-minute trial/i })).toBeInTheDocument()
  })

  it('navigates to the simulation with a live + quick mode toggle', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('tab', { name: /Simulate/i }))
    // defaults to the live AI shadow shift
    expect(await screen.findByText(/Shadow a real shift/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quick shift/i })).toBeInTheDocument()
    // switching to the offline scripted mode shows the scripted shift
    fireEvent.click(screen.getByRole('button', { name: /Quick shift/i }))
    expect(await screen.findByText(/Play a real shift/i)).toBeInTheDocument()
  })

  it('switches careers from the sidebar', () => {
    renderApp()
    const sidebars = screen.getAllByRole('button', { name: /Software Developer/i })
    fireEvent.click(sidebars[0])
    expect(screen.getAllByText('Software Developer').length).toBeGreaterThan(0)
  })

  it('reaches the Reality Score verdict with a download action', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('tab', { name: /Verdict/i }))
    expect(await screen.findByText(/Your Reality Score/i)).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /Download career report/i })
    expect(btn).toBeInTheDocument()
    // verdict reason text is present
    expect(within(document.body).getAllByText(/Reality Score/i).length).toBeGreaterThan(0)
  })
})
