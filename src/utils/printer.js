import { useSyncExternalStore } from 'react'
import { formatFecha, formatHora } from '../lib/date'
import { formatCurrency } from '../lib/format'
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

function encodeText(text) {
  const bytes = []
  for (const char of String(text ?? '')) {
    const code = char.charCodeAt(0)
    bytes.push(code <= 0xff ? code : 0x3f)
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

function formatItemLine(item) {
  const nombre = etiquetaProducto(item)
  const talla = item.talla ? ` (${item.talla})` : ''
  const cantidad = item.cantidad ?? 1
  return `${cantidad} x ${nombre}${talla}`
}

function buildReceiptBuffer(saleData) {
  const fecha = saleData.fecha ?? new Date()
  const ventaId = saleData.id != null ? String(saleData.id) : '—'

  const parts = [
    Uint8Array.from([0x1b, 0x40]),
    CASH_DRAWER_PULSE,
    Uint8Array.from([0x1b, 0x61, 0x01]),
    Uint8Array.from([0x1b, 0x21, 0x30]),
    Uint8Array.from(encodeText('Madera Boutique')),
    Uint8Array.from([0x0a]),
    Uint8Array.from([0x1b, 0x21, 0x00]),
    Uint8Array.from([0x0a]),
    Uint8Array.from([0x1b, 0x61, 0x00]),
    Uint8Array.from(encodeText(`Venta #${ventaId}`)),
    Uint8Array.from([0x0a]),
    Uint8Array.from(encodeText(`Fecha: ${formatFecha(fecha)} ${formatHora(fecha)}`)),
    Uint8Array.from([0x0a, 0x0a]),
    Uint8Array.from(encodeText('Productos:')),
    Uint8Array.from([0x0a]),
  ]

  const items = Array.isArray(saleData.items) ? saleData.items : []
  for (const item of items) {
    parts.push(Uint8Array.from(encodeText(formatItemLine(item))))
    parts.push(Uint8Array.from([0x0a]))
  }

  parts.push(
    Uint8Array.from([0x0a]),
    Uint8Array.from(encodeText(`Total: ${formatCurrency(saleData.total)}`)),
    Uint8Array.from([0x0a, 0x0a, 0x0a]),
    Uint8Array.from([0x1d, 0x56, 0x42, 0x00]),
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
