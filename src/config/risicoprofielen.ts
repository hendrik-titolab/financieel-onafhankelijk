/**
 * Risicoprofielen voor de pensioenplanner.
 * Elk profiel stelt het verwachte (nominale) rendement en de volatiliteit in,
 * zowel vóór als ná de pensioendatum.
 *
 * Basis: eigen huisvisie, geen externe bron zoals bij fiscaleParameters.ts.
 * De percentages zijn bedoeld als verwachte meetkundige (samengestelde)
 * jaarrendementen, conform wat gangbaar is in Nederlandse consumentenrekentools
 * — besluit Hendrik, 12 augustus 2026 (zie AUDIT-2026-08-bevindingen.md, A12/E8).
 * monteCarlo.ts stemt zijn trekkingen hierop af: sampleAnnualReturn() trekt
 * lognormaal, zodat de mediaan van het samengestelde pad op deze percentages
 * uitkomt (doorgevoerd 12 augustus 2026, bevinding E8).
 *
 * Pas hier gerust de getallen aan naar de eigen huisvisie.
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
    rendementVoor: 3.0, rendementNa: 2.5,
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
    rendementVoor: 6.0, rendementNa: 4.0,
    volatiliteitVoor: 12, volatiliteitNa: 8,
    uitleg: 'Ongeveer half aandelen, half obligaties. Een gebalanceerde afweging tussen rendement en risico.',
  },
  offensief: {
    label: 'Offensief',
    rendementVoor: 7.5, rendementNa: 5.0,
    volatiliteitVoor: 16, volatiliteitNa: 10,
    uitleg: 'Overwegend aandelen. Hoger verwacht rendement, maar grotere schommelingen onderweg.',
  },
  zeer_offensief: {
    label: 'Zeer offensief',
    rendementVoor: 9.0, rendementNa: 6.0,
    volatiliteitVoor: 20, volatiliteitNa: 12,
    uitleg: 'Vrijwel volledig aandelen. Hoogste verwachte rendement, maar ook de grootste schommelingen.',
  },
}
