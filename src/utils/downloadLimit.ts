// Zachte grens op het aantal gratis downloads (Excel + PDF samen), bijgehouden
// in localStorage van de browser. Er is geen account en geen server, dus de
// teller hoort bij het apparaat/de browser, niet bij een persoon: wissen van
// de browsergegevens of een ander apparaat gebruiken reset 'm. Bedoeld als
// duidelijke, zichtbare grens, niet als een sluitende beveiliging.

const STORAGE_KEY = 'fp_download_count'
const ONBEPERKT_KEY = 'fp_downloads_onbeperkt'
export const FREE_DOWNLOAD_LIMIT = 3

/**
 * Uitzondering per apparaat, voor Hendrik zelf (28 september 2026). Een IP-adres
 * kent een statische site niet, en een thuis- of mobiel IP-adres wisselt ook.
 * Daarom een vlag in localStorage, gezet via de URL:
 *   ?downloads=onbeperkt  zet de grens uit op dit apparaat/in deze browser
 *   ?downloads=normaal    zet hem weer aan
 * Geen geheim: de grens zelf is ook met één klik in de browser te wissen.
 */
export function verwerkDownloadParameter(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const waarde = url.searchParams.get('downloads')
    if (waarde === null) return
    if (waarde === 'onbeperkt') window.localStorage.setItem(ONBEPERKT_KEY, 'ja')
    if (waarde === 'normaal') window.localStorage.removeItem(ONBEPERKT_KEY)
    // Uit de adresbalk halen, zodat een gekopieerde link de vlag niet meeneemt.
    url.searchParams.delete('downloads')
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    // localStorage geblokkeerd: dan geldt gewoon de grens.
  }
}

export function downloadsOnbeperkt(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ONBEPERKT_KEY) === 'ja'
  } catch {
    return false
  }
}

export function getDownloadCount(): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const n = raw ? parseInt(raw, 10) : 0
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function incrementDownloadCount(): number {
  const next = getDownloadCount() + 1
  window.localStorage.setItem(STORAGE_KEY, String(next))
  return next
}
