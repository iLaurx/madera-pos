import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart3, FileSpreadsheet, Moon } from 'lucide-react'
import BackupRestorePanel from '../components/reportes/BackupRestorePanel'
import DailySummary from '../components/reportes/DailySummary'
import SalesHistoryTable from '../components/reportes/SalesHistoryTable'
import SnapshotsPanel from '../components/reportes/SnapshotsPanel'
import { exportarRespaldoJSON } from '../lib/backupDb'
import { isSameDay } from '../lib/date'
import { exportVentasDelDiaToExcel, exportVentasToExcel } from '../lib/exportVentas'
import { crearSnapshot } from '../lib/snapshots'
import { cn } from '../lib/utils'
import { db } from '../db/db'

function calcularResumenDia(ventas) {
  const ventasHoy = ventas.filter((v) => isSameDay(v.fecha))

  return ventasHoy.reduce(
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

  const ventasHoy = useMemo(
    () => (ventas ?? []).filter((venta) => isSameDay(venta.fecha)),
    [ventas],
  )

  const resumen = useMemo(
    () => calcularResumenDia(ventas ?? []),
    [ventas],
  )

  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 4500)
  }

  function handleExportExcel() {
    if (!ventas?.length) {
      mostrarMensaje('error', 'No hay ventas para exportar')
      return
    }

    try {
      exportVentasToExcel(ventas)
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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-[#D48C70] shadow-sm dark:bg-[#292524]/90 dark:text-[#8C4A32]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-carbon dark:text-[#E5E5E5] md:text-xl">
              Reportes — Corte de Caja
            </h2>
            <p className="text-xs text-carbon/70 dark:text-[#A8A29E] md:text-sm">
              {ventas ? `${ventas.length} ventas en historial` : 'Cargando…'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={!ventas?.length}
          className="btn-primary flex min-h-11 items-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar ventas a Excel
        </button>
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
        <div className="shrink-0 p-4 md:p-5">
          <p className="mb-3 text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">Resumen del día</p>
          <DailySummary resumen={resumen} />
        </div>

        <div>
          <div className="shrink-0 px-4 py-3 md:px-5">
            <h3 className="text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">Historial de ventas</h3>
          </div>
          <div className="max-h-[320px] overflow-auto md:max-h-[360px]">
            <SalesHistoryTable ventas={ventas} />
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
                ? 'cursor-not-allowed bg-carbon/20 text-carbon/50 dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
                : 'bg-[#D48C70] text-white hover:bg-[#C27A5F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
            )}
          >
            <Moon className="h-5 w-5" />
            {cerrandoDia ? 'Cerrando día…' : 'Cerrar día y descargar respaldo'}
          </button>

          <p className="text-center text-xs text-carbon/60 dark:text-[#A8A29E]">
            Al cerrar el día se exporta el reporte de ventas del día, un respaldo JSON de seguridad
            y un snapshot interno automático.
          </p>

          <SnapshotsPanel onMensaje={mostrarMensaje} />
          <BackupRestorePanel onMensaje={mostrarMensaje} />
        </footer>
      </div>
    </section>
  )
}
