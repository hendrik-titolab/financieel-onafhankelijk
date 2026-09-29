/**
 * Rekenlogica van de inflatietool (/tools/inflatie).
 *
 * Stond tot 28 september 2026 in src/components/Inflatie/index.tsx. Verhuisd zodat
 * er toetsen op kunnen draaien, zelfde criterium als box3.ts en renteOpRente.ts
 * (review 28 september 2026, bevinding 9). De formules zijn letterlijk meegekomen.
 *
 * Jaarlijkse samengestelde groei, geen belasting in box 3: dat is een bewuste keuze
 * van deze tool, zie de noot onderaan de pagina.
 */

export interface Inputs {
  startbedrag: number
  inflatie: number // % per jaar
  spaarrente: number // % per jaar
  looptijd: number // jaren
}

export interface JaarRij {
  jaar: number
  nominaal: number
  koopkracht: number
  uitgehold: number // nominaal − koopkracht: wat inflatie van het saldo op de rekening afhaalt
}

export interface Uitkomst {
  jaren: JaarRij[]
  nominaalEind: number
  koopkrachtEind: number
  verliesEuro: number // t.o.v. het startbedrag van nu
  verliesPct: number
  reeelRendement: number // % per jaar
}

export function bereken({ startbedrag, inflatie, spaarrente, looptijd }: Inputs): Uitkomst {
  // Validatie: geen negatieve bedragen, rentes binnen 0–20%, looptijd 1–30.
  const s = Math.max(0, startbedrag || 0)
  const i = Math.min(20, Math.max(0, inflatie || 0)) / 100
  const r = Math.min(20, Math.max(0, spaarrente || 0)) / 100
  const jaar = Math.min(30, Math.max(1, Math.round(looptijd || 1)))

  const jaren: JaarRij[] = []
  for (let t = 0; t <= jaar; t++) {
    const nominaal = s * Math.pow(1 + r, t)
    const koopkracht = nominaal / Math.pow(1 + i, t)
    jaren.push({ jaar: t, nominaal, koopkracht, uitgehold: Math.max(0, nominaal - koopkracht) })
  }

  const nominaalEind = jaren[jaren.length - 1].nominaal
  const koopkrachtEind = jaren[jaren.length - 1].koopkracht
  const verliesEuro = s - koopkrachtEind // positief = koopkracht gedaald t.o.v. nu
  const verliesPct = s > 0 ? (verliesEuro / s) * 100 : 0
  const reeelRendement = ((1 + r) / (1 + i) - 1) * 100

  return { jaren, nominaalEind, koopkrachtEind, verliesEuro, verliesPct, reeelRendement }
}

