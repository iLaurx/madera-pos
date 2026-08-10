import { useState } from 'react'
import { Plus, X } from 'lucide-react'
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

export default function ManualProductModal({ open, onClose, onSave, processing }) {
  const [form, setForm] = useState(INITIAL)

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
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-900 outline-none ring-brand-500 focus:border-brand-500 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800'

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
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <Plus className="h-5 w-5 text-[#D48C70]" />
            Alta manual de producto
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Departamento
              </span>
              <select
                value={form.departamento}
                onChange={(e) => handleChange('departamento', e.target.value)}
                className={inputClass}
              >
                {DEPARTAMENTOS_PRODUCTO.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Categoría</span>
              <select
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className={inputClass}
              >
                {CATEGORIAS_PRODUCTO.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Marca</span>
            <input
              type="text"
              value={form.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              placeholder="Ej. Nike, Adidas…"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Descripción</span>
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
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Talla / Número</span>
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
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Precio</span>
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
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Existencia</span>
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
              processing ? 'cursor-not-allowed bg-slate-300' : 'bg-[#D48C70] hover:bg-[#C27A5F]',
            )}
          >
            {processing ? 'Guardando…' : 'Agregar producto'}
          </button>
        </form>
      </div>
    </div>
  )
}
