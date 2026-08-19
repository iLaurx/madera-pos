import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { etiquetaProducto } from '../../lib/productos'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

const inputClass =
  'w-full rounded-xl border border-[#D8C9BC] bg-white px-4 py-4 text-2xl font-bold text-[#261A12] outline-none ring-brand-500 focus:border-brand-500 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800'

export default function PriceEditModal({
  mode = 'edit',
  producto,
  item,
  open,
  onConfirmAdd,
  onConfirmEdit,
  onClose,
}) {
  const [precio, setPrecio] = useState('')

  const activo = mode === 'add' ? producto : item

  useEffect(() => {
    if (!open || !activo) return

    if (mode === 'add') {
      setPrecio(producto.precio > 0 ? String(producto.precio) : '')
      return
    }

    setPrecio(item.precio > 0 ? String(item.precio) : '')
  }, [open, mode, producto, item, activo])

  if (!open || !activo) return null

  const parsed = parseFloat(precio)
  const valido = Number.isFinite(parsed) && parsed > 0
  const cantidad = mode === 'edit' ? item.cantidad : 1
  const titulo = mode === 'add' ? 'Precio de venta' : 'Editar precio'
  const nombre = mode === 'add' ? etiquetaProducto(producto) : etiquetaProducto(item)
  const talla = mode === 'add' ? producto.talla : item.talla
  const precioBase = mode === 'add' ? producto.precio : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!valido) return

    if (mode === 'add') {
      onConfirmAdd(producto, parsed)
    } else {
      onConfirmEdit(item.cartItemId, parsed)
    }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-label="Cerrar"
        />

        <div className="relative z-10 w-full max-w-sm rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#261A12] dark:text-slate-100">{titulo}</h2>
            <p className="mt-1 text-sm text-[#543D2E] dark:text-slate-300">{nombre}</p>
            <p className="text-sm text-[#8C7A6B] dark:text-slate-400">Talla {talla}</p>
            {mode === 'add' && precioBase > 0 && (
              <p className="mt-1 text-xs text-[#A8998B] dark:text-slate-500">
                Precio base sugerido: {formatCurrency(precioBase)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#543D2E] hover:bg-[#EDE4DA] active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#8C7A6B] dark:text-slate-400">
              Precio unitario
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              autoFocus
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </label>

          {valido && (
            <p className="text-center text-sm text-[#8C7A6B] dark:text-slate-400">
              Subtotal ({cantidad} u.):{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(parsed * cantidad)}
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={!valido}
            className={cn(
              'flex w-full min-h-14 items-center justify-center rounded-2xl text-base font-bold active:scale-[0.98]',
              valido
                ? 'bg-[#B3542D] text-white hover:bg-[#9C431F]'
                : 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-slate-700 dark:text-slate-500',
            )}
          >
            {mode === 'add' ? 'Agregar al carrito' : 'Confirmar precio'}
          </button>
        </form>
        </div>
      </div>
    </ModalPortal>
  )
}
