import { useEffect, useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { CATEGORIAS_PRODUCTO, DEPARTAMENTOS_PRODUCTO } from '../../lib/constants'
import { cn } from '../../lib/utils'

const INITIAL = {
  departamento: DEPARTAMENTOS_PRODUCTO[0],
  categoria: CATEGORIAS_PRODUCTO[0],
  marca: '',
  descripcion: '',
  talla: '',
  precio: '',
  existencia: '',
}

function productoToForm(producto) {
  if (!producto) return INITIAL

  return {
    departamento: producto.departamento?.trim() || DEPARTAMENTOS_PRODUCTO[0],
    categoria: producto.categoria?.trim() || CATEGORIAS_PRODUCTO[0],
    marca: producto.marca ?? '',
    descripcion: producto.descripcion ?? producto.marcaDescripcion ?? '',
    talla: producto.talla ?? '',
    precio: producto.precio == null ? '' : String(producto.precio),
    existencia: producto.existencia == null ? '' : String(producto.existencia),
  }
}

function opcionesConValor(lista, valor) {
  if (!valor || lista.includes(valor)) return lista
  return [valor, ...lista]
}

export default function ManualProductModal({ open, producto, onClose, onSave, processing }) {
  const [form, setForm] = useState(INITIAL)
  const isEditing = Boolean(producto?.id)

  useEffect(() => {
    if (!open) return
    setForm(productoToForm(producto))
  }, [open, producto])

  if (!open) return null

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    if (processing) return
    setForm(INITIAL)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (processing) return

    const precio = parseFloat(form.precio)
    const existencia = parseInt(form.existencia, 10)

    if (!form.descripcion.trim() || !form.talla.trim()) return
    if (!Number.isFinite(precio) || precio < 0) return
    if (!Number.isFinite(existencia) || existencia < 0) return

    try {
      await onSave({
        departamento: form.departamento,
        categoria: form.categoria,
        marca: form.marca.trim(),
        descripcion: form.descripcion.trim(),
        talla: form.talla.trim(),
        precio,
        existencia,
      })
      setForm(INITIAL)
    } catch {
      // El padre muestra el error y el formulario conserva los valores.
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#D8C9BC] bg-white px-4 py-3.5 text-base text-[#261A12] outline-none ring-brand-500 focus:border-brand-500 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-label="Cerrar"
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#261A12] dark:text-slate-100">
            {isEditing ? (
              <Pencil className="h-5 w-5 text-[#B3542D]" />
            ) : (
              <Plus className="h-5 w-5 text-[#B3542D]" />
            )}
            {isEditing ? 'Editar Producto' : 'Alta manual de producto'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#543D2E] hover:bg-[#EDE4DA] active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">
                Departamento
              </span>
              <select
                value={form.departamento}
                onChange={(e) => handleChange('departamento', e.target.value)}
                className={inputClass}
              >
                {opcionesConValor(DEPARTAMENTOS_PRODUCTO, form.departamento).map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">Categoría</span>
              <select
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className={inputClass}
              >
                {opcionesConValor(CATEGORIAS_PRODUCTO, form.categoria).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">Marca</span>
            <input
              type="text"
              value={form.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              placeholder="Ej. Nike, Adidas…"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">Descripción</span>
            <input
              type="text"
              required
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Ej. Air Max 90"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">Talla / Número</span>
            <input
              type="text"
              required
              value={form.talla}
              onChange={(e) => handleChange('talla', e.target.value)}
              placeholder="Ej. 42, M, Única"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">Precio</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.precio}
                onChange={(e) => handleChange('precio', e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#8C7A6B] dark:text-slate-400">Existencia</span>
              <input
                type="number"
                required
                min="0"
                step="1"
                inputMode="numeric"
                value={form.existencia}
                onChange={(e) => handleChange('existencia', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={processing}
            className={cn(
              'flex w-full min-h-14 items-center justify-center rounded-2xl text-base font-bold text-white active:scale-[0.98]',
              processing ? 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72]' : 'bg-[#B3542D] hover:bg-[#9C431F]',
            )}
          >
            {processing ? 'Guardando…' : isEditing ? 'Guardar Cambios' : 'Agregar producto'}
          </button>
        </form>
      </div>
    </div>
  )
}
