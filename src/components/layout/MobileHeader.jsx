import { Menu } from 'lucide-react'

export default function MobileHeader({ isMenuOpen, onOpenMenu }) {
  return (
    <header className="wood-texture-horizontal fixed inset-x-0 top-0 z-30 flex h-14 shrink-0 items-center gap-2 px-3 pt-[env(safe-area-inset-top,0px)] shadow-md">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        aria-expanded={isMenuOpen}
        aria-controls="navigation-sidebar"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/80 text-carbon shadow-sm transition-colors active:scale-95 dark:bg-[#292524]/80 dark:text-[#E5E5E5]"
      >
        <Menu className="h-6 w-6" strokeWidth={2.25} />
      </button>

      <span className="min-w-0 flex-1 truncate text-center text-base font-bold tracking-tight text-carbon dark:text-[#E5E5E5]">
        Madera Boutique
      </span>

      <div className="h-11 w-11 shrink-0" aria-hidden="true" />
    </header>
  )
}
