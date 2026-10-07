import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { createServer } from 'vite'

let server
let harness
let confirmarCobro
let printer
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

// Exercise the real checkout handler and Bluetooth code with an isolated UI/store.
beforeEach(async () => {
  const cart = [{ productoId: 1, descripcion: 'Blusa', talla: 'M', precio: 100, cantidad: 2 }]
  harness = {
    state: { 4: cart, 5: true, 6: true },
    hookIndex: 0,
    sales: [],
    product: { id: 1, existencia: 5 },
    writes: [],
    selections: 0,
    connects: 0,
  }
  harness.db = {
    transaction: async (_mode, _sales, _products, operation) => operation(),
    ventas: { add: async (sale) => { harness.sales.push(sale); return 42 } },
    productos: {
      get: async () => harness.product,
      update: async (_id, changes) => Object.assign(harness.product, changes),
    },
  }
  globalThis.__checkoutHarness = harness
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} })

  server = await createServer({
    configFile: false,
    esbuild: { jsx: 'automatic' },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    plugins: [{
      name: 'checkout-test-adapters',
      enforce: 'pre',
      transform(code, id) {
        if (id.replaceAll('\\', '/').endsWith('/src/views/CajaView.jsx')) {
          return code.replace("from 'react'", "from 'virtual:checkout-hooks'")
            .replace("from 'dexie-react-hooks'", "from 'virtual:checkout-query'")
        }
      },
      resolveId(source, importer) {
        if (source === 'virtual:checkout-hooks') return '\0checkout-hooks'
        if (source === 'virtual:checkout-query') return '\0checkout-query'
        if (!importer?.replaceAll('\\', '/').endsWith('/src/views/CajaView.jsx')) return
        if (source === 'dexie-react-hooks') return '\0checkout-query'
        if (source === '../db/db') return '\0checkout-db'
        if (source.startsWith('../components/')) return `\0checkout-component:${source.split('/').at(-1).replace('.jsx', '')}`
      },
      load(id) {
        if (id === '\0checkout-hooks') return `
          const h = globalThis.__checkoutHarness;
          export function useState(initial) {
            const i = h.hookIndex++;
            if (!(i in h.state)) h.state[i] = initial;
            return [h.state[i], value => { h.state[i] = value }];
          }
          export const useCallback = fn => fn;
          export const useMemo = fn => fn();
          export const useEffect = () => {};
        `
        if (id === '\0checkout-query') return 'export const useLiveQuery = () => [];'
        if (id === '\0checkout-db') return 'export const db = globalThis.__checkoutHarness.db;'
        if (id.startsWith('\0checkout-component:')) return `export default function ${id.split(':')[1]}() { return null; }`
      },
    }],
  })
  const { default: CajaView } = await server.ssrLoadModule('/src/views/CajaView.jsx')
  const view = CajaView()
  confirmarCobro = view.props.children.find(child => child?.type?.name === 'CheckoutModal').props.onConfirm
  printer = await server.ssrLoadModule('/src/utils/printer.js')
})

afterEach(async () => {
  await server?.close()
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
  else delete globalThis.navigator
  delete globalThis.__checkoutHarness
})

function bluetoothError(name) {
  return Object.assign(new Error(name), { name })
}

function installPrinter({ selectionError, connectionError, writeError } = {}) {
  const characteristic = {
    uuid: '00002af1-0000-1000-8000-00805f9b34fb',
    properties: { write: true },
    writeValue: async (bytes) => {
      if (writeError) throw writeError
      harness.writes.push(...bytes)
    },
  }
  const device = {
    name: 'Test printer',
    addEventListener() {},
    gatt: {
      connected: false,
      async connect() {
        harness.connects += 1
        if (connectionError) throw connectionError
        this.connected = true
        return { getPrimaryService: async () => ({ getCharacteristics: async () => [characteristic] }) }
      },
    },
  }
  navigator.bluetooth = {
    requestDevice: async () => {
      harness.selections += 1
      if (selectionError) throw selectionError
      return device
    },
  }
}

function assertSaleCompleted() {
  assert.equal(harness.sales.length, 1)
  assert.equal(harness.sales[0].total, 200)
  assert.equal(harness.sales[0].metodoPago, 'efectivo')
  assert.equal(harness.sales[0].items[0].subtotal, 200)
  assert.equal(harness.product.existencia, 3)
  assert.deepEqual(harness.state[4], []) // Cart
  assert.equal(harness.state[5], false) // Checkout popup
  assert.equal(harness.state[6], false) // Mobile cart
  assert.equal(harness.state[10].tipo, 'exito')
}

for (const name of ['NotFoundError', 'NotAllowedError', 'NetworkError']) {
  test(`${name} finalizes the sale without a receipt and releases processing`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    installPrinter({ selectionError: bluetoothError(name) })
    await confirmarCobro({ metodoPago: 'efectivo' })
    assertSaleCompleted()
    assert.equal(harness.state[9], false)
    assert.equal(harness.writes.length, 0)
    assert.equal(harness.selections, 1)
    if (name !== 'NetworkError') assert.equal(harness.state[10].texto, 'Venta registrada correctamente')
  })
}

test('a browser without Bluetooth still completes the sale', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  await confirmarCobro({ metodoPago: 'efectivo' })
  assertSaleCompleted()
  assert.equal(harness.state[9], false)
})

test('saving and popup cleanup complete while the device selector is still pending', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let rejectSelection
  navigator.bluetooth = { requestDevice: () => new Promise((_resolve, reject) => { rejectSelection = reject }) }
  const pendingSale = confirmarCobro({ metodoPago: 'efectivo' })
  await new Promise(resolve => setImmediate(resolve))
  assertSaleCompleted()
  rejectSelection(bluetoothError('NotFoundError'))
  await pendingSale
  assert.equal(harness.state[9], false)
})

test('a selected printer prints the saved ticket normally', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  installPrinter()
  await confirmarCobro({ metodoPago: 'efectivo' })
  assertSaleCompleted()
  assert.match(Buffer.from(harness.writes).toString('latin1'), /Ticket: 42/)
  assert.equal(harness.state[10].texto, 'Venta registrada y ticket impreso')
  assert.equal(harness.selections, 1)
})

test('an already connected printer is reused without another selector', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  installPrinter()
  assert.equal((await printer.connectPrinter()).success, true)
  await confirmarCobro({ metodoPago: 'efectivo' })
  assertSaleCompleted()
  assert.equal(harness.selections, 1)
  assert.equal(harness.connects, 1)
  assert.ok(harness.writes.length > 0)
})

for (const failure of ['connectionError', 'writeError']) {
  test(`a printer ${failure} preserves the completed sale`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    installPrinter({ [failure]: bluetoothError('NetworkError') })
    await confirmarCobro({ metodoPago: 'efectivo' })
    assertSaleCompleted()
    assert.equal(harness.state[9], false)
    assert.equal(harness.writes.length, 0)
  })
}

test('a database failure keeps the cart and popup and never prints', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  installPrinter()
  harness.db.transaction = async () => { throw new Error('No se pudo guardar') }
  await confirmarCobro({ metodoPago: 'efectivo' })
  assert.equal(harness.sales.length, 0)
  assert.equal(harness.product.existencia, 5)
  assert.equal(harness.state[4].length, 1)
  assert.equal(harness.state[5], true)
  assert.equal(harness.state[9], false)
  assert.equal(harness.state[10].tipo, 'error')
  assert.equal(harness.writes.length, 0)
})
