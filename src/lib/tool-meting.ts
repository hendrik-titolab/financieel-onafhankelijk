import { useEffect } from 'react'

// Alleen het slagen van de berekening gaat naar de meetlaag, geen invoer/uitkomst.
// Eerste render telt niet: de meetlaag vereist eerst een echte invoerhandeling.
export function useToolMeting(toolId: string, result: unknown) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.siteMeting?.toolResult(toolId, result !== null && result !== undefined, 'validation'), 500)
    return () => window.clearTimeout(timer)
  }, [toolId, result])
}

// Oude Vercel-events omzetten naar de beperkte, toestemmingsgebonden meetlaag.
export function track(name: string) {
  if (typeof window === 'undefined') return
  if (name === 'download_pdf' || name === 'download_excel') {
    window.siteMeting?.event('tool_export', { tool_id: 'fo-planner', file_type: name === 'download_pdf' ? 'pdf' : 'xlsx' })
  }
}
