import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { etiquetaProducto } from '../../lib/productos'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

function CartContent({
  items,
  total,
  onCambiarCantidad,
  onEliminar,
  onEditarPrecio,
  onCobrar,
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[#8C7A6B] dark:text-[#A8A29E]">
            <ShoppingCart className="h-12 w-12 text-[#C4B4A4] dark:text-[#A8A29E]/40" />
            <p className="text-base">El carrito está vacío</p>
            <p className="text-sm">Toca &quot;+ Agregar&quot; en un producto</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.cartItemId}
                className="rounded-xl border border-[#E8DFD5] bg-white p-3 shadow-[0_2px_8px_rgba(100,60,30,0.04)] dark:border-[#332F2D] dark:bg-[#24211F] dark:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#261A12] dark:text-[#E5E5E5]">{etiquetaProducto(item)}</p>
                    <p className="text-sm text-[#8C7A6B] dark:text-[#A8A29E]">Talla {item.talla}</p>
                    <button
                      type="button"
                      onClick={() => onEditarPrecio(item)}
                      className="mt-1 rounded-full px-2 py-1 text-left text-sm font-semibold text-[#B3542D] transition-colors hover:bg-[#B3542D]/10 active:scale-[0.98] dark:text-[#8C4A32] dark:hover:bg-[#8C4A32]/20"
                    >
                      {formatCurrency(item.precio)}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEliminar(item.cartItemId)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 active:scale-95 dark:hover:bg-red-950/50"
                    aria-label="Eliminar del carrito"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCambiarCantidad(item.cartItemId, item.cantidad - 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E2D5C7] bg-white text-[#543D2E] shadow-sm active:scale-95 dark:border-transparent dark:bg-[#292524] dark:text-[#E5E5E5]"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="min-w-[2rem] text-center text-lg font-bold text-[#261A12] dark:text-[#E5E5E5]">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCambiarCantidad(item.cartItemId, item.cantidad + 1)}
                      disabled={!item.puedeAumentar}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full border border-[#E2D5C7] bg-white text-[#543D2E] shadow-sm active:scale-95 dark:border-transparent dark:bg-[#292524] dark:text-[#E5E5E5]',
                        !item.puedeAumentar && 'cursor-not-allowed opacity-40',
                      )}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-base font-bold text-[#261A12] dark:text-[#E5E5E5]">
                    {formatCurrency(item.precio * item.cantidad)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[#E2D5C7] bg-[#EDE4DA] p-4 dark:border-transparent dark:bg-[#1C1917] dark:shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-medium text-[#8C7A6B] dark:text-[#A8A29E]">Total</span>
          <span className="text-3xl font-extrabold tracking-tight text-[#261A12] dark:text-[#E5E5E5]">
            {formatCurrency(total)}
          </span>
        </div>

        <button
          type="button"
          disabled={items.length === 0}
          onClick={onCobrar}
          className={cn(
            'flex w-full min-h-16 items-center justify-center rounded-full text-lg font-bold shadow-md transition-colors active:scale-[0.98]',
            items.length === 0
              ? 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
              : 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
          )}
        >
          Cobrar ({formatCurrency(total)})
        </button>
      </div>
    </>
  )
}

export default function CartPanel({
  items,
  total,
  onCambiarCantidad,
  onEliminar,
  onEditarPrecio,
  onCobrar,
  mobileOpen,
  onMobileOpenChange,
}) {
  return (
    <>
      <aside className="hidden w-96 shrink-0 flex-col overflow-hidden border-l border-[#E2D5C7] bg-[#EDE4DA] shadow-md dark:border-transparent dark:bg-[#1C1917] lg:flex">
        <div className="px-4 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#261A12] dark:text-[#E5E5E5]">
            <ShoppingCart className="h-5 w-5 text-[#B3542D] dark:text-[#8C4A32]" />
            Carrito
            {items.length > 0 && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-bold text-[#B3542D] dark:bg-[#292524] dark:text-[#8C4A32]">
                {items.reduce((sum, i) => sum + i.cantidad, 0)}
              </span>
            )}
          </h2>
        </div>

        <CartContent
          items={items}
          total={total}
          onCambiarCantidad={onCambiarCantidad}
          onEliminar={onEliminar}
          onEditarPrecio={onEditarPrecio}
          onCobrar={onCobrar}
        />
      </aside>

      <button
        type="button"
        onClick={() => onMobileOpenChange(true)}
        className="fixed bottom-6 right-6 z-30 flex min-h-14 items-center gap-2 rounded-full bg-[#B3542D] px-5 py-3 text-base font-bold text-white shadow-md hover:bg-[#9C431F] active:scale-95 dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29] lg:hidden"
      >
        <ShoppingCart className="h-6 w-6" />
        Carrito
        {items.length > 0 && (
          <span className="rounded-full bg-white px-2 py-0.5 text-sm font-bold text-[#B3542D] dark:bg-[#292524] dark:text-[#8C4A32]">
            {items.reduce((sum, i) => sum + i.cantidad, 0)}
          </span>
        )}
      </button>

      {mobileOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => onMobileOpenChange(false)}
              aria-label="Cerrar carrito"
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-xl bg-[#EDE4DA] pb-[env(safe-area-inset-bottom)] shadow-2xl dark:bg-[#1C1917]">
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#261A12] dark:text-[#E5E5E5]">
                <ShoppingCart className="h-5 w-5 text-[#B3542D] dark:text-[#8C4A32]" />
                Carrito
              </h2>
              <button
                type="button"
                onClick={() => onMobileOpenChange(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#543D2E] hover:bg-[#B3542D]/10 active:scale-95 dark:text-[#E5E5E5] dark:hover:bg-[#8C4A32]/20"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <CartContent
              items={items}
              total={total}
              onCambiarCantidad={onCambiarCantidad}
              onEliminar={onEliminar}
              onEditarPrecio={onEditarPrecio}
              onCobrar={() => {
                onCobrar()
                onMobileOpenChange(false)
              }}
            />
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
