import * as XLSX from 'xlsx'
import { formatDateForFilename, formatFecha, formatHora } from './date'
import { downloadBlob } from './download'
import { etiquetaProducto } from './productos'

function formatMetodoPago(metodo) {
  if (metodo === 'efectivo') return 'Efectivo'
  if (metodo === 'transferencia') return 'Transferencia'
  return metodo ?? ''
}

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return ''

  return items
    .map((item) => {
      const nombre = etiquetaProducto(item)
      const talla = item.talla ? ` (${item.talla})` : ''
      const cantidad = item.cantidad ?? 1
      return `${nombre}${talla} x${cantidad}`
    })
    .join('; ')
}

function contarUnidades(items) {
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, item) => sum + (item.cantidad ?? 0), 0)
}

export function exportVentasToExcel(ventas, options = {}) {
  const { filenamePrefix = 'Ventas_Madera_Boutique' } = options

  const ordenadas = [...ventas].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  )

  const filas = ordenadas.map((venta) => ({
    ID: venta.id,
    Fecha: formatFecha(venta.fecha),
    Hora: formatHora(venta.fecha),
    'Método de pago': formatMetodoPago(venta.metodoPago),
    'Artículos vendidos': contarUnidades(venta.items),
    Items: formatItems(venta.items),
    Total: venta.total ?? 0,
  }))

  const worksheet = XLSX.utils.json_to_sheet(filas)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas')

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 50 },
    { wch: 12 },
  ]

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const filename = `${filenamePrefix}_${formatDateForFilename()}.xlsx`
  downloadBlob(blob, filename)
}

export function exportVentasDelDiaToExcel(ventas) {
  exportVentasToExcel(ventas, { filenamePrefix: 'Corte_Dia_Madera_Boutique' })
}

export { formatItems, formatMetodoPago, contarUnidades }
