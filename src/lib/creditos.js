import { db } from '../db/db'
import { formatCurrency } from './format'
import { normalizeText } from './utils'

export function roundMoney(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100
}

export function creditoDisponible(credito) {
  return roundMoney((Number(credito?.limiteCredito) || 0) - (Number(credito?.saldoActual) || 0))
}

export function estatusCredito(credito) {
  return roundMoney(credito?.saldoActual) > 0 ? 'con_adeudo' : 'al_corriente'
}

export function etiquetaEstatus(estatus) {
  return estatus === 'al_corriente' ? 'Al corriente' : 'Con adeudo'
}

export function filtrarCreditos(creditos, busqueda) {
  const q = normalizeText(busqueda)
  const lista = Array.isArray(creditos) ? creditos : []
  if (!q) return lista

  return lista.filter(
    (credito) =>
      normalizeText(credito.clienteNombre).includes(q) ||
      normalizeText(credito.telefono).includes(q),
  )
}

export function ordenarCreditos(creditos) {
  return [...(creditos ?? [])].sort((a, b) => {
    const adeudoA = estatusCredito(a) === 'con_adeudo' ? 0 : 1
    const adeudoB = estatusCredito(b) === 'con_adeudo' ? 0 : 1
    if (adeudoA !== adeudoB) return adeudoA - adeudoB
    return String(a.clienteNombre ?? '').localeCompare(String(b.clienteNombre ?? ''), 'es', {
      sensitivity: 'base',
    })
  })
}

export function crearMovimiento({ tipo, monto, fecha, metodoPago, descripcion, ventaId }) {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    tipo,
    monto: roundMoney(monto),
    fecha: fecha instanceof Date ? fecha : new Date(fecha ?? Date.now()),
    ...(metodoPago ? { metodoPago } : {}),
    ...(descripcion ? { descripcion } : {}),
    ...(ventaId != null ? { ventaId } : {}),
  }
}

function historialDe(credito) {
  return Array.isArray(credito?.historialMovimientos) ? credito.historialMovimientos : []
}

export async function registrarCargoCredito({
  creditoId,
  monto,
  fecha,
  ventaId,
  descripcion = 'Venta a crédito',
}) {
  const credito = await db.creditos.get(creditoId)
  if (!credito) throw new Error('Cliente de crédito no encontrado')

  const cargo = roundMoney(monto)
  if (cargo <= 0) throw new Error('El cargo debe ser mayor a cero')

  const disponible = creditoDisponible(credito)
  if (cargo > disponible + 0.001) {
    throw new Error(
      `El crédito de ${credito.clienteNombre} no cubre esta venta. Disponible: ${formatCurrency(Math.max(0, disponible))}`,
    )
  }

  const movimiento = crearMovimiento({
    tipo: 'cargo',
    monto: cargo,
    fecha,
    descripcion,
    ventaId,
  })

  await db.creditos.update(creditoId, {
    saldoActual: roundMoney((credito.saldoActual ?? 0) + cargo),
    historialMovimientos: [...historialDe(credito), movimiento],
  })
}

export async function registrarAbonoCredito({
  creditoId,
  monto,
  metodoPago,
  fecha,
  descripcion,
}) {
  const credito = await db.creditos.get(creditoId)
  if (!credito) throw new Error('Cliente de crédito no encontrado')

  const saldo = roundMoney(credito.saldoActual)
  if (saldo <= 0) throw new Error('Este cliente no tiene adeudo por cobrar')

  const abono = roundMoney(monto)
  if (abono <= 0) throw new Error('El abono debe ser mayor a cero')
  if (abono > saldo + 0.001) {
    throw new Error(`El abono no puede ser mayor al saldo (${formatCurrency(saldo)})`)
  }

  const movimiento = crearMovimiento({
    tipo: 'abono',
    monto: abono,
    fecha,
    metodoPago,
    descripcion: descripcion || `Abono ${metodoPago === 'transferencia' ? 'por transferencia' : 'en efectivo'}`,
  })

  await db.creditos.update(creditoId, {
    saldoActual: roundMoney(saldo - abono),
    historialMovimientos: [...historialDe(credito), movimiento],
  })
}

export async function revertirCargoPorVenta({ creditoId, ventaId, monto, fecha }) {
  if (creditoId == null) return

  const credito = await db.creditos.get(creditoId)
  if (!credito) return

  const cargo = roundMoney(monto)
  if (cargo <= 0) return

  const movimiento = crearMovimiento({
    tipo: 'devolucion',
    monto: cargo,
    fecha,
    descripcion: ventaId != null ? `Devolución de venta #${ventaId}` : 'Devolución de venta a crédito',
    ventaId,
  })

  await db.creditos.update(creditoId, {
    saldoActual: roundMoney((credito.saldoActual ?? 0) - cargo),
    historialMovimientos: [...historialDe(credito), movimiento],
  })
}
