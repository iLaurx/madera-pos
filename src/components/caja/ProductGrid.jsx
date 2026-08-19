import ProductCard from './ProductCard'

export default function ProductGrid({ productos, onAgregar }) {
  if (!productos) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-[#8C7A6B] dark:text-[#A8A29E]">Cargando productos…</p>
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-medium text-carbon dark:text-[#E5E5E5]">No hay productos</p>
          <p className="mt-1 text-sm text-[#8C7A6B] dark:text-[#A8A29E]">
            Ajusta los filtros o agrega productos en Inventario.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onAgregar={onAgregar} />
      ))}
    </div>
  )
}
