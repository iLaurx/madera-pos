import { useSyncExternalStore } from 'react'
import { formatFecha, formatHora } from '../lib/date'
import { etiquetaProducto } from '../lib/productos'

const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'

const KNOWN_WRITE_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-1e4d-4bd9-ba61-23c647716601',
  '0000ae01-0000-1000-8000-00805f9b34fb',
]

const DEFAULT_CHUNK_SIZE = 100

/** ESC p m t1 t2 — pulso de apertura del cajón (pin 2 del conector RJ11). */
const CASH_DRAWER_PULSE = Uint8Array.from([0x1b, 0x70, 0x00, 0x32, 0x32])

const INITIAL_STATUS = {
  connected: false,
  connecting: false,
  supported: false,
  deviceName: null,
}

/** @type {BluetoothDevice | null} */
let bluetoothDevice = null
/** @type {BluetoothRemoteGATTCharacteristic | null} */
let writeCharacteristic = null
/** @type {Promise<void>} */
let connectChain = Promise.resolve()
let pendingConnects = 0
let transparentReconnects = 0

const listeners = new Set()
const devicesWithDisconnectListener = new WeakSet()

let statusSnapshot = { ...INITIAL_STATUS }

function isBluetoothSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth)
}

function computeStatus() {
  return {
    connected: Boolean(bluetoothDevice?.gatt?.connected && writeCharacteristic),
    connecting: pendingConnects > 0,
    supported: isBluetoothSupported(),
    deviceName: bluetoothDevice?.name || null,
  }
}

function notifyStatus() {
  const next = computeStatus()
  if (
    next.connected === statusSnapshot.connected &&
    next.connecting === statusSnapshot.connecting &&
    next.supported === statusSnapshot.supported &&
    next.deviceName === statusSnapshot.deviceName
  ) {
    return
  }

  statusSnapshot = next
  listeners.forEach((listener) => listener())
}

function subscribePrinterStatus(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getPrinterStatusSnapshot() {
  return statusSnapshot
}

function getServerPrinterStatusSnapshot() {
  return INITIAL_STATUS
}

/**
 * Unicode → CP850 / CP437 (español). Las térmicas ESC/POS 80mm usan este
 * charset por defecto; enviar Latin-1 (ñ=0xF1) imprime símbolos raros.
 */
const CP850_CHARS = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ü: 0x81,
  ñ: 0xa4,
  Á: 0xb5,
  É: 0x90,
  Í: 0xd6,
  Ó: 0xe0,
  Ú: 0xe9,
  Ü: 0x9a,
  Ñ: 0xa5,
  '¡': 0xad,
  '¿': 0xa8,
  º: 0xa7,
  ª: 0xa6,
}

function encodeText(text) {
  const bytes = []
  for (const char of String(text ?? '')) {
    if (Object.prototype.hasOwnProperty.call(CP850_CHARS, char)) {
      bytes.push(CP850_CHARS[char])
      continue
    }
    const code = char.charCodeAt(0)
    bytes.push(code <= 0x7f ? code : 0x3f)
  }
  return bytes
}

function mergeByteArrays(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const buffer = new Uint8Array(totalLength)
  let offset = 0
  for (const part of parts) {
    buffer.set(part, offset)
    offset += part.length
  }
  return buffer
}

const RECEIPT_WIDTH = 48
const QTY_COL = 4
const DESC_COL = 33
const PRICE_COL = 11
const RETURNS_NOTICE =
  'Cambios y devoluciones únicamente con este ticket dentro de 30 días.'

function bytes(...values) {
  return Uint8Array.from(values)
}

function textLine(value = '') {
  return Uint8Array.from([...encodeText(value), 0x0a])
}

function dashedSeparator() {
  return textLine('-'.repeat(RECEIPT_WIDTH))
}

function formatPaymentMethod(saleData) {
  const raw = saleData?.paymentMethod || saleData?.metodoPago || 'Efectivo'
  const key = String(raw).trim().toLowerCase()
  if (key === 'efectivo') return 'Efectivo'
  if (key === 'transferencia') return 'Transferencia'
  return String(raw).trim() || 'Efectivo'
}

