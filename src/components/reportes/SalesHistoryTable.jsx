import { formatCurrency } from '../../lib/format'
import { formatFecha, formatHora } from '../../lib/date'
import { contarUnidades, formatItems, formatMetodoPago } from '../../lib/exportVentas'
import { cn } from '../../lib/utils'

export default function SalesHistoryTable({ ventas }) {
  if (!ventas) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-carbon/60 dark:text-[#A8A29E]">Cargando historial…</p>
      </div>
    )
  }

  if (ventas.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-medium text-carbon dark:text-[#E5E5E5]">Sin ventas registradas</p>
          <p className="mt-1 text-sm text-carbon/60 dark:text-[#A8A29E]">
            Las ventas realizadas en Caja aparecerán aquí.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead className="sticky top-0 z-10 bg-cream text-xs font-semibold uppercase tracking-wide text-carbon/70 dark:bg-[#1C1917] dark:text-[#A8A29E]">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Hora</th>
            <th className="px-4 py-3">Items cobrados</th>
            <th className="px-4 py-3">Método</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta, index) => (
            <tr
              key={venta.id}
              className={cn(
                'transition-colors hover:bg-[#D48C70]/15 dark:hover:bg-[#8C4A32]/20',
                index % 2 === 1 && 'bg-[#D48C70]/10 dark:bg-[#24211F]',
              )}
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm text-carbon/80 dark:text-[#A8A29E]">
                {formatFecha(venta.fecha)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-carbon dark:text-[#E5E5E5]">
                {formatHora(venta.fecha)}
              </td>
              <td className="px-4 py-3">
                <p className="line-clamp-2 text-sm text-carbon/80 dark:text-[#A8A29E]">{formatItems(venta.items)}</p>
                <p className="mt-0.5 text-xs text-carbon/50 dark:text-[#A8A29E]/80">
                  {contarUnidades(venta.items)} artículo(s)
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    venta.metodoPago === 'efectivo'
                      ? 'bg-[#D48C70]/15 text-carbon dark:bg-[#8C4A32]/25 dark:text-[#E5E5E5]'
                      : 'bg-[#FDF6F0] text-carbon dark:bg-[#292524] dark:text-[#A8A29E]',
                  )}
                >
                  {formatMetodoPago(venta.metodoPago)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold text-[#333333] dark:text-[#E5E5E5]">
                {formatCurrency(venta.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
