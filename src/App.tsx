import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { TrendingUp, CheckCircle, Calculator } from 'lucide-react'
import { PensionPlanner } from './components/PensionPlanner'
import { BrutoNettoCalculator } from './components/BrutoNetto'
import { Voorwaarden } from './components/Voorwaarden'
import { Privacy } from './components/Privacy'

// ── Gedeelde header met navigatie ─────────────────────────────────────────────

interface HeaderProps {
  clientName: string
  editingName: boolean
  setEditingName: (v: boolean) => void
  setClientName: (v: string) => void
}

function Header({ clientName, editingName, setEditingName, setClientName }: HeaderProps) {
  const location = useLocation()
  const isPensionPage = location.pathname === '/'

  return (
    <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="hidden sm:block text-sm font-bold text-slate-900 leading-none">
            Financiële Planning
          </span>
        </div>

        {/* Navigatie */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1 rounded-lg text-sm font-medium transition leading-tight ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`
            }
          >
            <span className="flex flex-col">
              <span className="text-[10px] font-normal uppercase tracking-wide opacity-70">
                Rekentool
              </span>
              <span>Financieel onafhankelijk?</span>
            </span>
          </NavLink>
          <NavLink
            to="/bruto-netto"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`
            }
          >
            <Calculator size={14} />
            Bruto-netto
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-4 min-w-0">
        {/* Klantnaam — alleen zichtbaar op de pensioenplanner pagina */}
        {isPensionPage && (
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-400 flex-shrink-0">Naam:</span>
            {editingName ? (
              <input
                autoFocus
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                className="input-field text-sm py-1 w-36 md:w-48"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors border-b border-dashed border-slate-300 hover:border-primary-400 truncate max-w-[120px] md:max-w-none"
              >
                {clientName}
              </button>
            )}
          </div>
        )}

        {/* Altijd bereikbaar, ook vanaf de fixed-height plannerpagina die geen Footer toont */}
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
          <a href="/privacy" className="hover:text-primary-600 transition-colors">
            Privacy
          </a>
          <a href="/voorwaarden" className="hover:text-primary-600 transition-colors">
            Voorwaarden
          </a>
        </div>
      </div>
    </header>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-400 text-center flex-shrink-0">
      © {new Date().getFullYear()} benikfinancieelonafhankelijk.nl. Indicatieve berekeningen, geen financieel advies
      {' · '}
      <a href="/privacy" className="hover:text-primary-600 underline">
        Privacy
      </a>
      {' · '}
      <a href="/voorwaarden" className="hover:text-primary-600 underline">
        Voorwaarden
      </a>
    </footer>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [clientName, setClientName] = useState('Nieuwe klant')
  const [editingName, setEditingName] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [sessionClosed, setSessionClosed] = useState(false)

  const closeSession = useCallback(() => {
    setSessionKey(k => k + 1)
    setClientName('Nieuwe klant')
    setSessionClosed(true)
    setTimeout(() => setSessionClosed(false), 3000)
  }, [])

  return (
    <BrowserRouter>
      {/* Vercel Analytics: alleen paginabezoeken, geen cookies, geen persoonsgegevens */}
      <Analytics />
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Sessie-gesloten banner */}
        {sessionClosed && (
          <div className="fixed top-0 inset-x-0 z-50 bg-emerald-500 text-white text-sm font-medium text-center py-2.5 flex items-center justify-center gap-2 shadow-lg animate-pulse">
            <CheckCircle size={15} />
            Sessie afgesloten, alle invoer gewist
          </div>
        )}

        <Header
          clientName={clientName}
          editingName={editingName}
          setEditingName={setEditingName}
          setClientName={setClientName}
        />

        <Routes>
          {/* Pensioenplanner — desktop: fixed-height viewport met interne scroll */}
          <Route
            path="/"
            element={
              <main className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6">
                <PensionPlanner
                  key={sessionKey}
                  clientName={clientName}
                  onCloseSession={closeSession}
                />
              </main>
            }
          />
          {/* Bruto-netto calculator — standaard scrollende pagina */}
          <Route
            path="/bruto-netto"
            element={
              <>
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <BrutoNettoCalculator />
                </main>
                <Footer />
              </>
            }
          />
          {/* Algemene voorwaarden — standaard scrollende pagina */}
          <Route
            path="/voorwaarden"
            element={
              <>
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <Voorwaarden />
                </main>
                <Footer />
              </>
            }
          />
          {/* Privacy en gegevensgebruik — standaard scrollende pagina */}
          <Route
            path="/privacy"
            element={
              <>
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <Privacy />
                </main>
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
