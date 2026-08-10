import { db } from '../db/db'
import { obtenerDatosRespaldo, restaurarTablasDesdeDatos } from './backupDb'

export const MAX_SNAPSHOTS = 30

async function podarSnapshotsAntiguos() {
  const total = await db.snapshots.count()
  if (total <= MAX_SNAPSHOTS) return

  const excedentes = total - MAX_SNAPSHOTS
  const idsAntiguos = await db.snapshots.orderBy('fecha').limit(excedentes).primaryKeys()
  await db.snapshots.bulkDelete(idsAntiguos)
}

/**
 * Lee productos y ventas, los empaqueta con fecha ISO y guarda en `snapshots`.
 * Mantiene como máximo {@link MAX_SNAPSHOTS} registros (elimina los más antiguos).
 */
export async function crearSnapshot() {
  const datos = await obtenerDatosRespaldo()
  const fecha = new Date().toISOString()

  const registro = {
    fecha,
    totalProductos: datos.productos.length,
    totalVentas: datos.ventas.length,
    datos,
  }

  const id = await db.snapshots.add(registro)
  await podarSnapshotsAntiguos()

  return {
    id,
    fecha,
    totalProductos: registro.totalProductos,
    totalVentas: registro.totalVentas,
  }
}

export async function listarSnapshots() {
  const lista = await db.snapshots.orderBy('fecha').reverse().toArray()
  return lista.map(({ id, fecha, totalProductos, totalVentas }) => ({
    id,
    fecha,
    totalProductos: totalProductos ?? 0,
    totalVentas: totalVentas ?? 0,
  }))
}

export async function restaurarSnapshot(id) {
  const snapshot = await db.snapshots.get(id)

  if (!snapshot?.datos) {
    throw new Error('No se encontró el punto de restauración seleccionado.')
  }

  const resultado = await restaurarTablasDesdeDatos(snapshot.datos)

  return {
    ...resultado,
    fecha: snapshot.fecha,
  }
}
