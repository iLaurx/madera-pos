import { useState } from 'react'
import { Banknote, Smartphone, X } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
]

const inputClass =
  'w-full rounded-xl border-0 bg-cream px-4 py-4 text-2xl font-bold text-carbon shadow-sm outline-none ring-brand-500 focus:ring-2 dark:bg-[#292524] dark:text-[#E5E5E5] dark:ring-[#8C4A32]'

export default function CheckoutModal({ open, total, onConfirm, onClose, processing }) {
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [efectivoRecibido, setEfectivoRecibido] = useState('')

  if (!open) return null

  const recibido = parseFloat(efectivoRecibido) || 0
  const cambio = metodoPago === 'efectivo' ? Math.max(0, recibido - total) : 0
  const pagoValido =
    metodoPago === 'transferencia' || (metodoPago === 'efectivo' && recibido >= total)

  function handleConfirm() {
    if (!pagoValido || processing) return
    onConfirm({
      metodoPago,
      efectivoRecibido: metodoPago === 'efectivo' ? recibido : total,
      cambio,
    })
  }

  function handleClose() {
    if (processing) return
    setMetodoPago('efectivo')
    setEfectivoRecibido('')
    onClose()
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
          aria-label="Cerrar modal de cobro"
        />

        <div className="relative z-10 w-full max-w-md rounded-t-xl bg-cream p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-xl dark:border dark:border-[#332F2D] dark:bg-[#24211F]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-carbon dark:text-[#E5E5E5]">Cobrar venta</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#D48C70]/15 active:scale-95 dark:hover:bg-[#8C4A32]/20"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 rounded-xl bg-[#D48C70]/10 p-5 text-center shadow-sm dark:bg-[#8C4A32]/20">
          <p className="text-sm font-medium text-carbon/60 dark:text-[#A8A29E]">Total a cobrar</p>
          <p className="mt-1 text-4xl font-bold text-carbon dark:text-[#E5E5E5]">{formatCurrency(total)}</p>
        </div>

        <p className="mb-3 text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">Método de pago</p>
        <div className="mb-6 grid grid-cols-2 gap-3">
          {METODOS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMetodoPago(id)}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-full text-base font-semibold shadow-sm transition-colors active:scale-[0.98]',
                metodoPago === id
                  ? 'bg-[#D48C70] text-white hover:bg-[#C27A5F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                  : 'bg-[#FDF6F0] text-[#333333] hover:bg-[#F5EBE3] dark:bg-[#292524] dark:text-[#A8A29E] dark:hover:bg-[#332F2D]',
              )}
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ))}
        </div>

        {metodoPago === 'efectivo' && (
          <div className="mb-6 space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">
                Efectivo recibido
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </label>

            {recibido > 0 && (
              <div
                className={cn(
                  'rounded-xl p-4 text-center',
                  recibido >= total
                    ? 'bg-brand-100 dark:bg-[#292524]'
                    : 'bg-[#D48C70]/15 dark:bg-[#8C4A32]/15',
                )}
              >
                <p className="text-sm font-medium text-carbon/70 dark:text-[#A8A29E]">Cambio</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    recibido >= total
                      ? 'text-brand-700 dark:text-[#E5E5E5]'
                      : 'text-carbon/60 dark:text-[#A8A29E]',
                  )}
                >
                  {recibido >= total ? formatCurrency(cambio) : 'Insuficiente'}
                </p>
              </div>
            )}
          </div>
        )}

        {metodoPago === 'transferencia' && (
          <p className="mb-6 rounded-xl bg-brand-50 p-4 text-center text-sm text-carbon shadow-sm dark:bg-[#292524] dark:text-[#A8A29E]">
            Confirma que la transferencia fue recibida antes de finalizar.
          </p>
        )}

        <button
          type="button"
          disabled={!pagoValido || processing}
          onClick={handleConfirm}
          className={cn(
            'flex w-full min-h-16 items-center justify-center rounded-full text-lg font-bold shadow-md transition-colors active:scale-[0.98]',
            pagoValido && !processing
              ? 'bg-[#D48C70] text-white hover:bg-[#C27A5F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
              : 'cursor-not-allowed bg-carbon/10 text-carbon/40 dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40',
          )}
        >
          {processing ? 'Procesando…' : `Confirmar cobro (${formatCurrency(total)})`}
        </button>
        </div>
      </div>
    </ModalPortal>
  )
}
