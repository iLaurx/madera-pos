import { useState } from 'react'
import { Printer, Wallet } from 'lucide-react'
import { cn } from '../../lib/utils'
import { connectPrinter, openCashDrawer, usePrinterStatus } from '../../utils/printer'

export default function PrinterStatusButton({ onError }) {
  const { connected, connecting, supported, deviceName } = usePrinterStatus()
  const [openingDrawer, setOpeningDrawer] = useState(false)

  if (!supported) return null

  async function handleClick() {
    if (connected || connecting) return

    const result = await connectPrinter()
    if (!result.success && result.error !== 'No se seleccionó ninguna impresora') {
      onError?.(result.error)
    }
  }

  async function handleOpenDrawer() {
    if (openingDrawer || connecting) return

    setOpeningDrawer(true)
    try {
      const result = await openCashDrawer()
      if (!result.success && result.error !== 'No se seleccionó ninguna impresora') {
        onError?.(result.error || 'No se pudo abrir el cajón')
      }
    } catch (error) {
      console.error('openCashDrawer:', error)
      onError?.(error?.message || 'No se pudo abrir el cajón')
    } finally {
      setOpeningDrawer(false)
    }
  }

  const label = connecting
    ? 'Conectando…'
    : connected
      ? 'Impresora Conectada'
      : 'Conectar Impresora'

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={connected || connecting}
        title={deviceName ? `${label}: ${deviceName}` : label}
        aria-live="polite"
        className={cn(
          'flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm transition-colors',
          connected
            ? 'cursor-default bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : connecting
              ? 'cursor-wait bg-cream/90 text-carbon/70 dark:bg-[#292524]/90 dark:text-[#A8A29E]'
              : 'bg-cream/90 text-carbon hover:bg-cream active:scale-[0.98] dark:bg-[#292524]/90 dark:text-[#E5E5E5] dark:hover:bg-[#292524]',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            connected ? 'bg-emerald-500' : connecting ? 'bg-amber-400' : 'bg-carbon/30 dark:bg-[#A8A29E]/50',
          )}
        />
        <Printer className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span className="whitespace-nowrap">{label}</span>
      </button>

      <button
        type="button"
        onClick={handleOpenDrawer}
        disabled={openingDrawer || connecting}
        title="Abrir cajón de dinero"
        className={cn(
          'flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm transition-colors',
          'bg-cream/90 text-carbon hover:bg-cream active:scale-[0.98] dark:bg-[#292524]/90 dark:text-[#E5E5E5] dark:hover:bg-[#292524]',
          (openingDrawer || connecting) && 'cursor-wait opacity-70',
        )}
      >
        <Wallet className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span className="whitespace-nowrap">{openingDrawer ? 'Abriendo…' : 'Abrir Caja'}</span>
      </button>
    </div>
  )
}
