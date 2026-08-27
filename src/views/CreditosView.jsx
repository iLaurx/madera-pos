import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, WalletCards } from 'lucide-react'
import AltaClienteModal from '../components/creditos/AltaClienteModal'
import AbonoModal from '../components/creditos/AbonoModal'
import DetalleClienteModal from '../components/creditos/DetalleClienteModal'
import { db } from '../db/db'
import {
  creditoDisponible,
  estatusCredito,
  etiquetaEstatus,
  filtrarCreditos,
  ordenarCreditos,
  registrarAbonoCredito,
  roundMoney,
} from '../lib/creditos'
import { formatCurrency } from '../lib/format'
import { cn } from '../lib/utils'

export default function CreditosView() {
  const creditos = useLiveQuery(() => db.creditos.toArray(), [])
  const [busqueda, setBusqueda] = useState('')
  const [altaOpen, setAltaOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [detalleId, setDetalleId] = useState(null)
  const [abonoId, setAbonoId] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const lista = useMemo(
    () => ordenarCreditos(filtrarCreditos(creditos, busqueda)),
    [creditos, busqueda],
  )

  const detalle = useMemo(
    () => (creditos ?? []).find((c) => c.id === detalleId) ?? null,
    [creditos, detalleId],
  )

  const creditoAbono = useMemo(
    () => (creditos ?? []).find((c) => c.id === abonoId) ?? null,
    [creditos, abonoId],
  )

  const totales = useMemo(() => {
    const todos = creditos ?? []
    return {
      clientes: todos.length,
      porCobrar: roundMoney(todos.reduce((sum, c) => sum + Math.max(0, Number(c.saldoActual) || 0), 0)),
      conAdeudo: todos.filter((c) => estatusCredito(c) === 'con_adeudo').length,
    }
  }, [creditos])

  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3500)
  }

  async function handleGuardarCliente(datos) {
    setProcessing(true)
    try {
      if (editando?.id != null) {
        await db.creditos.update(editando.id, {
          clienteNombre: datos.clienteNombre,
          telefono: datos.telefono,
          limiteCredito: datos.limiteCredito,
        })
        setAltaOpen(false)
        setEditando(null)
        mostrarMensaje('exito', 'Cliente actualizado')
        return
      }

      await db.creditos.add({
        clienteNombre: datos.clienteNombre,
        telefono: datos.telefono,
        limiteCredito: datos.limiteCredito,
        saldoActual: 0,
        fechaCreacion: new Date(),
        historialMovimientos: [],
      })
      setAltaOpen(false)
      mostrarMensaje('exito', 'Cliente registrado con línea de crédito')
    } catch (error) {
      mostrarMensaje('error', error.message || 'No se pudo guardar el cliente')
      throw error
    } finally {
      setProcessing(false)
    }
  }

  async function handleAbono({ monto, metodoPago }) {
    if (!creditoAbono?.id) return
    setProcessing(true)
    try {
      await registrarAbonoCredito({
        creditoId: creditoAbono.id,
        monto,
        metodoPago,
        fecha: new Date(),
      })
      setAbonoId(null)
      mostrarMensaje('exito', `Abono de ${formatCurrency(monto)} registrado`)
    } catch (error) {
      mostrarMensaje('error', error.message || 'No se pudo registrar el abono')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-cream shadow-md dark:bg-[#1C1917]">
      <header className="view-header flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-4 shadow-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-[#B3542D] shadow-sm dark:bg-[#292524]/90 dark:text-[#8C4A32]">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-carbon dark:text-[#E5E5E5] md:text-xl">Créditos</h2>
            <p className="text-xs text-carbon/70 dark:text-[#A8A29E] md:text-sm">
              {creditos
                ? `${totales.clientes} cliente(s) · ${totales.conAdeudo} con adeudo · ${formatCurrency(totales.porCobrar)} por cobrar`
                : 'Cargando…'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditando(null)
            setAltaOpen(true)
          }}
          className="btn-primary flex min-h-11 items-center gap-2 px-5 text-sm"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </header>

      {mensaje && (
        <div
          className={`shrink-0 px-4 py-2 text-center text-sm font-medium ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="shrink-0 bg-cream px-4 py-3 shadow-sm dark:bg-[#1C1917]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8C7A6B] dark:text-[#A8A29E]/60" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full rounded-xl border border-[#D8C9BC] bg-white py-3.5 pl-12 pr-4 text-base text-[#261A12] shadow-sm outline-none ring-[#B3542D] placeholder:text-[#8C7A6B] focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#A8A29E] dark:ring-[#8C4A32] dark:placeholder:text-[#A8A29E]/60"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-5 [-webkit-overflow-scrolling:touch]">
        {!creditos ? (
          <p className="py-10 text-center text-carbon/60 dark:text-[#A8A29E]">Cargando clientes…</p>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <WalletCards className="mb-3 h-10 w-10 text-[#B3542D] dark:text-[#8C4A32]" />
            <p className="text-lg font-medium text-carbon dark:text-[#E5E5E5]">
              {busqueda.trim() ? 'Sin resultados' : 'Aún no hay clientes a crédito'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-carbon/60 dark:text-[#A8A29E]">
              {busqueda.trim()
                ? 'Prueba con otro nombre o teléfono.'
                : 'Registra un cliente con línea de crédito para vender fiado desde Caja.'}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((credito) => {
              const estatus = estatusCredito(credito)
              const alCorriente = estatus === 'al_corriente'
              const saldo = roundMoney(credito.saldoActual)
              const disponible = creditoDisponible(credito)

              return (
                <li key={credito.id}>
                  <button
                    type="button"
                    onClick={() => setDetalleId(credito.id)}
                    className="flex w-full min-h-[7.5rem] flex-col rounded-xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#B3542D]/10 active:scale-[0.99] dark:border dark:border-[#332F2D] dark:bg-[#24211F] dark:hover:bg-[#8C4A32]/20"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-carbon dark:text-[#E5E5E5]">
                          {credito.clienteNombre}
                        </p>
                        {credito.telefono ? (
                          <p className="truncate text-sm text-carbon/60 dark:text-[#A8A29E]">{credito.telefono}</p>
                        ) : (
                          <p className="text-sm text-carbon/40 dark:text-[#A8A29E]/50">Sin teléfono</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                          alCorriente
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-[#B3542D]/15 text-[#B3542D] dark:bg-[#8C4A32]/30 dark:text-[#E5E5E5]',
                        )}
                      >
                        {etiquetaEstatus(estatus)}
                      </span>
                    </div>

                    <div className="mt-auto grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[11px] text-carbon/50 dark:text-[#A8A29E]">Límite</p>
                        <p className="text-sm font-semibold text-carbon dark:text-[#E5E5E5]">
                          {formatCurrency(credito.limiteCredito)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-carbon/50 dark:text-[#A8A29E]">Debe</p>
                        <p className="text-sm font-bold text-[#B3542D] dark:text-[#E5E5E5]">
                          {formatCurrency(Math.max(0, saldo))}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-carbon/50 dark:text-[#A8A29E]">Disponible</p>
                        <p className="text-sm font-semibold text-carbon dark:text-[#E5E5E5]">
                          {formatCurrency(Math.max(0, disponible))}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <AltaClienteModal
        open={altaOpen}
        credito={editando}
        processing={processing}
        onClose={() => {
          if (processing) return
          setAltaOpen(false)
          setEditando(null)
        }}
        onSave={handleGuardarCliente}
      />

      <DetalleClienteModal
        open={Boolean(detalle)}
        credito={detalle}
        processing={processing}
        onClose={() => setDetalleId(null)}
        onAbonar={() => {
          if (!detalle?.id) return
          setAbonoId(detalle.id)
        }}
        onEditar={() => {
          if (!detalle) return
          setEditando(detalle)
          setAltaOpen(true)
        }}
      />

      <AbonoModal
        open={Boolean(creditoAbono)}
        credito={creditoAbono}
        processing={processing}
        onClose={() => {
          if (processing) return
          setAbonoId(null)
        }}
        onConfirm={handleAbono}
      />
    </section>
  )
}
