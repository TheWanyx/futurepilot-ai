import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TrialProvider } from './state/trial'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrialProvider defaultKey="data-analyst">
      <App />
    </TrialProvider>
  </StrictMode>,
)
