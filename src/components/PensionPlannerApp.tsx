import { useState, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'
import { PensionPlanner } from './PensionPlanner'

/**
 * Zelfstandige island-wrapper rond de PensionPlanner.
 * Bevat de klantnaam- en sessie-logica die voorheen in App.tsx (de header) zat,
 * zodat de plannerpagina losstaat van react-router.
 */
export default function PensionPlannerApp() {
  const [clientName, setClientName] = useState('Nieuwe klant')
  const [editingName, setEditingName] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [sessionClosed, setSessionClosed] = useState(false)

  const closeSession = useCallback(() => {
    setSessionKey((k) => k + 1)
    setClientName('Nieuwe klant')
    setSessionClosed(true)
    setTimeout(() => setSessionClosed(false), 3000)
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sessie-gesloten banner */}
      {sessionClosed && (
        <div className="fixed top-0 inset-x-0 z-50 bg-emerald-500 text-white text-sm font-medium text-center py-2.5 flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <CheckCircle size={15} />
          Sessie afgesloten — alle invoer gewist
        </div>
      )}

      {/* Klantnaam-balk (adviseursfunctie) */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <span className="text-xs text-slate-400 flex-shrink-0">Naam klant:</span>
        {editingName ? (
          <input
            autoFocus
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            className="input-field text-sm py-1 w-40 md:w-56"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors border-b border-dashed border-slate-300 hover:border-primary-400 truncate max-w-[160px] md:max-w-none"
          >
            {clientName}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <PensionPlanner key={sessionKey} clientName={clientName} onCloseSession={closeSession} />
      </div>
    </div>
  )
}
