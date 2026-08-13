/**
 * RISICOPROFIELEN — GEGENEREERD BESTAND
 *
 * !! NIET met de hand aanpassen !!
 *
 * Bron:      C:/Users/schak/Documents/Fiscale bron/fiscale-cijfers.json
 * Genereren: node genereer.mjs   (in die map)
 *
 * Eigen huisvisie, geen externe onderbouwing. Verwacht MEETKUNDIG (samengesteld) nominaal jaarrendement, geen rekenkundig gemiddelde. Besluit 12 augustus 2026.
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
    rendementVoor: 3, rendementNa: 2.5,
    volatiliteitVoor: 5, volatiliteitNa: 4,
    uitleg: 'Vooral obligaties en spaargeld. Weinig schommeling, maar ook een laag verwacht rendement.',
  },
  defensief: {
    label: 'Defensief',
    rendementVoor: 4.5, rendementNa: 3.5,
    volatiliteitVoor: 8, volatiliteitNa: 6,
    uitleg: 'Overwegend obligaties met een deel aandelen. Beperkte schommeling.',
  },
  neutraal: {
    label: 'Neutraal',
    rendementVoor: 6, rendementNa: 4,
    volatiliteitVoor: 12, volatiliteitNa: 8,
    uitleg: 'Ongeveer half aandelen, half obligaties. Een gebalanceerde afweging tussen rendement en risico.',
  },
  offensief: {
    label: 'Offensief',
    rendementVoor: 7.5, rendementNa: 5,
    volatiliteitVoor: 16, volatiliteitNa: 10,
    uitleg: 'Overwegend aandelen. Hoger verwacht rendement, maar grotere schommelingen onderweg.',
  },
  zeer_offensief: {
    label: 'Zeer offensief',
    rendementVoor: 9, rendementNa: 6,
    volatiliteitVoor: 20, volatiliteitNa: 12,
    uitleg: 'Vrijwel volledig aandelen. Hoogste verwachte rendement, maar ook de grootste schommelingen.',
  },
}
