import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let printDailyCloseReceipt

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  ;({ printDailyCloseReceipt } = await server.ssrLoadModule('/src/utils/printer.js'))
})

after(async () => {
  await server?.close()
})

function receiptText(data) {
  const buffer = printDailyCloseReceipt(data)
  // Strip ESC/POS commands to check the printable content and line widths.
  return Buffer.from(buffer).toString('latin1')
    .replace(/\x1b[@]/g, '')
    .replace(/\x1b[taEd][\s\S]/g, '')
    .replace(/\x1d![\s\S]/g, '')
    .replace(/\x1dVB\x00/g, '')
}

const fecha = new Date(2026, 9, 7, 18, 35)
const base = { fechaReporte: fecha, horaEmision: fecha, fechaCierre: fecha }

test('prints each sale chronologically, its products, payment and matching totals', () => {
  const ventas = [
    { id: 22, fecha: new Date(2026, 9, 7, 15), metodoPago: 'transferencia', total: 150,
      items: [{ descripcion: 'Camisa', talla: 'M', cantidad: 1, precio: 150 }] },
    { id: 21, fecha: new Date(2026, 9, 7, 10), metodoPago: 'efectivo', total: 200,
      items: [{ descripcion: 'Blusa', talla: 'S', cantidad: 2, precio: 100 }] },
  ]
  const text = receiptText({ ...base, ventas, totalTransacciones: 2, totalEfectivo: 200,
    totalTransferencia: 150, prendas: 3, totalDia: 350 })
  assert.ok(text.indexOf('Ticket: 21') < text.indexOf('Ticket: 22'))
  assert.deepEqual(ventas.map((venta) => venta.id), [22, 21])
  assert.match(text, /Forma de Pago: Efectivo/)
  assert.match(text, /Forma de Pago: Transferencia/)
  assert.match(text, /2\s+Blusa \(S\)\s+\$200\.00/)
  assert.match(text, /1\s+Camisa \(M\)\s+\$150\.00/)
  assert.match(text, /Total transacciones: 2/)
  assert.match(text, /Total Efectivo:\s+\$200\.00/)
  assert.match(text, /Total Transferencia:\s+\$150\.00/)
  assert.match(text, /Prendas\/Articulos:\s+3 pzs/)
  assert.match(text, /TOTAL DEL DIA: \$350\.00/)
  assert.ok(text.indexOf('RESUMEN DEL CORTE') > text.indexOf('Ticket: 22'))
})

test('wraps long descriptions without losing size or exceeding 48 columns', () => {
  const text = receiptText({ ...base, ventas: [{ id: 1, fecha, total: 125.5,
    items: [{ descripcion: 'Vestido largo estampado con flores y mangas para temporada de verano',
      talla: 'XL', cantidad: 1, subtotal: 125.5 }] }] })
  assert.match(text, /\$125\.50/)
  assert.match(text, /\(XL\)/)
  assert.match(text, /temporada\s+de verano/)
  for (const line of text.split('\n')) assert.ok(line.length <= 48, line)
})

test('empty reports and legacy sales without products are explicit', () => {
  const empty = receiptText(base)
  assert.match(empty, /Sin ventas registradas en el periodo\./)
  assert.match(empty, /TOTAL DEL DIA: \$0\.00/)
  const legacy = receiptText({ ...base, ventas: [{ id: 1, fecha, total: 50 }] })
  assert.match(legacy, /Sin detalle de productos registrado\./)
  assert.match(legacy, /Total venta:\s+\$50\.00/)
})

test('all-history reports identify their scope and print the actual emission time at the signature', () => {
  const text = receiptText({ ...base, fechaReporte: new Date(2026, 9, 6), periodo: 'historial' })
  assert.match(text, /CORTE DE CAJA \(HISTORIAL\)/)
  assert.match(text, /Periodo: Todo el historial/)
  assert.match(text, /TOTAL DEL PERIODO: \$0\.00/)
  assert.doesNotMatch(text, /TOTAL DEL DIA/)
  const emissionTime = text.match(/Hora de emision:   (.+)/)[1]
  assert.ok(text.slice(text.indexOf('Firma Encargada:')).includes(emissionTime))
})
