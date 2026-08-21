/** YYYY-MM-DD en zona horaria local (no UTC). */
export function toLocalISODate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalISODate(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addCalendarDays(date = new Date(), days = 0) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDateForFilename(date = new Date()) {
  return toLocalISODate(date)
}

export function isSameDay(a, b = new Date()) {
  const dateA = new Date(a)
  const dateB = new Date(b)
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

export function formatFecha(date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatHora(date) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}
