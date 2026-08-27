import { useEffect, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import ModalPortal from '../ui/ModalPortal'

const INITIAL = {
  clienteNombre: '',
  telefono: '',
  limiteCredito: '',
}

const inputClass =
  'w-full rounded-xl border border-[#D8C9BC] bg-white px-4 py-3.5 text-base text-carbon shadow-sm outline-none ring-[#B3542D] placeholder:text-[#8C7A6B] focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#E5E5E5] dark:ring-[#8C4A32] dark:placeholder:text-[#A8A29E]/60'

function creditoToForm(credito) {
  if (!credito) return INITIAL
  return {
    clienteNombre: credito.clienteNombre ?? '',
    telefono: credito.telefono ?? '',
    limiteCredito: credito.limiteCredito == null ? '' : String(credito.limiteCredito),
  }
}

export default function AltaClienteModal({ open, credito, onClose, onSave, processing }) {
  const [form, setForm] = useState(INITIAL)
  const isEditing = Boolean(credito?.id)

  useEffect(() => {
    if (!open) return
    setForm(creditoToForm(credito))
  }, [open, credito])

  if (!open) return null

  function handleClose() {
    if (processing) return
    setForm(INITIAL)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (processing) return

    const nombre = form.clienteNombre.trim()
    const limite = parseFloat(form.limiteCredito)

    if (!nombre) return
    if (!Number.isFinite(limite) || limite <= 0) return

    const saldoActual = Number(credito?.saldoActual) || 0
    if (isEditing && limite + 0.001 < saldoActual) return

    try {
      await onSave({
        clienteNombre: nombre,
        telefono: form.telefono.trim(),
        limiteCredito: limite,
      })
      setForm(INITIAL)
    } catch {
      // El padre muestra el error y el formulario conserva los valores.
    }
  }

  const limite = parseFloat(form.limiteCredito)
  const saldoActual = Number(credito?.saldoActual) || 0
  const limiteValido = Number.isFinite(limite) && limite > 0 && (!isEditing || limite + 0.001 >= saldoActual)
  const formValido = form.clienteNombre.trim() && limiteValido

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
          aria-label="Cerrar alta de cliente"
        />

        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full max-w-md rounded-t-xl bg-cream p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-xl dark:border dark:border-[#332F2D] dark:bg-[#24211F]"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B3542D]/15 text-[#B3542D] dark:bg-[#8C4A32]/25 dark:text-[#E5E5E5]">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-carbon dark:text-[#E5E5E5]">
                {isEditing ? 'Editar cliente' : 'Nuevo cliente a crédito'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#B3542D]/15 active:scale-95 dark:hover:bg-[#8C4A32]/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">
                Nombre del cliente
              </span>
              <input
                type="text"
                value={form.clienteNombre}
                onChange={(e) => setForm((prev) => ({ ...prev, clienteNombre: e.target.value }))}
                placeholder="Ej. María López"
                autoComplete="name"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">
                Teléfono <span className="font-normal">(opcional)</span>
              </span>
              <input
                type="tel"
                inputMode="tel"
                value={form.telefono}
                onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                placeholder="Ej. 499 123 4567"
                autoComplete="tel"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-carbon/70 dark:text-[#A8A29E]">
                Límite de crédito
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.limiteCredito}
                onChange={(e) => setForm((prev) => ({ ...prev, limiteCredito: e.target.value }))}
                placeholder="0.00"
                className={inputClass}
              />
            </label>

            {isEditing && Number.isFinite(limite) && limite + 0.001 < saldoActual && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                El límite no puede ser menor al saldo actual.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!formValido || processing}
            className={cn(
              'mt-6 flex w-full min-h-14 items-center justify-center rounded-full text-lg font-bold shadow-md transition-colors active:scale-[0.98]',
              formValido && !processing
                ? 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]'
                : 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40',
            )}
          >
            {processing ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </form>
      </div>
    </ModalPortal>
  )
}
