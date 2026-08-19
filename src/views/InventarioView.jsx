import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Package, Plus, Trash2, FileSpreadsheet } from 'lucide-react'
import ProductFilters from '../components/caja/ProductFilters'
import BulkImport from '../components/inventario/BulkImport'
import ConfirmDialog from '../components/inventario/ConfirmDialog'
import InventoryTable from '../components/inventario/InventoryTable'
import ManualProductModal from '../components/inventario/ManualProductModal'
import { db } from '../db/db'
import { exportInventarioToExcel } from '../lib/exportInventario'
import {
  categoriaSigueDisponible,
  etiquetaProducto,
  extraerCategoriasPorDepartamento,
  extraerMarcasPorTaxonomia,
  filtrarProductos,
  marcaSigueDisponible,
} from '../lib/productos'

export default function InventarioView() {
  const productos = useLiveQuery(() => db.productos.orderBy('departamento').toArray(), [])

  const [departamento, setDepartamento] = useState('Todos')
  const [categoria, setCategoria] = useState('Todas')
  const [marca, setMarca] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [vaciarOpen, setVaciarOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const categorias = useMemo(
    () => extraerCategoriasPorDepartamento(productos, departamento),
    [productos, departamento],
  )

  const categoriaActiva = categoriaSigueDisponible(categorias, categoria) ? categoria : 'Todas'

  useEffect(() => {
    if (categoria !== categoriaActiva) setCategoria(categoriaActiva)
  }, [categoria, categoriaActiva])

  const marcas = useMemo(
    () => extraerMarcasPorTaxonomia(productos, departamento, categoriaActiva),
    [productos, departamento, categoriaActiva],
  )

  const marcaActiva = marcaSigueDisponible(marcas, marca) ? marca : 'Todas'

  useEffect(() => {
    if (marca !== marcaActiva) setMarca(marcaActiva)
  }, [marca, marcaActiva])

  const productosFiltrados = useMemo(
    () => filtrarProductos(productos, departamento, categoriaActiva, marcaActiva, busqueda),
    [productos, departamento, categoriaActiva, marcaActiva, busqueda],
  )

  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3500)
  }

  const handleBulkImport = useCallback(async ({ productos, omitidos, erroresArchivo }) => {
    if (productos.length > 0) {
      await db.productos.bulkAdd(productos)
    }

    const exitosos = productos.length
    let texto = `Importación completa. Se agregaron ${exitosos} productos exitosamente. Se omitieron ${omitidos} filas por errores de formato o categorías inválidas.`

    if (erroresArchivo?.length) {
      texto += ` ${erroresArchivo.length} archivo(s) no se pudieron procesar.`
    }

    const tipo =
      exitosos === 0 && (omitidos > 0 || erroresArchivo?.length)
        ? 'error'
        : omitidos > 0 || erroresArchivo?.length
          ? 'exito'
          : 'exito'

    mostrarMensaje(tipo, texto)
  }, [])

  const cerrarModalProducto = useCallback(() => {
    setManualOpen(false)
    setEditingProduct(null)
  }, [])

  const handleManualSave = useCallback(
    async (datos) => {
      setProcessing(true)
      try {
        if (editingProduct?.id != null) {
          await db.productos.update(editingProduct.id, datos)
          cerrarModalProducto()
          mostrarMensaje('exito', 'Producto actualizado')
          return
        }

        await db.productos.add(datos)
        cerrarModalProducto()
        mostrarMensaje('exito', 'Producto agregado al inventario')
      } catch (error) {
        mostrarMensaje(
          'error',
          editingProduct?.id != null
            ? 'No se pudo actualizar el producto'
            : 'No se pudo agregar el producto',
        )
        throw error
      } finally {
        setProcessing(false)
      }
    },
    [cerrarModalProducto, editingProduct],
  )

  const handleUpdate = useCallback(async (id, cambios) => {
    try {
      await db.productos.update(id, cambios)
    } catch {
      mostrarMensaje('error', 'No se pudo actualizar el producto')
    }
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setProcessing(true)
    try {
      await db.productos.delete(deleteTarget.id)
      setDeleteTarget(null)
      mostrarMensaje('exito', 'Producto eliminado')
    } catch {
      mostrarMensaje('error', 'No se pudo eliminar el producto')
    } finally {
      setProcessing(false)
    }
  }, [deleteTarget])

  const handleVaciarInventario = useCallback(async () => {
    setProcessing(true)
    try {
      await db.productos.clear()
      setVaciarOpen(false)
      mostrarMensaje('exito', 'Inventario vaciado correctamente')
    } catch {
      mostrarMensaje('error', 'No se pudo vaciar el inventario')
    } finally {
      setProcessing(false)
    }
  }, [])

  const handleExportExcel = useCallback(() => {
    if (!productos?.length) {
      mostrarMensaje('error', 'No hay productos para exportar')
      return
    }

    try {
      exportInventarioToExcel(productos)
      mostrarMensaje('exito', 'Inventario exportado a Excel')
    } catch (error) {
      mostrarMensaje('error', error.message || 'No se pudo exportar el inventario')
    }
  }, [productos])

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-cream shadow-md dark:bg-[#1C1917]">
      <header className="view-header flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-4 shadow-sm md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-[#D48C70] shadow-sm dark:bg-[#292524]/90 dark:text-[#8C4A32]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-carbon dark:text-[#E5E5E5] md:text-xl">Inventario</h2>
            <p className="text-xs text-carbon/70 dark:text-[#A8A29E] md:text-sm">
              {productos
                ? `${productosFiltrados.length} de ${productos.length} productos`
                : 'Cargando…'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!productos?.length}
            className="btn-primary flex min-h-11 items-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar inventario a Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null)
              setManualOpen(true)
            }}
            className="btn-primary flex min-h-11 items-center gap-2 px-5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Alta manual
          </button>
          <button
            type="button"
            onClick={() => setVaciarOpen(true)}
            disabled={!productos?.length}
            className="flex min-h-11 items-center gap-2 rounded-full border-0 bg-red-50 px-5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Vaciar inventario
          </button>
        </div>
      </header>

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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-4 md:p-5">
          <BulkImport onImport={handleBulkImport} disabled={processing} />
        </div>

        <div className="sticky top-0 z-20">
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
        </div>

        <InventoryTable
          productos={productosFiltrados}
          onUpdate={handleUpdate}
          onEditRequest={(producto) => {
            setEditingProduct(producto)
            setManualOpen(true)
          }}
          onDeleteRequest={setDeleteTarget}
        />
      </div>

      <ManualProductModal
        open={manualOpen}
        producto={editingProduct}
        processing={processing}
        onClose={cerrarModalProducto}
        onSave={handleManualSave}
      />

      <ConfirmDialog
        open={vaciarOpen}
        title="Vaciar inventario"
        message="Se eliminarán todos los productos del catálogo. Esta acción no se puede deshacer."
        confirmLabel="Sí, vaciar todo"
        onConfirm={handleVaciarInventario}
        onCancel={() => setVaciarOpen(false)}
        processing={processing}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar producto"
        message={
          deleteTarget
            ? `¿Eliminar "${etiquetaProducto(deleteTarget)}" (Talla ${deleteTarget.talla})?`
            : ''
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        processing={processing}
      />
    </section>
  )
}
