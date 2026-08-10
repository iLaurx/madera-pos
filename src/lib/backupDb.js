import { formatDateForFilename, formatHora } from './date'
import { downloadBlob } from './download'
import { normalizarCategoria, normalizarDepartamento, migrarTaxonomiaProducto } from './constants'
import { db } from '../db/db'

export const BACKUP_APP = 'MaderaBoutique'
export const BACKUP_VERSION = 1

function readFileAsUtf8Text(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de respaldo.'))
    reader.readAsText(file, 'UTF-8')
  })
}

export async function obtenerDatosRespaldo() {
  const [productos, ventas] = await Promise.all([
    db.productos.toArray(),
    db.ventas.toArray(),
  ])

  return { productos, ventas }
}

export function crearObjetoRespaldo({ productos, ventas }) {
  const ahora = new Date()

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: ahora.toISOString(),
    metadata: {
      fecha: formatDateForFilename(ahora),
      hora: formatHora(ahora),
      totalProductos: productos.length,
      totalVentas: ventas.length,
    },
    tablas: ['productos', 'ventas'],
    productos,
    ventas,
  }
}

export function validarRespaldo(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo JSON no tiene un formato válido.')
  }

  if (data.app !== BACKUP_APP) {
    throw new Error('Este archivo no es un respaldo de Madera Boutique.')
  }

  if (!Array.isArray(data.productos)) {
    throw new Error('El respaldo no contiene la tabla de productos.')
  }

  if (!Array.isArray(data.ventas)) {
    throw new Error('El respaldo no contiene la tabla de ventas.')
  }

  return {
    productos: data.productos.length,
    ventas: data.ventas.length,
    exportedAt: data.exportedAt ?? data.metadata?.fecha ?? 'desconocida',
  }
}

export async function exportarRespaldoJSON() {
  const datos = await obtenerDatosRespaldo()
  const backup = crearObjetoRespaldo(datos)

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  })

  const filename = `Respaldo_Madera_Boutique_${formatDateForFilename()}.json`
  downloadBlob(blob, filename)

  return backup.metadata
}

/** @deprecated Usar exportarRespaldoJSON */
export async function exportDbBackup() {
  return exportarRespaldoJSON()
}

export async function leerRespaldoDesdeArchivo(file) {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo.')
  }

  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('Selecciona un archivo .json de respaldo.')
  }

  const text = await readFileAsUtf8Text(file)
  const data = JSON.parse(text)
  const resumen = validarRespaldo(data)

  return { data, resumen }
}

function normalizarVentas(ventas) {
  return ventas.map((venta) => ({
    ...venta,
    fecha: venta.fecha ? new Date(venta.fecha) : new Date(),
    items: Array.isArray(venta.items) ? venta.items : [],
  }))
}

function normalizarProductos(productos) {
  return productos.map((producto) => {
    const descripcion =
      producto.descripcion ??
      producto.marcaDescripcion ??
      ''

    const taxonomia = producto.departamento
      ? {
          departamento: normalizarDepartamento(producto.departamento) || 'Unisex',
          categoria: normalizarCategoria(producto.categoria) || 'Ropa',
        }
      : migrarTaxonomiaProducto(producto)

    return {
      departamento: taxonomia.departamento,
      categoria: taxonomia.categoria,
      marca: producto.marca ?? '',
      descripcion,
      talla: producto.talla ?? '',
      precio: Number(producto.precio) || 0,
      existencia: Number(producto.existencia) || 0,
      ...(producto.id != null ? { id: producto.id } : {}),
    }
  })
}

export async function restaurarTablasDesdeDatos({ productos: productosRaw, ventas: ventasRaw }) {
  const productos = normalizarProductos(productosRaw ?? [])
  const ventas = normalizarVentas(ventasRaw ?? [])

  await db.transaction('rw', db.productos, db.ventas, async () => {
    await db.productos.clear()
    await db.ventas.clear()

    if (productos.length > 0) {
      await db.productos.bulkAdd(productos)
    }

    if (ventas.length > 0) {
      await db.ventas.bulkAdd(ventas)
    }
  })

  return {
    productos: productos.length,
    ventas: ventas.length,
  }
}

export async function restaurarRespaldoJSON(data) {
  validarRespaldo(data)
  return restaurarTablasDesdeDatos(data)
}
