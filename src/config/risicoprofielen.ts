/**
 * RISICOPROFIELEN — GEGENEREERD BESTAND
 *
 * !! NIET met de hand aanpassen !!
 *
 * Bron:      C:/Users/schak/Documents/Fiscale bron/fiscale-cijfers.json
 * Genereren: node genereer.mjs   (in die map)
 *
 * Verwacht MEETKUNDIG (samengesteld) nominaal jaarrendement, bruto (voor kosten en belasting). Besluit Hendrik 28 september 2026, vervangt de eigen huisvisie van 12 augustus 2026. Bouwstenen: aandelen 8,0% met volatiliteit 20%, obligaties 3,5% met volatiliteit 8%, correlatie 0. Aandelen: Deutsches Aktieninstitut, MSCI World-rendementsdriehoek stand 31 december 2025 (MSCI World gross total return in euro, voor 1999 D-mark), gemiddeld 8,0% over 25 en 7,9% over 30 jaar spaarduur. Obligaties: ECB-rentecurve eurozone, 10-jaars AAA spot 3,47% continu op 21 september 2026, is 3,53% per jaar, afgerond 3,5%. Volatiliteiten en correlatie: advies Commissie Parameters 29 november 2022, tabel 2.8 en 2.9. Mix: rekenkundig = meetkundig + halve variantie (art. 23a lid 6 Besluit financieel toetsingskader pensioenfondsen), portefeuille rekenkundig gewogen, dan terug naar meetkundig met de portefeuillevariantie. Na de pensioendatum een stap defensiever: zeer defensief 0/100, defensief 10/90, neutraal 30/70, offensief 50/50, zeer offensief 70/30. Getoetst in risicoprofielen.test.ts in de website-repo.
 *
 * monteCarlo.ts stemt zijn trekkingen hierop af: sampleAnnualReturn() trekt
 * lognormaal, zodat de mediaan van het samengestelde pad op deze percentages
 * uitkomt (bevinding E8, 12 augustus 2026).
 */

export type RiskProfile =
  | 'zeer_defensief'
  | 'defensief'
  | 'neutraal'
  | 'offensief'
  | 'zeer_offensief'

export interface Risicoprofiel {
  label: string
  rendementVoor: number     // nominaal % vóór pensioendatum
  rendementNa: number       // nominaal % ná pensioendatum
  volatiliteitVoor: number  // std.dev % vóór pensioendatum
  volatiliteitNa: number    // std.dev % ná pensioendatum
  uitleg: string
}

// Volgorde bepaalt de stand van de schuif (links = defensief, rechts = offensief)
export const PROFIEL_VOLGORDE: RiskProfile[] = [
  'zeer_defensief',
  'defensief',
  'neutraal',
  'offensief',
  'zeer_offensief',
]

export const RISICOPROFIELEN: Record<RiskProfile, Risicoprofiel> = {
  zeer_defensief: {
    label: 'Zeer defensief',
    rendementVoor: 4.2, rendementNa: 3.5,
    volatiliteitVoor: 7.5, volatiliteitNa: 8,
    uitleg: 'Ongeveer 10% aandelen en 90% obligaties. Weinig schommeling, maar ook een laag verwacht rendement.',
  },
  defensief: {
    label: 'Defensief',
    rendementVoor: 5.3, rendementNa: 4.2,
    volatiliteitVoor: 8.2, volatiliteitNa: 7.5,
    uitleg: 'Ongeveer 30% aandelen en 70% obligaties. Beperkte schommeling.',
  },
  neutraal: {
    label: 'Neutraal',
    rendementVoor: 6.3, rendementNa: 5.3,
    volatiliteitVoor: 10.8, volatiliteitNa: 8.2,
    uitleg: 'Ongeveer half aandelen, half obligaties. Een gebalanceerde afweging tussen rendement en risico.',
  },
  offensief: {
    label: 'Offensief',
    rendementVoor: 7.1, rendementNa: 6.3,
    volatiliteitVoor: 14.2, volatiliteitNa: 10.8,
    uitleg: 'Ongeveer 70% aandelen en 30% obligaties. Hoger verwacht rendement, maar grotere schommelingen onderweg.',
  },
  zeer_offensief: {
    label: 'Zeer offensief',
    rendementVoor: 7.8, rendementNa: 7.1,
    volatiliteitVoor: 18, volatiliteitNa: 14.2,
    uitleg: 'Ongeveer 90% aandelen en 10% obligaties. Hoogste verwachte rendement, maar ook de grootste schommelingen.',
  },
}
