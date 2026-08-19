import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { History, RotateCcw } from 'lucide-react'
import ConfirmDialog from '../inventario/ConfirmDialog'
import { db } from '../../db/db'
import { formatFecha, formatHora } from '../../lib/date'
import { restaurarSnapshot } from '../../lib/snapshots'
import { cn } from '../../lib/utils'

export default function SnapshotsPanel({ onMensaje }) {
  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('fecha').reverse().toArray(),
    [],
  )

  const [snapshotPendiente, setSnapshotPendiente] = useState(null)
  const [restaurando, setRestaurando] = useState(false)

  async function handleConfirmarRestauracion() {
    if (!snapshotPendiente) return

    setRestaurando(true)
    try {
      const resultado = await restaurarSnapshot(snapshotPendiente.id)
      setSnapshotPendiente(null)
      onMensaje(
        'exito',
        `Punto de restauración del ${formatFecha(resultado.fecha)} aplicado (${resultado.productos} productos, ${resultado.ventas} ventas). Recargando…`,
      )
      window.setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      onMensaje('error', error.message || 'No se pudo restaurar el snapshot')
      setRestaurando(false)
    }
  }

  return (
    <>
      <div className="panel-card p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-5 w-5 text-[#B3542D] dark:text-[#8C4A32]" />
          <h3 className="text-base font-semibold text-carbon dark:text-[#E5E5E5]">
            Puntos de Restauración (Snapshots)
          </h3>
        </div>

        <p className="mb-4 text-sm text-carbon/60 dark:text-[#A8A29E]">
          Respaldos internos creados automáticamente al cerrar el día. Se conservan los últimos 30
          puntos de restauración.
        </p>

        {!snapshots ? (
          <p className="text-sm text-carbon/60 dark:text-[#A8A29E]">Cargando snapshots…</p>
        ) : snapshots.length === 0 ? (
          <p className="rounded-xl bg-[#B3542D]/10 px-4 py-3 text-sm text-carbon/70 dark:bg-[#292524] dark:text-[#A8A29E]">
            Aún no hay puntos de restauración. Se creará uno al cerrar el día con éxito.
          </p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((snapshot) => {
              const productos =
                snapshot.totalProductos ?? snapshot.datos?.productos?.length ?? 0

              return (
                <li
                  key={snapshot.id}
                  className="flex flex-col gap-3 rounded-xl bg-[#B3542D]/10 px-4 py-3 shadow-sm dark:border dark:border-[#332F2D] dark:bg-[#24211F] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-carbon dark:text-[#E5E5E5]">
                      {formatFecha(snapshot.fecha)} · {formatHora(snapshot.fecha)}
                    </p>
                    <p className="text-sm text-carbon/60 dark:text-[#A8A29E]">
                      {productos} producto(s) respaldado(s)
                      {(snapshot.totalVentas ?? snapshot.datos?.ventas?.length ?? 0) > 0 &&
                        ` · ${snapshot.totalVentas ?? snapshot.datos?.ventas?.length} venta(s)`}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={restaurando}
                    onClick={() => setSnapshotPendiente(snapshot)}
                    className={cn(
                      'flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm active:scale-[0.98]',
                      restaurando
                        ? 'cursor-not-allowed bg-[#D8CCC0] text-[#8C7E72] dark:bg-[#E5E5E5]/10 dark:text-[#A8A29E]/40'
                        : 'bg-[#B3542D] text-white hover:bg-[#9C431F] dark:bg-[#8C4A32] dark:hover:bg-[#7A3F29]',
                    )}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurar
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(snapshotPendiente)}
        title="Restaurar punto de restauración"
        message={
          snapshotPendiente
            ? `Se reemplazarán todos los datos actuales con el respaldo del ${formatFecha(snapshotPendiente.fecha)} a las ${formatHora(snapshotPendiente.fecha)} (${snapshotPendiente.totalProductos ?? snapshotPendiente.datos?.productos?.length ?? 0} productos). Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, restaurar"
        onConfirm={handleConfirmarRestauracion}
        onCancel={() => !restaurando && setSnapshotPendiente(null)}
        processing={restaurando}
      />
    </>
  )
}
