import { useCallback, useRef } from 'react'
import { Plus } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'

export default function ProductCard({ producto, onAgregar }) {
  const sinStock = producto.existencia <= 0
  const tappingRef = useRef(false)

  const handleAgregar = useCallback(() => {
    if (sinStock || tappingRef.current) return

    tappingRef.current = true
    try {
      onAgregar(producto)
    } finally {
      window.setTimeout(() => {
        tappingRef.current = false
      }, 400)
    }
  }, [onAgregar, producto, sinStock])

  return (
    <article
      className={cn(
        'panel-card flex flex-col p-4',
        sinStock && 'opacity-60',
      )}
    >
      <div className="mb-3 flex-1">
        {producto.marca?.trim() && (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8C7A6B] dark:text-[#8C4A32]">
            {producto.marca}
          </p>
        )}
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#261A12] dark:text-[#E5E5E5]">
          {producto.descripcion ?? producto.marcaDescripcion ?? 'Producto'}
        </h3>
        <p className="mt-1 text-sm text-[#8C7A6B] dark:text-[#A8A29E]">
          Talla: <span className="font-medium text-[#543D2E] dark:text-[#E5E5E5]/80">{producto.talla}</span>
        </p>
        <p className="mt-0.5 text-xs text-[#8C7A6B] dark:text-[#A8A29E]/80">
          Stock: {producto.existencia}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="text-xl font-extrabold tracking-tight text-[#B3542D] dark:text-[#E5E5E5]">
          {formatCurrency(producto.precio)}
        </p>

        <button
          type="button"
          disabled={sinStock}
          onClick={handleAgregar}
          aria-label="Agregar al carrito"
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors active:scale-[0.97] touch-manipulation',
            sinStock
              ? 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
              : 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
          )}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
    </article>
  )
}