function padRight(value, width) {
  const text = String(value ?? '')
  if (text.length >= width) return text.slice(0, width)
  return text + ' '.repeat(width - text.length)
}

function padLeft(value, width) {
  const text = String(value ?? '')
  if (text.length >= width) return text.slice(text.length - width)
  return ' '.repeat(width - text.length) + text
}

function formatTicketMoney(amount) {
  const n = Number(amount)
  const value = Number.isFinite(n) ? n : 0
  const abs = Math.abs(value).toFixed(2)
  const [integer, decimal] = abs.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = value < 0 ? '-' : ''
  return `${sign}$${grouped}.${decimal}`
}

function wrapDescription(text, width) {
  const source = String(text ?? '').trim()
  if (!source) return ['']

  const lines = []
  let remaining = source
  while (remaining.length > width) {
    const chunk = remaining.slice(0, width)
    const breakAt = chunk.lastIndexOf(' ')
    const cut = breakAt > 0 ? breakAt : width
    lines.push(remaining.slice(0, cut).trimEnd())
    remaining = remaining.slice(cut).trimStart()
  }
  if (remaining) lines.push(remaining)
  return lines
}

/**
 * Formatea un producto al layout de 48 columnas:
 * cantidad (4, izq) + descripción (33, pad der, wrap) + subtotal (11, der, $).
 * @param {object} item
 * @returns {string[]}
 */
function formatProductLines(item) {
  const qty = String(item?.cantidad ?? 1)
  const nombre = etiquetaProducto(item).replace(/\u2014|\u2013/g, '-')
  const talla = item?.talla ? ` (${item.talla})` : ''
  const description = `${nombre}${talla}`
  const subtotal =
    item?.subtotal ?? (Number(item?.precio) || 0) * (Number(item?.cantidad) || 1)
  const price = formatTicketMoney(subtotal)

  const descLines = wrapDescription(description, DESC_COL)
  const lines = [
    padRight(qty, QTY_COL) + padRight(descLines[0], DESC_COL) + padLeft(price, PRICE_COL),
  ]

  for (let i = 1; i < descLines.length; i += 1) {
    lines.push(' '.repeat(QTY_COL) + padRight(descLines[i], DESC_COL) + ' '.repeat(PRICE_COL))
  }

  return lines
}

function buildReceiptBuffer(saleData) {
  const fecha = saleData?.fecha ?? new Date()
  const ventaId = saleData?.id != null ? String(saleData.id) : '-'
  const items = Array.isArray(saleData?.items) ? saleData.items : []
  const tableHeader =
    padRight('CANT', QTY_COL) + padRight(' DESCRIPCION', DESC_COL) + padLeft('IMPORTE', PRICE_COL)

  const parts = [
    bytes(0x1b, 0x40),
    CASH_DRAWER_PULSE,
    bytes(0x1b, 0x74, 0x02),

    bytes(0x1b, 0x61, 0x01),
    bytes(0x1d, 0x21, 0x11),
    textLine('MADERA BOUTIQUE'),
    bytes(0x1d, 0x21, 0x00),
    textLine('Calle 16 de septiembre #6, Bolaños, Jalisco'),
    bytes(0x0a),

    bytes(0x1b, 0x61, 0x00),
    textLine(`Ticket: ${ventaId}`),
    textLine(`Fecha:  ${formatFecha(fecha)}`),
    textLine(`Hora:   ${formatHora(fecha)}`),
    bytes(0x0a),
    dashedSeparator(),
    textLine(tableHeader),
    dashedSeparator(),
  ]

  for (const item of items) {
    for (const line of formatProductLines(item)) {
      parts.push(textLine(line))
    }
  }

  parts.push(
    dashedSeparator(),
    bytes(0x1b, 0x61, 0x02),
    bytes(0x1b, 0x45, 0x01),
    textLine(padLeft(`TOTAL: ${formatTicketMoney(saleData?.total)}`, RECEIPT_WIDTH)),
    bytes(0x1b, 0x45, 0x00),
    bytes(0x1b, 0x61, 0x00),
    textLine(`Forma de Pago: ${formatPaymentMethod(saleData)}`),
    dashedSeparator(),

    bytes(0x1b, 0x61, 0x01),
    bytes(0x1b, 0x45, 0x01),
    textLine('¡GRACIAS POR TU COMPRA!'),
    bytes(0x1b, 0x45, 0x00),
  )

  for (const line of wrapDescription(RETURNS_NOTICE, RECEIPT_WIDTH)) {
    parts.push(textLine(line))
  }

  parts.push(
    textLine('Síguenos en IG: @madera.boutique'),
    dashedSeparator(),
    bytes(0x1b, 0x61, 0x00),
    bytes(0x1b, 0x64, 0x05),
    bytes(0x1d, 0x56, 0x42, 0x00),
  )

  return mergeByteArrays(parts)
}

