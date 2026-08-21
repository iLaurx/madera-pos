import { Banknote, Package, Smartphone, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'

function SummaryCard({ label, value, icon: Icon, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-100 text-brand-700 dark:bg-[#292524] dark:text-[#8C4A32]',
    emerald: 'bg-[#B3542D]/15 text-carbon dark:bg-[#292524] dark:text-[#A8A29E]',
    violet: 'bg-brand-50 text-brand-800 dark:bg-[#24211F] dark:text-[#8C4A32]',
    amber: 'bg-[#B3542D]/20 text-carbon dark:bg-[#292524] dark:text-[#A8A29E]',
  }

  return (
    <div className="panel-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-carbon/60 dark:text-[#A8A29E]">{label}</p>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-carbon dark:text-[#E5E5E5] md:text-3xl">{value}</p>
    </div>
  )
}

export default function DailySummary({ resumen, etiquetaPeriodo = 'hoy' }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard
        label={`Total vendido ${etiquetaPeriodo}`}
        value={formatCurrency(resumen.totalHoy)}
        icon={TrendingUp}
        accent="brand"
      />
      <SummaryCard
        label={`Productos vendidos ${etiquetaPeriodo}`}
        value={resumen.unidadesHoy}
        icon={Package}
        accent="emerald"
      />
      <SummaryCard
        label={`Efectivo ${etiquetaPeriodo}`}
        value={formatCurrency(resumen.efectivoHoy)}
        icon={Banknote}
        accent="amber"
      />
      <SummaryCard
        label={`Transferencia ${etiquetaPeriodo}`}
        value={formatCurrency(resumen.transferenciaHoy)}
        icon={Smartphone}
        accent="violet"
      />
    </div>
  )
}
