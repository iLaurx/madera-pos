import { cn } from '../../lib/utils'

const QUICK_BTN =
  'flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors active:scale-[0.98]'

function quickBtnClass(activo) {
  return cn(
    QUICK_BTN,
    activo
      ? 'bg-[#B3542D] text-white dark:bg-[#8C4A32]'
      : 'border border-[#D8C9BC] bg-white text-carbon hover:bg-[#B3542D]/10 dark:border-[#332F2D] dark:bg-[#292524] dark:text-[#E5E5E5] dark:hover:bg-[#8C4A32]/20',
  )
}

export default function DateFilterBar({
  fechaFiltro,
  fechaHoy,
  fechaAyer,
  onFechaChange,
  onHoy,
  onAyer,
  onVerTodo,
}) {
  const verTodo = fechaFiltro == null
  const esHoy = !verTodo && fechaFiltro === fechaHoy
  const esAyer = !verTodo && fechaFiltro === fechaAyer

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 sm:flex-none">
        <span className="text-xs font-semibold uppercase tracking-wide text-carbon/60 dark:text-[#A8A29E]">
          Fecha
        </span>
        <input
          type="date"
          value={fechaFiltro ?? ''}
          onChange={(event) => onFechaChange(event.target.value)}
          className="min-h-11 rounded-xl border border-[#D8C9BC] bg-white px-3 text-base font-medium text-carbon outline-none focus:border-[#B3542D] focus:ring-2 focus:ring-[#B3542D]/30 dark:border-[#332F2D] dark:bg-[#292524] dark:text-[#E5E5E5] dark:focus:border-[#8C4A32] dark:focus:ring-[#8C4A32]/30"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onHoy} className={quickBtnClass(esHoy)}>
          Hoy
        </button>
        <button type="button" onClick={onAyer} className={quickBtnClass(esAyer)}>
          Ayer
        </button>
        <button type="button" onClick={onVerTodo} className={quickBtnClass(verTodo)}>
          Ver Todo
        </button>
      </div>
    </div>
  )
}
