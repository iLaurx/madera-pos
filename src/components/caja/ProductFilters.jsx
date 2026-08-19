import { Search } from 'lucide-react'
import { CATEGORIAS, DEPARTAMENTOS } from '../../lib/constants'
import { cn } from '../../lib/utils'

export { CATEGORIAS, DEPARTAMENTOS }

const selectClass =
  'w-full rounded-xl border border-[#D8C9BC] bg-white px-4 py-3 text-base text-[#261A12] shadow-sm outline-none ring-[#B3542D] focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#A8A29E] dark:ring-[#8C4A32]'

function FilterPills({ label, options, value, onChange }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8C7A6B] dark:text-[#A8A29E]">
        {label}
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const isActive = value === option

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors active:scale-[0.97]',
                isActive
                  ? 'bg-[#B3542D] text-white shadow-[0_2px_8px_rgba(179,84,45,0.25)] hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:shadow-sm dark:hover:bg-[#7A3F29]'
                  : 'bg-[#EDE4DA] text-[#543D2E] hover:bg-[#E2D5C7] dark:bg-[#292524] dark:text-[#A8A29E] dark:hover:bg-[#332F2D]',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ProductFilters({
  departamento,
  onDepartamentoChange,
  categoria,
  onCategoriaChange,
  categorias = CATEGORIAS,
  marca,
  onMarcaChange,
  marcas = [],
  busqueda,
  onBusquedaChange,
}) {
  return (
    <div className="shrink-0 space-y-3 bg-cream px-4 py-3 shadow-sm dark:bg-[#1C1917]">
      <FilterPills
        label="Departamento"
        options={DEPARTAMENTOS}
        value={departamento}
        onChange={onDepartamentoChange}
      />

      <FilterPills
        label="Categoría"
        options={categorias}
        value={categoria}
        onChange={onCategoriaChange}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8C7A6B] dark:text-[#A8A29E]">
            Marca
          </span>
          <select value={marca} onChange={(e) => onMarcaChange(e.target.value)} className={selectClass}>
            <option value="Todas">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <div className="relative sm:col-span-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8C7A6B] dark:text-[#A8A29E]">
            Buscar
          </span>
          <Search className="pointer-events-none absolute bottom-3.5 left-4 h-5 w-5 text-[#8C7A6B] dark:text-[#A8A29E]/60" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Marca, descripción o talla…"
            className="w-full rounded-xl border border-[#D8C9BC] bg-white py-3.5 pl-12 pr-4 text-base text-[#261A12] shadow-sm outline-none ring-[#B3542D] placeholder:text-[#8C7A6B] focus:ring-2 dark:border-transparent dark:bg-[#292524] dark:text-[#A8A29E] dark:ring-[#8C4A32] dark:placeholder:text-[#A8A29E]/60"
          />
        </div>
      </div>
    </div>
  )
}
