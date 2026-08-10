// Zachte grens op het aantal gratis downloads (Excel + PDF samen), bijgehouden
// in localStorage van de browser. Er is geen account en geen server, dus de
// teller hoort bij het apparaat/de browser, niet bij een persoon: wissen van
// de browsergegevens of een ander apparaat gebruiken reset 'm. Bedoeld als
// duidelijke, zichtbare grens, niet als een sluitende beveiliging.

const STORAGE_KEY = 'fp_download_count'
export const FREE_DOWNLOAD_LIMIT = 3

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
