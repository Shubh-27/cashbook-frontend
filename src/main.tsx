import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PWA_NEED_REFRESH_EVENT } from './hooks/usePwaUpdate'

if (import.meta.env.PROD && import.meta.env.MODE === 'web' && !window.electronAPI) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        window.dispatchEvent(new CustomEvent(PWA_NEED_REFRESH_EVENT, { detail: { updateSW } }))
      },
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
