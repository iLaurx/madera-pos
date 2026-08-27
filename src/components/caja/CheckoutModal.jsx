import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Banknote, Search, Smartphone, WalletCards, X } from 'lucide-react'
import { db } from '../../db/db'
import { creditoDisponible, filtrarCreditos, ordenarCreditos, roundMoney } from '../../lib/creditos'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
  { id: 'credito', label: 'A Crédito', sublabel: 'Fiado', icon: WalletCards },
]

const inputClass =
  'w-full rounded-xl border border-[#D8C9BC] bg-white px-4 py-4 text-2xl font-bold text-carbon shadow-sm outline-none ring-brand-500 focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#E5E5E5] dark:ring-[#8C4A32]'

export default function CheckoutModal({ open, total, onConfirm, onClose, processing }) {
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [efectivoRecibido, setEfectivoRecibido] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [creditoId, setCreditoId] = useState(null)

  const creditos = useLiveQuery(() => (open ? db.creditos.toArray() : []), [open])

  useEffect(() => {
    if (!open) return
    setMetodoPago('efectivo')
    setEfectivoRecibido('')
    setBusquedaCliente('')
    setCreditoId(null)
  }, [open])

  const clientesFiltrados = useMemo(
    () => ordenarCreditos(filtrarCreditos(creditos, busquedaCliente)),
    [creditos, busquedaCliente],
  )

  const creditoSeleccionado = useMemo(
    () => (creditos ?? []).find((c) => c.id === creditoId) ?? null,
    [creditos, creditoId],
  )

  if (!open) return null

  const recibido = parseFloat(efectivoRecibido) || 0
  const cambio = metodoPago === 'efectivo' ? Math.max(0, recibido - total) : 0
  const disponible = creditoSeleccionado ? creditoDisponible(creditoSeleccionado) : 0
  const creditoCubre = Boolean(creditoSeleccionado) && total <= disponible + 0.001
  const pagoValido =
    (metodoPago === 'transferencia') ||
    (metodoPago === 'efectivo' && recibido >= total) ||
    (metodoPago === 'credito' && creditoCubre)

  function handleConfirm() {
    if (!pagoValido || processing) return
    onConfirm({
      metodoPago,
      efectivoRecibido: metodoPago === 'efectivo' ? recibido : total,
      cambio,
      creditoId: metodoPago === 'credito' ? creditoSeleccionado.id : undefined,
      clienteNombre: metodoPago === 'credito' ? creditoSeleccionado.clienteNombre : undefined,
    })
  }

  function handleClose() {
    if (processing) return
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

        <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-xl bg-cream p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-xl dark:border dark:border-[#332F2D] dark:bg-[#24211F]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-carbon dark:text-[#E5E5E5]">Cobrar venta</h2>
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

        <div className="mb-6 rounded-xl bg-[#B3542D]/10 p-5 text-center shadow-sm dark:bg-[#8C4A32]/20">
          <p className="text-sm font-medium text-carbon/60 dark:text-[#A8A29E]">Total a cobrar</p>
          <p className="mt-1 text-4xl font-bold text-carbon dark:text-[#E5E5E5]">{formatCurrency(total)}</p>
        </div>

        <p className="mb-3 text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">Método de pago</p>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {METODOS.map(({ id, label, sublabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMetodoPago(id)}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 rounded-full px-1 text-center text-sm font-semibold shadow-sm transition-colors active:scale-[0.98]',
                metodoPago === id
                  ? 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                  : 'bg-[#EDE4DA] text-[#543D2E] hover:bg-[#E2D5C7] dark:bg-[#292524] dark:text-[#A8A29E] dark:hover:bg-[#332F2D]',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="leading-tight">
                {label}
                {sublabel ? (
                  <span className="block text-[11px] font-medium opacity-80">{sublabel}</span>
                ) : null}
              </span>
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
                    : 'bg-[#B3542D]/15 dark:bg-[#8C4A32]/15',
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

        {metodoPago === 'credito' && (
          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8C7A6B] dark:text-[#A8A29E]/60" />
              <input
                type="search"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar cliente a crédito…"
                className="w-full rounded-xl border border-[#D8C9BC] bg-white py-3.5 pl-12 pr-4 text-base text-carbon shadow-sm outline-none ring-[#B3542D] placeholder:text-[#8C7A6B] focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#E5E5E5] dark:ring-[#8C4A32] dark:placeholder:text-[#A8A29E]/60"
              />
            </div>

            {!creditos ? (
              <p className="rounded-xl bg-[#B3542D]/10 p-4 text-center text-sm text-carbon dark:bg-[#292524] dark:text-[#A8A29E]">
                Cargando clientes…
              </p>
            ) : creditos.length === 0 ? (
              <p className="rounded-xl bg-[#B3542D]/10 p-4 text-center text-sm text-carbon dark:bg-[#292524] dark:text-[#A8A29E]">
                No hay clientes con línea de crédito. Regístralos en el módulo Créditos.
              </p>
            ) : clientesFiltrados.length === 0 ? (
              <p className="rounded-xl bg-[#B3542D]/10 p-4 text-center text-sm text-carbon dark:bg-[#292524] dark:text-[#A8A29E]">
                Ningún cliente coincide con la búsqueda.
              </p>
            ) : (
              <ul className="max-h-52 space-y-2 overflow-y-auto">
                {clientesFiltrados.map((credito) => {
                  const disponibleCliente = creditoDisponible(credito)
                  const seleccionado = credito.id === creditoId
                  const cubre = total <= disponibleCliente + 0.001

                  return (
                    <li key={credito.id}>
                      <button
                        type="button"
                        onClick={() => setCreditoId(credito.id)}
                        className={cn(
                          'flex w-full min-h-14 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left shadow-sm transition-colors active:scale-[0.99]',
                          seleccionado
                            ? 'bg-[#B3542D] text-white dark:bg-[#8C4A32]'
                            : 'bg-[#EDE4DA] text-[#543D2E] hover:bg-[#E2D5C7] dark:bg-[#292524] dark:text-[#E5E5E5] dark:hover:bg-[#332F2D]',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{credito.clienteNombre}</span>
                          <span className={cn('block text-xs', seleccionado ? 'opacity-80' : 'text-carbon/60 dark:text-[#A8A29E]')}>
                            Disponible {formatCurrency(Math.max(0, disponibleCliente))}
                            {!cubre ? ' · límite insuficiente' : ''}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold">
                          {formatCurrency(roundMoney(credito.saldoActual))}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {creditoSeleccionado && !creditoCubre && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                El crédito disponible ({formatCurrency(Math.max(0, disponible))}) no cubre esta venta.
              </p>
            )}

            {creditoSeleccionado && creditoCubre && (
              <p className="rounded-xl bg-brand-50 p-4 text-center text-sm text-carbon shadow-sm dark:bg-[#292524] dark:text-[#A8A29E]">
                Se cargarán {formatCurrency(total)} a la cuenta de {creditoSeleccionado.clienteNombre}.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={!pagoValido || processing}
          onClick={handleConfirm}
          className={cn(
            'flex w-full min-h-16 items-center justify-center rounded-full text-lg font-bold shadow-md transition-colors active:scale-[0.98]',
            pagoValido && !processing
              ? 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
              : 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40',
          )}
        >
          {processing ? 'Procesando…' : `Confirmar cobro (${formatCurrency(total)})`}
        </button>
        </div>
      </div>
    </ModalPortal>
  )
}
