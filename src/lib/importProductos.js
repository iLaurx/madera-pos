import * as XLSX from 'xlsx'
import {
  IMPORT_DEFAULTS,
  resolverCategoriaImportacion,
  resolverDepartamentoImportacion,
} from './constants'
import { downloadBlob } from './download'
import { normalizeText } from './utils'

const UTF8_CODEPAGE = 65001

export const COLUMNAS_PLANTILLA = [
  'DEPARTAMENTO',
  'CATEGORIA',
  'MARCA',
  'DESCRIPCION',
  'TALLA',
  'EXISTENCIA',
  'PRECIO',
]

function normalizeKey(key) {
  const cleaned = String(key ?? '').trim().replace(/\s+/g, ' ')
  return normalizeText(cleaned).toUpperCase()
}

function mapText(value) {
  if (value == null) return ''
  return String(value).normalize('NFC').trim()
}

function stripUtf8Bom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const cleaned = String(value ?? '')
    .replace(/[$,\s]/g, '')
    .trim()
  if (!cleaned) return 0

  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

function parseExistencia(value) {
  if (typeof value === 'number') {
    const entero = Math.trunc(value)
    return Number.isFinite(entero) && entero >= 0 ? entero : 0
  }

  const texto = String(value ?? '').trim()
  if (!texto) return 0

  const num = parseInt(texto, 10)
  return Number.isFinite(num) && num >= 0 ? num : 0
}

function normalizarFila(row) {
  const normalized = {}
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value
  }
  return normalized
}

function validarEncabezados(primeraFila) {
  const presentes = new Set(Object.keys(primeraFila).map(normalizeKey))
  const faltantes = COLUMNAS_PLANTILLA.filter((col) => !presentes.has(col))
  if (faltantes.length > 0) {
    throw new Error(
      `El archivo no tiene todas las columnas requeridas. Faltan: ${faltantes.join(', ')}.`,
    )
  }
}

function parsearFila(row) {
  const fila = normalizarFila(row)

  const departamentoRaw = mapText(fila.DEPARTAMENTO)
  const categoriaRaw = mapText(fila.CATEGORIA)
  const descripcion = mapText(fila.DESCRIPCION)

  const departamento = resolverDepartamentoImportacion(departamentoRaw)
  const categoria = resolverCategoriaImportacion(categoriaRaw)

  if (!departamento || !categoria || !descripcion) {
    return { producto: null, omitido: true }
  }

  const marca = mapText(fila.MARCA) || IMPORT_DEFAULTS.marca

  return {
    producto: {
      departamento,
      categoria,
      marca,
      descripcion,
      talla: mapText(fila.TALLA),
      precio: parseNumber(fila.PRECIO),
      existencia: parseExistencia(fila.EXISTENCIA),
    },
    omitido: false,
  }
}

function readFileAsUtf8Text(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo CSV.'))
    reader.readAsText(file, 'UTF-8')
  })
}

function isCsvFile(file) {
  const name = file.name.toLowerCase()
  return name.endsWith('.csv') || file.type === 'text/csv'
}

async function readWorkbook(file) {
  if (isCsvFile(file)) {
    const text = stripUtf8Bom(await readFileAsUtf8Text(file))
    return XLSX.read(text, { type: 'string', codepage: UTF8_CODEPAGE, raw: false })
  }

  const buffer = await file.arrayBuffer()
  return XLSX.read(buffer, { type: 'array', codepage: UTF8_CODEPAGE, raw: false })
}

/**
 * @param {File} file
 * @returns {Promise<{ productos: object[], omitidos: number }>}
 */
export async function parseProductosFile(file) {
  const workbook = await readWorkbook(file)
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('El archivo no contiene hojas de datos.')
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })

  if (rows.length === 0) {
    throw new Error('El archivo está vacío o no tiene filas de datos.')
  }

  validarEncabezados(rows[0])

  const productos = []
  let omitidos = 0

  for (const row of rows) {
    const { producto, omitido } = parsearFila(row)
    if (omitido || !producto) {
      omitidos += 1
      continue
    }
    productos.push(producto)
  }

  return { productos, omitidos }
}

/**
 * @param {FileList | File[]} files
 */
export async function parseProductosFiles(files) {
  const lista = [...files]
  if (lista.length === 0) {
    throw new Error('No se seleccionaron archivos.')
  }

  const productos = []
  let omitidos = 0
  const erroresArchivo = []

  for (const file of lista) {
    try {
      const resultado = await parseProductosFile(file)
      productos.push(...resultado.productos)
      omitidos += resultado.omitidos
    } catch (err) {
      erroresArchivo.push({
        nombre: file.name,
        mensaje: err.message || 'Error al procesar el archivo',
      })
    }
  }

  if (productos.length === 0 && erroresArchivo.length === lista.length) {
    throw new Error(
      erroresArchivo.map((e) => `${e.nombre}: ${e.mensaje}`).join(' '),
    )
  }

  return { productos, omitidos, erroresArchivo }
}

export function descargarPlantillaInventario() {
  const encabezados = COLUMNAS_PLANTILLA.join(',')
  const ejemplo = 'Hombre,Ropa,Nike,Camiseta básica,M,10,199.00'
  const csv = `\uFEFF${encabezados}\n${ejemplo}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, 'plantilla_inventario.csv')
}
