import { Banknote, Pencil, WalletCards, X } from 'lucide-react'
import { formatFecha, formatHora } from '../../lib/date'
import { formatCurrency } from '../../lib/format'
import {
  creditoDisponible,
  estatusCredito,
  etiquetaEstatus,
  roundMoney,
} from '../../lib/creditos'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

function etiquetaMovimiento(movimiento) {
  if (movimiento.tipo === 'cargo') return 'Cargo'
  if (movimiento.tipo === 'abono') return 'Abono'
  if (movimiento.tipo === 'devolucion') return 'Devolución'
  return movimiento.tipo
}

function etiquetaMetodo(metodo) {
  if (metodo === 'efectivo') return 'Efectivo'
  if (metodo === 'transferencia') return 'Transferencia'
  return ''
}

export default function DetalleClienteModal({
  open,
  credito,
  onClose,
  onAbonar,
  onEditar,
  processing,
}) {
  if (!open || !credito) return null

  const historial = [...(credito.historialMovimientos ?? [])].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  )
  const estatus = estatusCredito(credito)
  const alCorriente = estatus === 'al_corriente'
  const saldo = roundMoney(credito.saldoActual)
  const disponible = creditoDisponible(credito)

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-label="Cerrar estado de cuenta"
        />

        <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-xl bg-cream shadow-2xl sm:rounded-xl dark:border dark:border-[#332F2D] dark:bg-[#24211F]">
          <div className="flex shrink-0 items-start justify-between gap-3 p-5 pb-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-carbon/50 dark:text-[#A8A29E]">
                Estado de cuenta
              </p>
              <h2 className="mt-0.5 truncate text-xl font-bold text-carbon dark:text-[#E5E5E5]">
                {credito.clienteNombre}
              </h2>
              {credito.telefono ? (
                <p className="mt-0.5 text-sm text-carbon/70 dark:text-[#A8A29E]">{credito.telefono}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#B3542D]/15 active:scale-95 dark:hover:bg-[#8C4A32]/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="shrink-0 space-y-3 px-5 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                  alCorriente
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-[#B3542D]/15 text-[#B3542D] dark:bg-[#8C4A32]/30 dark:text-[#E5E5E5]',
                )}
              >
                {etiquetaEstatus(estatus)}
              </span>
              {saldo < 0 && (
                <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-[#292524] dark:text-[#A8A29E]">
                  Saldo a favor
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#B3542D]/10 p-3 text-center dark:bg-[#8C4A32]/20">
                <p className="text-[11px] font-medium text-carbon/60 dark:text-[#A8A29E]">Límite</p>
                <p className="mt-1 text-sm font-bold text-carbon dark:text-[#E5E5E5]">
                  {formatCurrency(credito.limiteCredito)}
                </p>
              </div>
              <div className="rounded-xl bg-[#B3542D]/10 p-3 text-center dark:bg-[#8C4A32]/20">
                <p className="text-[11px] font-medium text-carbon/60 dark:text-[#A8A29E]">Saldo</p>
                <p className="mt-1 text-sm font-bold text-carbon dark:text-[#E5E5E5]">
                  {formatCurrency(Math.max(0, saldo))}
                </p>
              </div>
              <div className="rounded-xl bg-[#B3542D]/10 p-3 text-center dark:bg-[#8C4A32]/20">
                <p className="text-[11px] font-medium text-carbon/60 dark:text-[#A8A29E]">Disponible</p>
                <p className="mt-1 text-sm font-bold text-carbon dark:text-[#E5E5E5]">
                  {formatCurrency(Math.max(0, disponible))}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAbonar}
                disabled={processing || saldo <= 0}
                className={cn(
                  'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold shadow-sm active:scale-[0.98]',
                  saldo > 0 && !processing
                    ? 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                    : 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40',
                )}
              >
                <Banknote className="h-4 w-4" />
                Abonar / Pagar
              </button>
              <button
                type="button"
                onClick={onEditar}
                disabled={processing}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-[#B3542D]/15 text-[#B3542D] shadow-sm active:scale-[0.98] dark:bg-[#292524] dark:text-[#E5E5E5]"
                aria-label="Editar cliente"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="mb-2 text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">
              Historial de movimientos
            </h3>

            {historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-[#B3542D]/10 px-4 py-8 text-center dark:bg-[#292524]">
                <WalletCards className="mb-2 h-8 w-8 text-[#B3542D] dark:text-[#8C4A32]" />
                <p className="text-sm font-medium text-carbon dark:text-[#E5E5E5]">Sin movimientos</p>
                <p className="mt-1 text-xs text-carbon/60 dark:text-[#A8A29E]">
                  Las ventas a crédito y los abonos aparecerán aquí.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {historial.map((movimiento) => {
                  const esCargo = movimiento.tipo === 'cargo'

                  return (
                    <li
                      key={movimiento.id}
                      className="rounded-xl bg-white px-4 py-3 shadow-sm dark:border dark:border-[#332F2D] dark:bg-[#1C1917]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-carbon dark:text-[#E5E5E5]">
                            {etiquetaMovimiento(movimiento)}
                            {movimiento.metodoPago ? ` · ${etiquetaMetodo(movimiento.metodoPago)}` : ''}
                          </p>
                          {movimiento.descripcion ? (
                            <p className="mt-0.5 truncate text-xs text-carbon/60 dark:text-[#A8A29E]">
                              {movimiento.descripcion}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-carbon/50 dark:text-[#A8A29E]/80">
                            {formatFecha(movimiento.fecha)} · {formatHora(movimiento.fecha)}
                          </p>
                        </div>
                        <p
                          className={cn(
                            'shrink-0 text-base font-bold',
                            esCargo
                              ? 'text-[#B3542D] dark:text-[#C45C3A]'
                              : 'text-emerald-700 dark:text-emerald-300',
                          )}
                        >
                          {esCargo ? '+' : '−'}
                          {formatCurrency(movimiento.monto)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
