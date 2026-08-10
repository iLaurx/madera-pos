export function isSecureWebContext() {
  try {
    return typeof window !== 'undefined' && window.isSecureContext === true
  } catch {
    return false
  }
}

export function safeVibrate(pattern = 30) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* API no disponible en HTTP / contexto no seguro */
  }
}

export async function safeClipboardWrite(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

export function safeRandomId(prefix = 'id') {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* crypto.randomUUID no disponible fuera de contexto seguro (HTTP en LAN) */
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
