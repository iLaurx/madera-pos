import { Moon, Sparkles, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

export default function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div
      className={cn(
        'flex flex-col items-center',
        compact ? 'gap-0 p-0' : 'gap-2 px-2 py-1',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        onClick={toggleTheme}
        className={cn(
          'relative shrink-0 rounded-full p-1 transition-colors duration-300 ease-out',
          'shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)]',
          compact ? 'h-10 w-16' : 'h-12 w-[5.75rem]',
          isDark ? 'bg-[#292524]' : 'bg-[#CDB88A]',
        )}
      >
        <Sun
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 transition-opacity duration-300',
            compact ? 'right-2 h-4 w-4' : 'right-2.5 h-5 w-5',
            isDark ? 'text-amber-300/0' : 'text-[#8B6914] opacity-100',
          )}
          strokeWidth={2.5}
        />

        <div
          className={cn(
            'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 transition-opacity duration-300',
            compact ? 'left-1.5' : 'left-2',
            isDark ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Moon
            className={cn('fill-[#E5E5E5] text-[#E5E5E5]', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')}
            strokeWidth={2}
          />
          <Sparkles className={cn('text-[#A8A29E]', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} strokeWidth={2} />
        </div>

        <span
          className={cn(
            'absolute top-1 rounded-full bg-white transition-all duration-300 ease-out',
            'shadow-[0_3px_10px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.12)]',
            compact ? 'h-8 w-8' : 'h-10 w-10',
            isDark ? 'left-auto right-1' : 'left-1 right-auto',
          )}
        />
      </button>

      {!compact && (
        <span className="text-xs font-medium text-carbon/70 dark:text-[#A8A29E]">
          {isDark ? 'Modo oscuro' : 'Modo claro'}
        </span>
      )}
    </div>
  )
}
