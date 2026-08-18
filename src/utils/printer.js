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
  return error?.message || 'Error desconocido al imprimir'
}

/**
 * Imprime un ticket de venta en impresora térmica BLE vía ESC/POS.
 * @param {object} saleData - Venta con id, fecha, total, items
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function printReceipt(saleData) {
  if (!navigator?.bluetooth) {
    return { success: false, error: 'Web Bluetooth no está disponible en este navegador' }
  }

  let device = null
  let server = null

  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [PRINTER_SERVICE_UUID],
    })

    server = await device.gatt.connect()
    const characteristic = await findWriteCharacteristic(server)
    const buffer = buildReceiptBuffer(saleData)
    await writeInChunks(characteristic, buffer)

    return { success: true }
  } catch (error) {
    console.error('printReceipt:', error)
    return { success: false, error: mapBluetoothError(error) }
  } finally {
    if (server?.connected) {
      try {
        server.disconnect()
      } catch {
        /* ignorar error al desconectar */
      }
    }
  }
}
