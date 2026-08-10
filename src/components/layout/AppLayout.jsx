import { useState } from 'react'
import MobileHeader from './MobileHeader'
import Sidebar from './Sidebar'

export default function AppLayout({ activeView, onNavigate, children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function handleNavigate(view) {
    onNavigate(view)
    setIsMenuOpen(false)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream dark:bg-[#1C1917]">
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isMenuOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
