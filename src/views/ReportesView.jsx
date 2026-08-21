import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart3, FileSpreadsheet, Moon, Printer } from 'lucide-react'
import ConfirmDialog from '../components/inventario/ConfirmDialog'
import BackupRestorePanel from '../components/reportes/BackupRestorePanel'
import DailySummary from '../components/reportes/DailySummary'
import DateFilterBar from '../components/reportes/DateFilterBar'
import SalesHistoryTable from '../components/reportes/SalesHistoryTable'
import SnapshotsPanel from '../components/reportes/SnapshotsPanel'
import { exportarRespaldoJSON } from '../lib/backupDb'
import {
  addCalendarDays,
  formatFecha,
  isSameDay,
  parseLocalISODate,
  toLocalISODate,
} from '../lib/date'
import { exportVentasDelDiaToExcel, exportVentasToExcel } from '../lib/exportVentas'
import { crearSnapshot } from '../lib/snapshots'
import { cn } from '../lib/utils'
import { db } from '../db/db'
import { connectPrinter, isPrinterConnected, printReceipt, sendDailyCloseReceipt } from '../utils/printer'

function calcularResumen(ventas) {
  return ventas.reduce(
    (acc, venta) => {
      acc.totalHoy += venta.total ?? 0

      const unidades = (venta.items ?? []).reduce(
        (sum, item) => sum + (item.cantidad ?? 0),
        0,
      )
      acc.unidadesHoy += unidades

      if (venta.metodoPago === 'efectivo') {
        acc.efectivoHoy += venta.total ?? 0
      } else if (venta.metodoPago === 'transferencia') {
        acc.transferenciaHoy += venta.total ?? 0
      }

      return acc
    },
    { totalHoy: 0, unidadesHoy: 0, efectivoHoy: 0, transferenciaHoy: 0 },
  )
}

