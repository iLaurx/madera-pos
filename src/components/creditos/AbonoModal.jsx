import { useEffect, useState } from 'react'
import { Banknote, Smartphone, X } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
]

const inputClass =
  'w-full rounded-xl border border-[#D8C9BC] bg-white px-4 py-4 text-2xl font-bold text-carbon shadow-sm outline-none ring-[#B3542D] focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#E5E5E5] dark:ring-[#8C4A32]'

export default function AbonoModal({ open, credito, onClose, onConfirm, processing }) {
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [monto, setMonto] = useState('')

  useEffect(() => {
    if (!open) return
    setMetodoPago('efectivo')
    setMonto('')
  }, [open, credito?.id])

  if (!open || !credito) return null

  const saldo = Number(credito.saldoActual) || 0
  const abono = parseFloat(monto) || 0
  const valido = abono > 0 && abono <= saldo + 0.001

  function handleClose() {
    if (processing) return
    onClose()
  }

  function handleConfirm() {
    if (!valido || processing) return
    onConfirm({ monto: abono, metodoPago })
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
          aria-label="Cerrar abono"
        />

        <div className="relative z-10 w-full max-w-md rounded-t-xl bg-cream p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-xl dark:border dark:border-[#332F2D] dark:bg-[#24211F]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-carbon dark:text-[#E5E5E5]">Abonar / Pagar</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#B3542D]/15 active:scale-95 dark:hover:bg-[#8C4A32]/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="mb-1 text-sm text-carbon/70 dark:text-[#A8A29E]">{credito.clienteNombre}</p>
          <div className="mb-6 rounded-xl bg-[#B3542D]/10 p-4 text-center shadow-sm dark:bg-[#8C4A32]/20">
            <p className="text-sm font-medium text-carbon/60 dark:text-[#A8A29E]">Saldo actual</p>
            <p className="mt-1 text-3xl font-bold text-carbon dark:text-[#E5E5E5]">{formatCurrency(saldo)}</p>
          </div>

          <p className="mb-3 text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">Método de pago</p>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMetodoPago(id)}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-full text-base font-semibold shadow-sm transition-colors active:scale-[0.98]',
                  metodoPago === id
                    ? 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                    : 'bg-[#EDE4DA] text-[#543D2E] hover:bg-[#E2D5C7] dark:bg-[#292524] dark:text-[#A8A29E] dark:hover:bg-[#332F2D]',
                )}
              >
                <Icon className="h-6 w-6" />
                {label}
              </button>
            ))}
          </div>

          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">
              Monto del abono
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              max={saldo}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
            {abono > saldo + 0.001 && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">No puede ser mayor al saldo.</p>
            )}
            <button
              type="button"
              onClick={() => setMonto(String(saldo))}
              className="mt-2 text-sm font-semibold text-[#B3542D] hover:underline dark:text-[#E5E5E5]"
            >
              Liquidar saldo completo
            </button>
          </label>

          <button
            type="button"
            disabled={!valido || processing}
            onClick={handleConfirm}
            className={cn(
              'flex w-full min-h-14 items-center justify-center rounded-full text-lg font-bold shadow-md transition-colors active:scale-[0.98]',
              valido && !processing
                ? 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                : 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40',
            )}
          >
            {processing ? 'Registrando…' : `Registrar abono (${formatCurrency(abono || 0)})`}
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}
