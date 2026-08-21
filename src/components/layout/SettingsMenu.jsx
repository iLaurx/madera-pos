import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Settings, Trash2 } from 'lucide-react'
import ConfirmDialog from '../inventario/ConfirmDialog'
import ModalPortal from '../ui/ModalPortal'
import ThemeToggle from './ThemeToggle'
import { db } from '../../db/db'
import { cn } from '../../lib/utils'

export default function SettingsMenu() {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [vaciarOpen, setVaciarOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState(null)

  const productCount = useLiveQuery(() => db.productos.count(), [])
  const canVaciar = Boolean(productCount)

  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        closeMenu()
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, closeMenu])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function handleVaciarClick() {
    if (!canVaciar) return
    closeMenu()
    setVaciarOpen(true)
  }

  async function handleVaciarInventario() {
    setProcessing(true)
    try {
      await db.productos.clear()
      setVaciarOpen(false)
      setToast({ tipo: 'exito', texto: 'Inventario vaciado correctamente' })
    } catch {
      setToast({ tipo: 'error', texto: 'No se pudo vaciar el inventario' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-label="Abrir ajustes"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex min-h-14 w-full items-center gap-3 rounded-full border px-4 text-left text-base font-medium transition-colors active:scale-[0.98]',
          open
            ? 'border-[#8A3D1A]/40 bg-cream text-carbon dark:border-[#E5E5E5]/30 dark:bg-[#292524] dark:text-[#E5E5E5]'
            : 'border-[#3D2B20]/18 bg-cream/80 text-carbon hover:border-[#3D2B20]/30 hover:bg-cream dark:border-[#E5E5E5]/12 dark:bg-[#292524]/80 dark:text-[#E5E5E5] dark:hover:border-[#E5E5E5]/22 dark:hover:bg-[#292524]',
        )}
      >
        <Settings className="h-6 w-6 shrink-0" strokeWidth={2} />
        Ajustes
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Ajustes"
          className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-[#D8C9BC] bg-[#FFFFFF] shadow-[0_8px_30px_rgba(38,26,18,0.12)] dark:border-[#3F3A36] dark:bg-[#24211F] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        >
          <div className="border-b border-[#D8C9BC] px-4 py-3 dark:border-[#3F3A36]">
            <p className="text-sm font-bold text-carbon dark:text-[#E5E5E5]">Ajustes</p>
            <p className="text-xs text-carbon/55 dark:text-[#A8A29E]">Configuración de la app</p>
          </div>

          <section className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-carbon/45 dark:text-[#A8A29E]">
              Apariencia
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-carbon dark:text-[#E5E5E5]">Tema</p>
                <p className="text-xs text-carbon/60 dark:text-[#A8A29E]">Claro / Oscuro</p>
              </div>
              <ThemeToggle compact />
            </div>
          </section>

          <section className="border-t border-[#D8C9BC] px-4 py-3 dark:border-[#3F3A36]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600/70 dark:text-red-400/70">
              Zona de peligro
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={handleVaciarClick}
              disabled={!canVaciar}
              className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Vaciar inventario
            </button>
          </section>
        </div>
      )}

      <ModalPortal>
        <ConfirmDialog
          open={vaciarOpen}
          title="Vaciar inventario"
          message="Se eliminarán todos los productos del catálogo. Esta acción no se puede deshacer."
          confirmLabel="Sí, vaciar todo"
          onConfirm={handleVaciarInventario}
          onCancel={() => setVaciarOpen(false)}
          processing={processing}
        />
      </ModalPortal>

      {toast && (
        <ModalPortal>
          <div
            className={cn(
              'fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg',
              toast.tipo === 'exito' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white',
            )}
          >
            {toast.texto}
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
