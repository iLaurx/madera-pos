import { useRef, useState } from 'react'
import { Database, Download, Upload } from 'lucide-react'
import ConfirmDialog from '../inventario/ConfirmDialog'
import {
  exportarRespaldoJSON,
  leerRespaldoDesdeArchivo,
  restaurarRespaldoJSON,
} from '../../lib/backupDb'
import { cn } from '../../lib/utils'

export default function BackupRestorePanel({ onMensaje }) {
  const inputRef = useRef(null)
  const [exportando, setExportando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [respaldoPendiente, setRespaldoPendiente] = useState(null)

  async function handleExportar() {
    setExportando(true)
    try {
      const metadata = await exportarRespaldoJSON()
      onMensaje(
        'exito',
        `Respaldo descargado (${metadata.totalProductos} productos, ${metadata.totalVentas} ventas, ${metadata.totalCreditos ?? 0} créditos)`,
      )
    } catch (error) {
      onMensaje('error', error.message || 'No se pudo generar el respaldo')
    } finally {
      setExportando(false)
    }
  }

  async function handleArchivoSeleccionado(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    try {
      const { data, resumen } = await leerRespaldoDesdeArchivo(file)
      setRespaldoPendiente({ data, resumen, nombreArchivo: file.name })
    } catch (error) {
      onMensaje('error', error.message || 'Archivo de respaldo inválido')
    }
  }

  async function handleConfirmarRestauracion() {
    if (!respaldoPendiente) return

    setRestaurando(true)
    try {
      const resultado = await restaurarRespaldoJSON(respaldoPendiente.data)
      setRespaldoPendiente(null)
      onMensaje(
        'exito',
        `Base de datos restaurada (${resultado.productos} productos, ${resultado.ventas} ventas, ${resultado.creditos ?? 0} créditos)`,
      )
    } catch (error) {
      onMensaje('error', error.message || 'No se pudo restaurar la base de datos')
    } finally {
      setRestaurando(false)
    }
  }

  return (
    <>
      <div className="panel-card p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-[#B3542D] dark:text-[#8C4A32]" />
          <h3 className="text-base font-semibold text-carbon dark:text-[#E5E5E5]">Respaldo y restauración</h3>
        </div>

        <p className="mb-4 text-sm text-carbon/60 dark:text-[#A8A29E]">
          Exporta o restaura productos, historial de ventas y cuentas a crédito. Los respaldos son
          archivos JSON locales.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleExportar}
            disabled={exportando || restaurando}
            className={cn(
              'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm active:scale-[0.98] sm:min-w-[200px]',
              exportando || restaurando
                ? 'cursor-not-allowed bg-carbon/10 text-carbon/40 dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
                : 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
            )}
          >
            <Download className="h-4 w-4" />
            {exportando ? 'Exportando…' : 'Exportar respaldo (JSON)'}
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={exportando || restaurando}
            className={cn(
              'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm active:scale-[0.98] sm:min-w-[200px]',
              exportando || restaurando
                ? 'cursor-not-allowed bg-carbon/10 text-carbon/40 dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
                : 'bg-[#B3542D]/15 text-carbon hover:bg-[#B3542D]/25 dark:bg-[#292524] dark:text-[#A8A29E] dark:hover:bg-[#332F2D]',
            )}
          >
            <Upload className="h-4 w-4" />
            Restaurar base de datos
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleArchivoSeleccionado}
          />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(respaldoPendiente)}
        title="Restaurar base de datos"
        message={
          respaldoPendiente
            ? `Se reemplazarán todos los datos actuales con el respaldo "${respaldoPendiente.nombreArchivo}" (${respaldoPendiente.resumen.productos} productos, ${respaldoPendiente.resumen.ventas} ventas, ${respaldoPendiente.resumen.creditos ?? 0} créditos). Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, restaurar"
        onConfirm={handleConfirmarRestauracion}
        onCancel={() => !restaurando && setRespaldoPendiente(null)}
        processing={restaurando}
      />
    </>
  )
}
