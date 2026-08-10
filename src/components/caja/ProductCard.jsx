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
          <p className="text-xs font-semibold uppercase tracking-wide text-[#D48C70] dark:text-[#8C4A32]">
            {producto.marca}
          </p>
        )}
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#333333] dark:text-[#E5E5E5]">
          {producto.descripcion ?? producto.marcaDescripcion ?? 'Producto'}
        </h3>
        <p className="mt-1 text-sm text-[#333333]/60 dark:text-[#A8A29E]">
          Talla: <span className="font-medium text-[#333333]/80 dark:text-[#E5E5E5]/80">{producto.talla}</span>
        </p>
        <p className="mt-0.5 text-xs text-[#333333]/50 dark:text-[#A8A29E]/80">
          Stock: {producto.existencia}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="text-xl font-bold text-[#333333] dark:text-[#E5E5E5]">{formatCurrency(producto.precio)}</p>

        <button
          type="button"
          disabled={sinStock}
          onClick={handleAgregar}
          aria-label="Agregar al carrito"
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors active:scale-[0.97] touch-manipulation',
            sinStock
              ? 'cursor-not-allowed bg-[#333333]/10 text-[#333333]/40 dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
              : 'bg-[#D48C70] text-white hover:bg-[#C27A5F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
          )}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
    </article>
  )
}
