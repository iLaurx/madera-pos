const STORAGE_KEY = 'madera-theme'

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* ignore */
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export function applyTheme(theme) {
  const isDark = theme === 'dark'
  const root = document.documentElement

  root.classList.remove('dark')
  if (isDark) {
    root.classList.add('dark')
  }

  root.style.colorScheme = isDark ? 'dark' : 'light'
  root.dataset.theme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#1C1917' : '#D0A890')
  }
}

export function setStoredTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') return

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }

  applyTheme(theme)
}

export function initTheme() {
  applyTheme(getStoredTheme())
}

export function toggleStoredTheme(currentTheme) {
  const next = currentTheme === 'dark' ? 'light' : 'dark'
  setStoredTheme(next)
  return next
}