function isWritableCharacteristic(characteristic) {
  return characteristic.properties.write || characteristic.properties.writeWithoutResponse
}

async function findWriteCharacteristic(server) {
  const primaryService = await server.getPrimaryService(PRINTER_SERVICE_UUID)
  const characteristics = await primaryService.getCharacteristics()

  for (const uuid of KNOWN_WRITE_CHARACTERISTIC_UUIDS) {
    const match = characteristics.find((c) => c.uuid === uuid && isWritableCharacteristic(c))
    if (match) return match
  }

  const writable = characteristics.find(isWritableCharacteristic)
  if (writable) return writable

  throw new Error('No se encontró una característica de escritura en la impresora')
}

async function writeInChunks(characteristic, data) {
  const chunkSize = characteristic.maxWriteValueLength || DEFAULT_CHUNK_SIZE
  const useWithoutResponse = characteristic.properties.writeWithoutResponse

  for (let offset = 0; offset < data.length; offset += chunkSize) {
    const chunk = data.slice(offset, offset + chunkSize)
    if (useWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk)
    } else {
      await characteristic.writeValue(chunk)
    }
  }
}

function mapBluetoothError(error) {
  if (error?.name === 'NotFoundError') {
    return 'No se seleccionó ninguna impresora'
  }
  if (error?.name === 'SecurityError') {
    return 'Bluetooth no disponible en este contexto (requiere HTTPS)'
  }
  if (error?.name === 'NotSupportedError') {
    return 'Este dispositivo no soporta Web Bluetooth'
  }
  if (error?.name === 'NetworkError') {
    return 'Conexión Bluetooth interrumpida durante la impresión'
  }
  if (error?.name === 'InvalidStateError') {
    return 'La impresora no está lista. Intenta conectar de nuevo'
  }
  return error?.message || 'Error desconocido al imprimir'
}

async function bindWriteCharacteristic(server) {
  writeCharacteristic = await findWriteCharacteristic(server)
  notifyStatus()
}

function attachDisconnectListener(device) {
  if (!device || devicesWithDisconnectListener.has(device)) return
  devicesWithDisconnectListener.add(device)
  device.addEventListener('gattserverdisconnected', handleGattDisconnected)
}

async function reconnectExistingDevice() {
  if (!bluetoothDevice?.gatt) {
    throw new Error('No hay una impresora vinculada en esta sesión')
  }

  const server = await bluetoothDevice.gatt.connect()
  await bindWriteCharacteristic(server)
}

async function handleGattDisconnected() {
  writeCharacteristic = null
  notifyStatus()

  if (!bluetoothDevice || transparentReconnects >= 1) return

  transparentReconnects += 1
  try {
    await withConnectLock(async () => {
      if (bluetoothDevice?.gatt?.connected && writeCharacteristic) return
      await reconnectExistingDevice()
    })
  } catch (error) {
    console.warn('Reconexión Bluetooth transparente fallida:', error)
    writeCharacteristic = null
    notifyStatus()
  }
}