export default function ReportesView() {
  const ventas = useLiveQuery(() => db.ventas.orderBy('fecha').reverse().toArray(), [])
  const [mensaje, setMensaje] = useState(null)
  const [cerrandoDia, setCerrandoDia] = useState(false)
  const [imprimiendoCorte, setImprimiendoCorte] = useState(false)
  const [reimprimiendoId, setReimprimiendoId] = useState(null)
  const [ventaADevolver, setVentaADevolver] = useState(null)
  const [devolviendoId, setDevolviendoId] = useState(null)
  const [fechaFiltro, setFechaFiltro] = useState(() => toLocalISODate(new Date()))

  const fechaHoy = toLocalISODate(new Date())
  const fechaAyer = toLocalISODate(addCalendarDays(new Date(), -1))

  const ventasHoy = useMemo(
    () => (ventas ?? []).filter((venta) => isSameDay(venta.fecha)),
    [ventas],
  )

  const ventasFiltradas = useMemo(() => {
    if (!ventas) return null
    if (fechaFiltro == null) return ventas
    return ventas.filter((venta) => toLocalISODate(venta.fecha) === fechaFiltro)
  }, [ventas, fechaFiltro])

  const resumen = useMemo(
    () => calcularResumen(ventasFiltradas ?? []),
    [ventasFiltradas],
  )

  const esHoy = fechaFiltro === fechaHoy
  const etiquetaPeriodo = esHoy ? 'hoy' : 'en el periodo'
  const tituloResumen =
    fechaFiltro == null
      ? 'Resumen del periodo'
      : esHoy
        ? 'Resumen del día'
        : `Resumen del día · ${formatFecha(parseLocalISODate(fechaFiltro))}`

  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 4500)
  }

  async function handleConfirmarDevolucion() {
    const venta = ventaADevolver
    if (!venta?.id || devolviendoId != null) return

    setDevolviendoId(venta.id)

    try {
      await db.transaction('rw', db.productos, db.ventas, async () => {
        const items = Array.isArray(venta.items) ? venta.items : []
        const cantidadPorProducto = items.reduce((acc, item) => {
          const productoId = Number(item.productoId)
          const cantidad = Number(item.cantidad) || 0
          if (!productoId || cantidad <= 0) return acc
          acc[productoId] = (acc[productoId] ?? 0) + cantidad
          return acc
        }, {})

        for (const [productoId, cantidad] of Object.entries(cantidadPorProducto)) {
          const id = Number(productoId)
          const producto = await db.productos.get(id)
          if (!producto) continue
          await db.productos.update(id, {
            existencia: (producto.existencia ?? 0) + cantidad,
          })
        }

        await db.ventas.delete(venta.id)
      })

      setVentaADevolver(null)
      mostrarMensaje('exito', 'Devolución procesada y stock actualizado')
    } catch (error) {
      mostrarMensaje('error', error.message || 'No se pudo procesar la devolución')
    } finally {
      setDevolviendoId(null)
    }
  }

  async function handleReimprimir(venta) {
    if (!venta || reimprimiendoId != null) return

    setReimprimiendoId(venta.id)

    try {
      const printResult = await printReceipt({
        id: venta.id,
        fecha: venta.fecha,
        total: venta.total,
        metodoPago: venta.metodoPago,
        items: venta.items ?? [],
      })

      if (printResult.success) {
        mostrarMensaje('exito', 'Ticket enviado a la impresora')
      } else {
        mostrarMensaje('error', printResult.error || 'No se pudo reimprimir el ticket')
      }
    } catch (error) {
      mostrarMensaje('error', error.message || 'Error inesperado al reimprimir el ticket')
    } finally {
      setReimprimiendoId(null)
    }
  }

  async function handleImprimirCorte() {
    setImprimiendoCorte(true)

    try {
      if (!isPrinterConnected()) {
        const connection = await connectPrinter()
        if (!connection.success) {
          mostrarMensaje('error', connection.error || 'Impresora no conectada')
          return
        }
      }

      const ahora = new Date()
      const fechaReporte = fechaFiltro ? parseLocalISODate(fechaFiltro) : ahora
      const printResult = await sendDailyCloseReceipt({
        fechaReporte,
        horaEmision: ahora,
        fechaCierre: fechaReporte,
        totalTransacciones: ventasFiltradas?.length ?? 0,
        totalEfectivo: resumen.efectivoHoy,
        totalTransferencia: resumen.transferenciaHoy,
        prendas: resumen.unidadesHoy,
        totalDia: resumen.totalHoy,
      })

      if (printResult.success) {
        mostrarMensaje('exito', 'Corte de caja impreso correctamente')
      } else {
        mostrarMensaje('error', printResult.error || 'No se pudo imprimir el corte de caja')
      }
    } catch (error) {
      mostrarMensaje('error', error.message || 'Error inesperado al imprimir el corte de caja')
    } finally {
      setImprimiendoCorte(false)
    }
  }

  function handleFechaInput(value) {
    setFechaFiltro(value || null)
  }

  function handleExportExcel() {
    if (!ventasFiltradas?.length) {
      mostrarMensaje('error', 'No hay ventas para exportar en el periodo seleccionado')
      return
    }

    try {
      exportVentasToExcel(ventasFiltradas)
      mostrarMensaje('exito', 'Archivo Excel descargado')
    } catch (error) {
      mostrarMensaje('error', error.message || 'No se pudo generar el archivo Excel')
    }
  }

  async function handleCerrarDia() {
    setCerrandoDia(true)

    try {
      if (ventasHoy.length > 0) {
        exportVentasDelDiaToExcel(ventasHoy)
      }

      await exportarRespaldoJSON()
      const snapshot = await crearSnapshot()

      if (ventasHoy.length === 0) {
        mostrarMensaje(
          'exito',
          `Corte de caja finalizado y respaldo guardado con éxito (sin ventas registradas hoy). Snapshot interno creado (${snapshot.totalProductos} productos).`,
        )
      } else {
        mostrarMensaje(
          'exito',
          `Corte de caja finalizado y respaldo guardado con éxito (${ventasHoy.length} venta(s) del día exportadas). Snapshot interno creado (${snapshot.totalProductos} productos).`,
        )
      }
    } catch (error) {
      mostrarMensaje('error', error.message || 'No se pudo completar el cierre de día')
    } finally {
      setCerrandoDia(false)
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-cream shadow-md dark:bg-[#1C1917]">
      <header className="view-header flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-4 shadow-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-[#B3542D] shadow-sm dark:bg-[#292524]/90 dark:text-[#8C4A32]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-carbon dark:text-[#E5E5E5] md:text-xl">
              Reportes — Corte de Caja
            </h2>
            <p className="text-xs text-carbon/70 dark:text-[#A8A29E] md:text-sm">
              {ventas
                ? `${ventasFiltradas.length} venta(s)${fechaFiltro == null ? ' en historial' : ''}`
                : 'Cargando…'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImprimirCorte}
            disabled={imprimiendoCorte}
            className="btn-primary flex min-h-11 items-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            {imprimiendoCorte ? 'Imprimiendo…' : 'Imprimir Corte de Caja'}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!ventasFiltradas?.length}
            className="btn-primary flex min-h-11 items-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar ventas a Excel
          </button>
        </div>
      </header>

      {mensaje && (
        <div
          className={`shrink-0 px-4 py-3 text-center text-sm font-medium ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
          role="alert"
        >
          {mensaje.texto}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="shrink-0 space-y-4 p-4 md:p-5">
          <DateFilterBar
            fechaFiltro={fechaFiltro}
            fechaHoy={fechaHoy}
            fechaAyer={fechaAyer}
            onFechaChange={handleFechaInput}
            onHoy={() => setFechaFiltro(fechaHoy)}
            onAyer={() => setFechaFiltro(fechaAyer)}
            onVerTodo={() => setFechaFiltro(null)}
          />
          <div>
            <p className="mb-3 text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">{tituloResumen}</p>
            <DailySummary resumen={resumen} etiquetaPeriodo={etiquetaPeriodo} />
          </div>
        </div>

        <div>
          <div className="shrink-0 px-4 py-3 md:px-5">
            <h3 className="text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">Historial de ventas</h3>
          </div>
          <div className="max-h-[320px] overflow-auto md:max-h-[360px]">
            <SalesHistoryTable
              ventas={ventasFiltradas}
              onReimprimir={handleReimprimir}
              reimprimiendoId={reimprimiendoId}
              onDevolver={setVentaADevolver}
              devolviendoId={devolviendoId}
            />
          </div>
        </div>

        <footer className="space-y-4 p-4 md:p-5">
          <button
            type="button"
            onClick={handleCerrarDia}
            disabled={cerrandoDia}
            className={cn(
              'flex w-full min-h-14 items-center justify-center gap-2 rounded-full text-base font-bold shadow-md active:scale-[0.98]',
              cerrandoDia
                ? 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
                : 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
            )}
          >
            <Moon className="h-5 w-5" />
            {cerrandoDia ? 'Cerrando día…' : 'Cerrar día y descargar respaldo'}
          </button>

          <p className="text-center text-xs text-carbon/60 dark:text-[#A8A29E]">
            Al cerrar el día se exporta el reporte de ventas del día, un respaldo JSON de seguridad
            y un snapshot interno automático.
          </p>

          <BackupRestorePanel onMensaje={mostrarMensaje} />
          <SnapshotsPanel onMensaje={mostrarMensaje} />
        </footer>
      </div>

      <ConfirmDialog
        open={Boolean(ventaADevolver)}
        title="Confirmar devolución"
        message="¿Confirmas la devolución de esta venta? El dinero se restará del corte del día y los artículos regresarán al inventario."
        confirmLabel="Sí, devolver"
        variant="danger"
        onConfirm={handleConfirmarDevolucion}
        onCancel={() => {
          if (devolviendoId != null) return
          setVentaADevolver(null)
        }}
        processing={devolviendoId != null}
      />
    </section>
  )
}
