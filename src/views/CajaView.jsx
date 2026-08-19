import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ShoppingCart } from 'lucide-react'
import CartPanel from '../components/caja/CartPanel'
import CheckoutModal from '../components/caja/CheckoutModal'
import PriceEditModal from '../components/caja/PriceEditModal'
import PrinterStatusButton from '../components/caja/PrinterStatusButton'
import ProductFilters from '../components/caja/ProductFilters'
import ProductGrid from '../components/caja/ProductGrid'
import { db } from '../db/db'
import {
  cantidadEnCarritoPorProducto,
  categoriaSigueDisponible,
  crearCartItemId,
  etiquetaProducto,
  extraerCategoriasPorDepartamento,
  extraerMarcasPorTaxonomia,
  filtrarProductos,
  marcaSigueDisponible,
  ordenarStockPrimero,
} from '../lib/productos'
import { safeVibrate } from '../lib/safeWeb'
import { printReceipt, connectPrinter } from '../utils/printer'

export default function CajaView() {
  const [departamento, setDepartamento] = useState('Todos')
  const [categoria, setCategoria] = useState('Todas')
  const [marca, setMarca] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [cartMobileOpen, setCartMobileOpen] = useState(false)
  const [productoPendiente, setProductoPendiente] = useState(null)
  const [itemEditandoPrecio, setItemEditandoPrecio] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const productos = useLiveQuery(() => db.productos.toArray(), [])

  const categorias = useMemo(
    () => extraerCategoriasPorDepartamento(productos, departamento),
    [productos, departamento],
  )

  const categoriaActiva = categoriaSigueDisponible(categorias, categoria) ? categoria : 'Todas'

  useEffect(() => {
    if (categoria !== categoriaActiva) setCategoria(categoriaActiva)
  }, [categoria, categoriaActiva])

  const marcas = useMemo(
    () => extraerMarcasPorTaxonomia(productos, departamento, categoriaActiva, { soloConExistencia: true }),
    [productos, departamento, categoriaActiva],
  )

  const marcaActiva = marcaSigueDisponible(marcas, marca) ? marca : 'Todas'

  useEffect(() => {
    if (marca !== marcaActiva) setMarca(marcaActiva)
  }, [marca, marcaActiva])

  const productosFiltrados = useMemo(
    () =>
      ordenarStockPrimero(
        filtrarProductos(productos, departamento, categoriaActiva, marcaActiva, busqueda),
      ),
    [productos, departamento, categoriaActiva, marcaActiva, busqueda],
  )

  const itemsCarrito = useMemo(
    () =>
      carrito.map((item) => {
        const enOtros = cantidadEnCarritoPorProducto(carrito, item.productoId, item.cartItemId)
        const puedeAumentar = enOtros + item.cantidad < item.existenciaMax

        return { ...item, puedeAumentar }
      }),
    [carrito],
  )

  const total = useMemo(
    () => carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    [carrito],
  )

  const solicitarAgregar = useCallback((producto) => {
    try {
      if (!producto?.id) return

      if (producto.existencia <= 0) {
        setMensaje({ tipo: 'error', texto: 'Producto sin existencia disponible' })
        setTimeout(() => setMensaje(null), 3000)
        return
      }

      const enCarrito = cantidadEnCarritoPorProducto(carrito, producto.id)
      if (enCarrito >= producto.existencia) {
        setMensaje({ tipo: 'error', texto: 'No hay más stock disponible para este producto' })
        setTimeout(() => setMensaje(null), 3000)
        return
      }

      setProductoPendiente(producto)
    } catch (error) {
      console.error('solicitarAgregar:', error)
      setMensaje({ tipo: 'error', texto: 'No se pudo abrir el formulario de precio' })
      setTimeout(() => setMensaje(null), 3000)
    }
  }, [carrito])

  const confirmarAgregarConPrecio = useCallback(
    (producto, precio) => {
      try {
        const enCarrito = cantidadEnCarritoPorProducto(carrito, producto.id)
        if (enCarrito >= producto.existencia) {
          setMensaje({ tipo: 'error', texto: 'No hay más stock disponible para este producto' })
          setTimeout(() => setMensaje(null), 3000)
          setProductoPendiente(null)
          return
        }

        setCarrito((prev) => [
          ...prev,
          {
            cartItemId: crearCartItemId(),
            productoId: producto.id,
            marca: producto.marca ?? '',
            descripcion: producto.descripcion ?? producto.marcaDescripcion ?? '',
            talla: producto.talla,
            precio,
            cantidad: 1,
            existenciaMax: producto.existencia,
          },
        ])
        setProductoPendiente(null)
        safeVibrate(30)
      } catch (error) {
        console.error('confirmarAgregarConPrecio:', error)
        setProductoPendiente(null)
        setMensaje({ tipo: 'error', texto: 'No se pudo agregar al carrito' })
        setTimeout(() => setMensaje(null), 3000)
      }
    },
    [carrito],
  )

  const cambiarCantidad = useCallback((cartItemId, nuevaCantidad) => {
    setCarrito((prev) => {
      const item = prev.find((i) => i.cartItemId === cartItemId)
      if (!item) return prev

      if (nuevaCantidad <= 0) {
        return prev.filter((i) => i.cartItemId !== cartItemId)
      }

      const enOtros = cantidadEnCarritoPorProducto(prev, item.productoId, cartItemId)
      const maxParaLinea = item.existenciaMax - enOtros
      const cantidad = Math.min(nuevaCantidad, maxParaLinea)

      return prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, cantidad } : i,
      )
    })
  }, [])

  const eliminarDelCarrito = useCallback((cartItemId) => {
    setCarrito((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
    setItemEditandoPrecio((current) =>
      current?.cartItemId === cartItemId ? null : current,
    )
  }, [])

  const cambiarPrecio = useCallback((cartItemId, precio) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, precio } : item,
      ),
    )
    setItemEditandoPrecio(null)
  }, [])

  const confirmarCobro = useCallback(
    async ({ metodoPago }) => {
      if (carrito.length === 0 || processing) return

      setProcessing(true)
      setMensaje(null)

      try {
        const fechaVenta = new Date()
        const itemsVenta = carrito.map((item) => ({
          productoId: item.productoId,
          marca: item.marca,
          descripcion: item.descripcion,
          talla: item.talla,
          precio: item.precio,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad,
        }))

        let printerSession = { success: false }
        try {
          printerSession = await connectPrinter()
        } catch (printerError) {
          console.error('connectPrinter:', printerError)
          printerSession = {
            success: false,
            error: printerError?.message || 'No se pudo conectar la impresora',
          }
        }

        const ventaId = await db.transaction('rw', db.ventas, db.productos, async () => {
          const cantidadPorProducto = carrito.reduce((acc, item) => {
            acc[item.productoId] = (acc[item.productoId] ?? 0) + item.cantidad
            return acc
          }, {})

          for (const [productoId, cantidad] of Object.entries(cantidadPorProducto)) {
            const producto = await db.productos.get(Number(productoId))
            const itemRef = carrito.find((i) => i.productoId === Number(productoId))
            if (!producto || producto.existencia < cantidad) {
              throw new Error(
                `Stock insuficiente para "${itemRef ? etiquetaProducto(itemRef) : 'producto'}"`,
              )
            }
          }

          const id = await db.ventas.add({
            fecha: fechaVenta,
            total,
            metodoPago,
            items: itemsVenta,
          })

          for (const [productoId, cantidad] of Object.entries(cantidadPorProducto)) {
            const producto = await db.productos.get(Number(productoId))
            await db.productos.update(Number(productoId), {
              existencia: producto.existencia - cantidad,
            })
          }

          return id
        })

        let printResult = printerSession
        if (printerSession.success) {
          try {
            printResult = await printReceipt({
              id: ventaId,
              fecha: fechaVenta,
              total,
              metodoPago,
              items: itemsVenta,
            })
          } catch (printError) {
            console.error('printReceipt:', printError)
            printResult = {
              success: false,
              error: printError?.message || 'Error inesperado al imprimir',
            }
          }
        }

        setCarrito([])
        setCheckoutOpen(false)

        let texto = 'Venta registrada correctamente'
        if (printResult.success) {
          texto = 'Venta registrada e ticket impreso'
        } else if (printResult.error !== 'No se seleccionó ninguna impresora') {
          texto = `Venta registrada. No se imprimió: ${printResult.error}`
        }

        setMensaje({ tipo: 'exito', texto })
        setTimeout(() => setMensaje(null), 4000)
      } catch (error) {
        setMensaje({
          tipo: 'error',
          texto: error.message || 'No se pudo completar la venta',
        })
      } finally {
        setProcessing(false)
      }
    },
    [carrito, total, processing],
  )

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-xl bg-cream shadow-md dark:bg-[#1C1917]">
      <header className="view-header flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 shadow-sm md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-[#D48C70] shadow-sm dark:bg-[#292524]/90 dark:text-[#8C4A32]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-carbon dark:text-[#E5E5E5] md:text-xl">Caja</h2>
            <p className="text-xs text-carbon/70 dark:text-[#A8A29E] md:text-sm">
              {productos ? `${productos.length} productos en catálogo` : 'Cargando…'}
            </p>
          </div>
        </div>

        <PrinterStatusButton
          onError={(texto) => {
            setMensaje({ tipo: 'error', texto })
            setTimeout(() => setMensaje(null), 4000)
          }}
        />
      </header>

      <ProductFilters
        departamento={departamento}
        onDepartamentoChange={setDepartamento}
        categoria={categoriaActiva}
        onCategoriaChange={setCategoria}
        categorias={categorias}
        marca={marcaActiva}
        onMarcaChange={setMarca}
        marcas={marcas}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
      />

      {mensaje && (
        <div
          className={`shrink-0 px-4 py-2 text-center text-sm font-medium ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <ProductGrid productos={productosFiltrados} onAgregar={solicitarAgregar} />
        </div>

        <CartPanel
          items={itemsCarrito}
          total={total}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminarDelCarrito}
          onEditarPrecio={setItemEditandoPrecio}
          onCobrar={() => setCheckoutOpen(true)}
          mobileOpen={cartMobileOpen}
          onMobileOpenChange={setCartMobileOpen}
        />
      </div>

      <PriceEditModal
        mode="add"
        producto={productoPendiente}
        open={Boolean(productoPendiente)}
        onConfirmAdd={confirmarAgregarConPrecio}
        onClose={() => setProductoPendiente(null)}
      />

      <PriceEditModal
        mode="edit"
        item={itemEditandoPrecio}
        open={Boolean(itemEditandoPrecio)}
        onConfirmEdit={cambiarPrecio}
        onClose={() => setItemEditandoPrecio(null)}
      />

      <CheckoutModal
        open={checkoutOpen}
        total={total}
        processing={processing}
        onConfirm={confirmarCobro}
        onClose={() => setCheckoutOpen(false)}
      />
    </section>
  )
}