async function withConnectLock(task) {
  pendingConnects += 1
  notifyStatus()

  const run = connectChain.then(task, task)
  connectChain = run.then(
    () => {},
    () => {},
  )

  try {
    await run
  } finally {
    pendingConnects -= 1
    notifyStatus()
  }
}

async function ensureConnected() {
  if (!isBluetoothSupported()) {
    throw Object.assign(new Error('Web Bluetooth no está disponible en este navegador'), {
      name: 'NotSupportedError',
    })
  }

  if (bluetoothDevice?.gatt?.connected && writeCharacteristic) {
    return
  }

  if (bluetoothDevice) {
    await reconnectExistingDevice()
    attachDisconnectListener(bluetoothDevice)
    return
  }

  bluetoothDevice = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [PRINTER_SERVICE_UUID],
  })
  attachDisconnectListener(bluetoothDevice)

  const server = await bluetoothDevice.gatt.connect()
  await bindWriteCharacteristic(server)
}

/**
 * Conecta (o reutiliza) la impresora Bluetooth de la sesión actual.
 * Solo abre el selector de dispositivos la primera vez.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function connectPrinter() {
  transparentReconnects = 0
  try {
    await withConnectLock(ensureConnected)
    if (!bluetoothDevice?.gatt?.connected || !writeCharacteristic) {
      return { success: false, error: 'No se pudo establecer la conexión con la impresora' }
    }
    return { success: true }
  } catch (error) {
    console.error('connectPrinter:', error)
    return { success: false, error: mapBluetoothError(error) }
  }
}

/**
 * Envía bytes a la impresora reutilizando (o recuperando) la conexión BLE.
 * Nunca lanza: un fallo de Bluetooth no debe romper la UI ni el cobro.
 * @param {Uint8Array} buffer
 * @param {string} logLabel
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function sendToPrinter(buffer, logLabel) {
  try {
    const connection = await connectPrinter()
    if (!connection.success) return connection

    try {
      await writeInChunks(writeCharacteristic, buffer)
      return { success: true }
    } catch (error) {
      console.error(`${logLabel}:`, error)
      writeCharacteristic = null
      notifyStatus()

      const retried = await connectPrinter()
      if (retried.success) {
        try {
          await writeInChunks(writeCharacteristic, buffer)
          return { success: true }
        } catch (retryError) {
          console.error(`${logLabel} retry:`, retryError)
          return { success: false, error: mapBluetoothError(retryError) }
        }
      }

      return { success: false, error: mapBluetoothError(error) }
    }
  } catch (error) {
    console.error(`${logLabel}:`, error)
    return { success: false, error: mapBluetoothError(error) }
  }
}

/**
 * Imprime un ticket de venta en impresora térmica BLE vía ESC/POS.
 * Reutiliza la conexión Bluetooth activa e incluye el pulso de apertura
 * del cajón al inicio del buffer.
 * @param {object} saleData - Venta con id, fecha, total, items
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function printReceipt(saleData) {
  return sendToPrinter(buildReceiptBuffer(saleData), 'printReceipt')
}

/**
 * Dispara el pulso de apertura del cajón de dinero (ESC p) de forma independiente.
 * Si la impresora está desconectada o el comando falla, devuelve el error
 * sin lanzar excepciones.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function openCashDrawer() {
  return sendToPrinter(CASH_DRAWER_PULSE, 'openCashDrawer')
}

export function getPrinterStatus() {
  return statusSnapshot
}

export function isPrinterConnected() {
  return Boolean(bluetoothDevice?.gatt?.connected && writeCharacteristic)
}

/**
 * Estado reactivo de la impresora Bluetooth de la sesión.
 * @returns {{ connected: boolean, connecting: boolean, supported: boolean, deviceName: string | null }}
 */
export function usePrinterStatus() {
  return useSyncExternalStore(
    subscribePrinterStatus,
    getPrinterStatusSnapshot,
    getServerPrinterStatusSnapshot,
  )
}

if (typeof window !== 'undefined') {
  statusSnapshot = computeStatus()
}
