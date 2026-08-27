import { useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import CajaView from './views/CajaView'
import CreditosView from './views/CreditosView'
import InventarioView from './views/InventarioView'
import ReportesView from './views/ReportesView'

const VIEWS = {
  caja: CajaView,
  inventario: InventarioView,
  creditos: CreditosView,
  reportes: ReportesView,
}

export default function App() {
  const [activeView, setActiveView] = useState('caja')
  const ActiveComponent = VIEWS[activeView]

  return (
    <AppLayout activeView={activeView} onNavigate={setActiveView}>
      <ErrorBoundary key={activeView}>
        <ActiveComponent />
      </ErrorBoundary>
    </AppLayout>
  )
}
