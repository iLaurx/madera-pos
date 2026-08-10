import { ShoppingCart, Package, BarChart3, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { id: 'caja', label: 'Caja', icon: ShoppingCart },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
]

export default function Sidebar({ activeView, onNavigate, isMenuOpen, onClose }) {
  return (
    <aside
      className={cn(
        'wood-texture fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-64 flex-col shadow-md transition-transform duration-300 ease-out',
        'md:static md:z-auto md:translate-x-0 md:transition-none',
        isMenuOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex items-start justify-between px-5 py-5 md:py-6">
        <div className="min-w-0 flex-1 pr-2">
          <img
            src="/logo.png"
            alt="Madera Boutique"
            className="h-12 w-auto max-w-full object-contain object-left"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream/80 text-carbon shadow-sm hover:bg-cream active:scale-95 dark:bg-[#292524]/80 dark:text-[#E5E5E5] dark:hover:bg-[#292524] md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn(
                'flex min-h-14 items-center gap-3 rounded-full px-4 text-left text-base font-medium transition-colors active:scale-[0.98]',
                isActive
                  ? 'bg-[#D48C70] text-white shadow-md hover:bg-[#C27A5F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                  : 'text-[#333333]/80 hover:bg-cream/50 dark:text-[#E5E5E5]/80 dark:hover:bg-[#292524]/60',
              )}
            >
              <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="hidden shrink-0 border-t border-[#333333]/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-[#E5E5E5]/10 md:block">
        <ThemeToggle />
      </div>
    </aside>
  )
}
