import * as XLSX from 'xlsx-js-style'
import { formatDateForFilename } from './date'
import { downloadBlob } from './download'
import { COLUMNAS_PLANTILLA } from './importProductos'

const CURRENCY_FMT = '"$"#,##0.00'

const COLUMN_WIDTHS = [16, 14, 16, 36, 12, 12, 14]

const PRECIO_COL_INDEX = COLUMNAS_PLANTILLA.indexOf('PRECIO')

function descripcionProducto(producto) {
  return producto.descripcion ?? producto.marcaDescripcion ?? ''
}

function productoToRowPlantilla(producto) {
  return {
    DEPARTAMENTO: producto.departamento ?? '',
    CATEGORIA: producto.categoria ?? '',
    MARCA: producto.marca ?? '',
    DESCRIPCION: descripcionProducto(producto),
    TALLA: producto.talla ?? '',
    EXISTENCIA: producto.existencia ?? 0,
    PRECIO: producto.precio ?? 0,
  }
}

function crearHojaInventario(productos) {
  return XLSX.utils.json_to_sheet(productos.map(productoToRowPlantilla), {
    header: COLUMNAS_PLANTILLA,
  })
}

function sanitizeSheetName(name) {
  return String(name).replace(/[\\/*?:[\]]/g, '-').trim().slice(0, 31) || 'Hoja'
}

function applyWorksheetFormat(worksheet, priceColIndex, columnWidths) {
  const ref = worksheet['!ref']
  if (!ref) return

  worksheet['!autofilter'] = { ref }

  const range = XLSX.utils.decode_range(ref)
  worksheet['!cols'] = columnWidths.map((wch) => ({ wch }))

  for (let col = range.s.c; col <= range.e.c; col++) {
    const headerAddr = XLSX.utils.encode_cell({ r: 0, c: col })
    if (worksheet[headerAddr]) {
      worksheet[headerAddr].s = {
        font: { bold: true, color: { rgb: '1E293B' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { vertical: 'center', horizontal: 'center' },
      }
    }
  }

  for (let row = 1; row <= range.e.r; row++) {
    const priceAddr = XLSX.utils.encode_cell({ r: row, c: priceColIndex })
    const cell = worksheet[priceAddr]
    if (cell && typeof cell.v === 'number') {
      cell.t = 'n'
      cell.z = CURRENCY_FMT
    }
  }
}

function appendUniqueSheet(workbook, worksheet, desiredName, usedNames) {
  let sheetName = sanitizeSheetName(desiredName)
  let suffix = 2

  while (usedNames.has(sheetName)) {
    const base = sanitizeSheetName(desiredName).slice(0, 28)
    sheetName = `${base} ${suffix++}`
  }

  usedNames.add(sheetName)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
}

export function exportInventarioToExcel(productos) {
  if (!productos?.length) {
    throw new Error('No hay productos para exportar')
  }

  const workbook = XLSX.utils.book_new()
  const usedNames = new Set()

  const resumenOrdenado = [...productos].sort((a, b) => {
    const dep = (a.departamento ?? '').localeCompare(b.departamento ?? '')
    if (dep !== 0) return dep
    const cat = (a.categoria ?? '').localeCompare(b.categoria ?? '')
    if (cat !== 0) return cat
    const marca = (a.marca ?? '').localeCompare(b.marca ?? '')
    if (marca !== 0) return marca
    return descripcionProducto(a).localeCompare(descripcionProducto(b))
  })

  const resumenSheet = crearHojaInventario(resumenOrdenado)
  applyWorksheetFormat(resumenSheet, PRECIO_COL_INDEX, COLUMN_WIDTHS)
  appendUniqueSheet(workbook, resumenSheet, 'Resumen General', usedNames)

  const porCategoria = productos.reduce((acc, producto) => {
    const categoria = producto.categoria?.trim() || 'Sin categoría'
    if (!acc[categoria]) acc[categoria] = []
    acc[categoria].push(producto)
    return acc
  }, {})

  const categoriasOrdenadas = Object.keys(porCategoria).sort((a, b) => a.localeCompare(b))

  for (const categoria of categoriasOrdenadas) {
    const items = [...porCategoria[categoria]].sort((a, b) => {
      const dep = (a.departamento ?? '').localeCompare(b.departamento ?? '')
      if (dep !== 0) return dep
      const marca = (a.marca ?? '').localeCompare(b.marca ?? '')
      if (marca !== 0) return marca
      return descripcionProducto(a).localeCompare(descripcionProducto(b))
    })

    const sheet = crearHojaInventario(items)
    applyWorksheetFormat(sheet, PRECIO_COL_INDEX, COLUMN_WIDTHS)
    appendUniqueSheet(workbook, sheet, categoria, usedNames)
  }

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  })

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const filename = `Inventario_Madera_Boutique_${formatDateForFilename()}.xlsx`
  downloadBlob(blob, filename)
}
