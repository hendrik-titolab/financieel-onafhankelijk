import { useCallback, useEffect, useState } from 'react'

// Chrome/Edge/Android sturen dit event vóórdat ze zelf een installatie-UI
// tonen; we onderscheppen het zodat we onze eigen knop kunnen laten werken.
// TypeScript kent dit event niet standaard.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-brede store i.p.v. een listener per component-instantie. Het
// `beforeinstallprompt`-event vuurt meestal vroeg, vlak na het laden van de
// pagina, ver vóórdat bijvoorbeeld het installatiebanner in de resultaten
// (die pas na een berekening mount) bestaat. Zonder een gedeelde store zou
// zo'n later-gemount component het event nooit te zien krijgen.
let capturedPrompt: BeforeInstallPromptEvent | null = null
let isStandaloneGlobal = false
let isIOSGlobal = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

if (typeof window !== 'undefined') {
  isStandaloneGlobal =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari heeft geen matchMedia-ondersteuning hiervoor, wel deze vlag
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  // iPadOS meldt zich sinds iPadOS 13 als "MacIntel"; touch-ondersteuning is
  // het enige onderscheid met een echte Mac.
  isIOSGlobal =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    capturedPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    capturedPrompt = null
    isStandaloneGlobal = true
    notify()
  })
}

/**
 * Gedeelde installatielogica voor de PWA-installatieknop en het banner in de
 * resultaten. iOS/iPadOS Safari heeft geen `beforeinstallprompt`-API, dus daar
 * bieden we in plaats daarvan de handmatige "Zet op beginscherm"-stappen aan.
 */
export function useInstallPrompt() {
  const [, forceRender] = useState(0)

  useEffect(() => {
    const listener = () => forceRender(n => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!capturedPrompt) return
    await capturedPrompt.prompt()
    await capturedPrompt.userChoice
    // Het prompt-object is maar één keer bruikbaar.
    capturedPrompt = null
    notify()
  }, [])

  const hasNativePrompt = capturedPrompt !== null
  // Er is iets zinnigs te doen: een echte installatieprompt, of (op iOS) een
  // duidelijke handmatige stap. Anders (bijv. desktop Firefox) niets tonen.
  const canInstall = !isStandaloneGlobal && (hasNativePrompt || isIOSGlobal)

  return { canInstall, hasNativePrompt, isIOS: isIOSGlobal, isStandalone: isStandaloneGlobal, promptInstall }
}
