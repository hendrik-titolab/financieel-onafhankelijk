import { useState, useCallback } from 'react'
import { TrendingUp, CheckCircle } from 'lucide-react'
import { PensionPlanner } from './components/PensionPlanner'

export default function App() {
  const [clientName, setClientName] = useState('Nieuwe klant')
  const [editingName, setEditingName] = useState(false)
  // Incrementing this key forces a full remount of the active components, wiping all their state
  const [sessionKey, setSessionKey] = useState(0)
  const [sessionClosed, setSessionClosed] = useState(false)

  const closeSession = useCallback(() => {
    setSessionKey(k => k + 1)
    setClientName('Nieuwe klant')
    setSessionClosed(true)
    setTimeout(() => setSessionClosed(false), 3000)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Session closed banner */}
      {sessionClosed && (
        <div className="fixed top-0 inset-x-0 z-50 bg-emerald-500 text-white text-sm font-medium text-center py-2.5 flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <CheckCircle size={15} />
          Sessie afgesloten — alle invoer gewist
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 leading-none">Financiële Planning</h1>
            <p className="text-xs text-slate-400 mt-0.5">Pensioenplanner</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Client name — hidden on very small screens */}
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

        </div>
      </header>

      {/* Main content — scrollable on mobile, fills height on desktop */}
      <main className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6">
        <PensionPlanner
          key={sessionKey}
          clientName={clientName}
          onCloseSession={closeSession}
        />
      </main>
    </div>
  )
}
