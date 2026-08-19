import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { etiquetaProducto } from '../../lib/productos'
import { cn } from '../../lib/utils'

function EditableNumber({ value, onSave, min = 0, step = '1', className }) {
  return (
    <input
      type="number"
      defaultValue={value}
      key={`${value}`}
      min={min}
      step={step}
      inputMode={step.includes('.') ? 'decimal' : 'numeric'}
      onBlur={(e) => {
        const parsed = step.includes('.') ? parseFloat(e.target.value) : parseInt(e.target.value, 10)
        if (Number.isFinite(parsed) && parsed >= min && parsed !== value) {
          onSave(parsed)
        }
      }}
      className={cn(
        'w-full min-w-[5rem] rounded-xl border-0 bg-cream px-3 py-2.5 text-base font-medium text-carbon shadow-sm outline-none ring-brand-500 focus:ring-2 dark:bg-[#292524] dark:text-[#E5E5E5] dark:ring-[#8C4A32]',
        className,
      )}
    />
  )
}

export default function InventoryTable({ productos, onUpdate, onEditRequest, onDeleteRequest }) {
  if (!productos) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-carbon/60 dark:text-[#A8A29E]">Cargando inventario…</p>
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-medium text-carbon dark:text-[#E5E5E5]">Inventario vacío</p>
          <p className="mt-1 text-sm text-carbon/60 dark:text-[#A8A29E]">
            Importa un archivo Excel/CSV o agrega productos manualmente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left">
        <thead className="sticky top-0 z-10 bg-cream text-xs font-semibold uppercase tracking-wide text-carbon/70 dark:bg-[#1C1917] dark:text-[#A8A29E]">
          <tr>
            <th className="px-4 py-3">Departamento</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Marca</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3">Talla</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Existencia</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto, index) => {
            const descripcion = producto.descripcion ?? producto.marcaDescripcion ?? ''

            return (
              <tr
                key={producto.id}
                className={cn(
                  'transition-colors hover:bg-[#D48C70]/15 dark:hover:bg-[#8C4A32]/20',
                  index % 2 === 1 && 'bg-[#D48C70]/10 dark:bg-[#24211F]',
                )}
              >
                <td className="px-4 py-3 text-sm font-medium text-carbon/80 dark:text-[#A8A29E]">
                  {producto.departamento?.trim() || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-carbon/70 dark:text-[#A8A29E]">{producto.categoria}</td>
                <td className="px-4 py-3 text-sm font-medium text-carbon/80 dark:text-[#A8A29E]">
                  {producto.marca?.trim() || '—'}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-carbon dark:text-[#E5E5E5]">{descripcion}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-carbon/80 dark:text-[#A8A29E]">{producto.talla}</td>
                <td className="px-4 py-3">
                  <EditableNumber
                    value={producto.precio}
                    step="0.01"
                    onSave={(precio) => onUpdate(producto.id, { precio })}
                    className="text-[#D48C70] dark:text-[#8C4A32]"
                  />
                  <p className="mt-0.5 text-xs text-carbon/50 dark:text-[#A8A29E]/80">{formatCurrency(producto.precio)}</p>
                </td>
                <td className="px-4 py-3">
                  <EditableNumber
                    value={producto.existencia}
                    onSave={(existencia) => onUpdate(producto.id, { existencia })}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditRequest(producto)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#D48C70] hover:bg-[#D48C70]/15 active:scale-95 dark:text-[#8C4A32] dark:hover:bg-[#8C4A32]/20"
                      aria-label={`Editar ${etiquetaProducto(producto)}`}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(producto)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-red-500 hover:bg-red-50 active:scale-95 dark:hover:bg-red-950/40"
                      aria-label={`Eliminar ${etiquetaProducto(producto)}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
