import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import {
  COLUMNAS_PLANTILLA,
  descargarPlantillaInventario,
  parseProductosFiles,
} from '../../lib/importProductos'
import { cn } from '../../lib/utils'

export default function BulkImport({ onImport, disabled }) {
  const inputRef = useRef(null)
  const [archivos, setArchivos] = useState([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const puedeImportar = archivos.length > 0 && !processing && !disabled

  async function handleImport() {
    if (!puedeImportar) return

    setProcessing(true)
    setError(null)

    try {
      const { productos, omitidos, erroresArchivo } = await parseProductosFiles(archivos)

      await onImport({ productos, omitidos, erroresArchivo })

      setArchivos([])
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message || 'Error al procesar los archivos')
    } finally {
      setProcessing(false)
    }
  }

  function handleFileChange(e) {
    const seleccionados = [...(e.target.files ?? [])]
    setArchivos(seleccionados)
    setError(null)
  }

  return (
    <div className="panel-card border border-dashed border-[#D48C70]/30 p-4 md:p-5 dark:border-[#332F2D]">
      <div className="mb-3 flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-[#D48C70] dark:text-[#8C4A32]" />
        <h3 className="text-base font-semibold text-carbon dark:text-[#E5E5E5]">Carga masiva (CSV / Excel)</h3>
      </div>

      <p className="mb-3 text-sm text-carbon/60 dark:text-[#A8A29E]">
        Sube uno o varios archivos con las columnas exactas:{' '}
        <strong>{COLUMNAS_PLANTILLA.join(', ')}</strong>. Cada fila debe traer departamento y
        categoría válidos; las filas con errores se omiten automáticamente. Se admiten tildes y ñ
        (UTF-8).
      </p>

      <button
        type="button"
        onClick={descargarPlantillaInventario}
        className="mb-4 flex min-h-11 items-center gap-2 rounded-full bg-brand-100 px-5 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-200 active:scale-[0.98] dark:bg-[#292524] dark:text-[#8C4A32] dark:hover:bg-[#332F2D]"
      >
        <Download className="h-4 w-4" />
        Descargar Plantilla
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-sm font-medium text-carbon/70 dark:text-[#A8A29E]">
            Archivos
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,text/csv"
            onChange={handleFileChange}
            className="w-full rounded-xl border-0 bg-cream px-3 py-3 text-sm text-carbon shadow-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800 dark:bg-[#292524] dark:text-[#A8A29E] dark:file:bg-[#332F2D] dark:file:text-[#8C4A32]"
          />
        </label>

        <button
          type="button"
          disabled={!puedeImportar}
          onClick={handleImport}
          className={cn(
            'flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold shadow-sm active:scale-[0.98] sm:min-w-[160px]',
            puedeImportar
              ? 'bg-[#D48C70] text-white hover:bg-[#C27A5F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
              : 'cursor-not-allowed bg-carbon/10 text-carbon/40 dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40',
          )}
        >
          <Upload className="h-5 w-5" />
          {processing ? 'Importando…' : 'Importar'}
        </button>
      </div>

      {archivos.length > 0 && (
        <div className="mt-2 text-sm text-carbon/70 dark:text-[#A8A29E]">
          <p>{archivos.length} archivo(s) seleccionado(s):</p>
          <ul className="mt-1 list-inside list-disc">
            {archivos.map((file) => (
              <li key={`${file.name}-${file.lastModified}`} className="truncate font-medium">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
