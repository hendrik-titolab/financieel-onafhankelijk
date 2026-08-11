import { useState, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'
import { PensionPlanner } from './PensionPlanner'

/**
 * Zelfstandige island-wrapper rond de PensionPlanner.
 * Bevat de naam- en sessie-logica die voorheen in App.tsx (de header) zat,
 * zodat de plannerpagina losstaat van react-router.
 *
 * "clientName" is intern de naam gebleven (exports/PDF gebruiken 'm zo), maar
 * in de UI heet het "Naam berekening": werkt zowel voor iemand die voor
 * zichzelf rekent ("stoppen op 60") als voor een adviseur met een klantdossier
 * ("Elvira de Jong 11 aug 2026").
 */
export default function PensionPlannerApp() {
  const [clientName, setClientName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [sessionClosed, setSessionClosed] = useState(false)

  const closeSession = useCallback(() => {
    setSessionKey((k) => k + 1)
    setClientName('')
    setSessionClosed(true)
    setTimeout(() => setSessionClosed(false), 3000)
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sessie-gesloten banner */}
      {sessionClosed && (
        <div className="fixed top-0 inset-x-0 z-50 bg-ink text-warmwhite text-sm font-medium text-center py-2.5 flex items-center justify-center gap-2 animate-pulse">
          <CheckCircle size={15} />
          Sessie afgesloten, alle invoer gewist
        </div>
      )}

      {/* Naam berekening (werkt voor zowel eigen gebruik als adviseursdossier) */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <span className="text-xs text-body flex-shrink-0">Naam berekening:</span>
        {editingName ? (
          <input
            autoFocus
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            placeholder="Bijv. 'stoppen op 60' of 'Elvira de Jong'"
            className="input-field text-sm py-1 w-52 md:w-64"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className={`text-sm font-medium hover:text-ink transition-colors border-b border-dashed border-line hover:border-ink truncate max-w-[220px] md:max-w-none ${
              clientName ? 'text-ink' : 'text-body italic'
            }`}
          >
            {clientName || 'Naam toevoegen'}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <PensionPlanner key={sessionKey} clientName={clientName} onCloseSession={closeSession} />
      </div>
    </div>
  )
}
