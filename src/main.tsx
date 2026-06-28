import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TrialProvider } from './state/trial'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TrialProvider defaultKey="data-analyst">
        <App />
      </TrialProvider>
    </ErrorBoundary>
  </StrictMode>,
)
