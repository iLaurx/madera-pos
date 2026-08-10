import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { db } from './db/db.js'
import { initTheme } from './lib/theme.js'

initTheme()

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('[PWA] Madera Boutique lista para uso offline.')
  },
  onNeedRefresh() {
    console.info('[PWA] Hay una actualización disponible.')
  },
})

db.open()
  .then(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ErrorBoundary>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ErrorBoundary>
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Error al inicializar IndexedDB:', error)
    createRoot(document.getElementById('root')).render(
      <div className="flex h-screen w-screen items-center justify-center bg-red-50 p-6 text-center">
        <p className="text-lg font-medium text-red-700">
          No se pudo inicializar la base de datos local.
        </p>
      </div>,
    )
  })
