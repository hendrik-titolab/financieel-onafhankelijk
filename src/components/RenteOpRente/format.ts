// Nederlandse notatie voor de twee rente-op-rente-tools. Zelfde helpers als in de Inflatie-tool,
// hier apart zodat de matrix en de rekentool er allebei bij kunnen.

export const eur = (n: number, dec = 0): string =>
  '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const pct = (n: number, dec = 1): string =>
  n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%'

/** Heel getal als het kan, anders één decimaal: 6% en 7,5%. */
export const pctKort = (n: number): string =>
  n.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + '%'

/**
 * Een vermenigvuldiging leesbaar houden: onder de tien met één decimaal (× 1,4), daarboven
 * afgerond (× 24). Een factor van 24,52071 zegt niets meer dan 24.
 */
export const maalTekst = (v: number): string =>
  '× ' + v.toLocaleString('nl-NL', { maximumFractionDigits: v < 10 ? 1 : 0 })

/** "30 jaar", maar "1 jaar" zonder meervoud. */
export const jaarLabel = (jaren: number): string => `${jaren} jaar`
