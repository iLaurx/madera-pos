import { AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  processing = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-label="Cerrar"
      />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-cream p-6 shadow-2xl sm:rounded-xl dark:border dark:border-[#332F2D] dark:bg-[#24211F]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                variant === 'danger'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-brand-100 text-brand-600 dark:bg-[#292524] dark:text-[#8C4A32]',
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-carbon dark:text-[#E5E5E5]">{title}</h2>
              <p className="mt-1 text-sm text-carbon/70 dark:text-[#A8A29E]">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#B3542D]/10 active:scale-95 dark:hover:bg-[#8C4A32]/20"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-cream text-base font-semibold text-carbon shadow-sm active:scale-[0.98] dark:bg-[#292524] dark:text-[#A8A29E]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className={cn(
              'flex min-h-12 flex-1 items-center justify-center rounded-full text-base font-semibold text-white shadow-sm active:scale-[0.98]',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#B3542D] hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
              processing && 'cursor-not-allowed opacity-60',
            )}
          >
            {processing ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
