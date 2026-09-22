import type { PensionResult, Indexatie } from '../types'

export interface OpbouwRegel {
  label: string
  /** Met teken: een aftrek is negatief. De regels tellen op tot requiredCapital. */
  bedrag: number
}

/**
 * De opbouw van het benodigd eindvermogen, regel voor regel, voor de PDF- en de
 * Excel-export.
 *
 * De regels tellen altijd op tot requiredCapital, want de vier delen uit
 * calculatePension() doen dat (zie PensionResult.overbruggingsToeslag). Tot
 * 22 september 2026 ontbraken het box 3-deel en een overbrugging na de AOW-datum,
 * en telde de opbouw in het rapport dan niet op. Bij stoppen op 68 met een erfenis
 * op 73 was € 120.637 nergens verklaard (review 22 september 2026, bevinding 3).
 *
 * Geeft een lege lijst als er niets uit te splitsen valt: dan is het benodigd
 * eindvermogen gewoon wat het inkomen kost, en staat dat al in de kaders.
 */
export function opbouwDoelbedrag(result: PensionResult): OpbouwRegel[] {
  const later = result.pvEventsAfterRetirement
  const regels: OpbouwRegel[] = [
    { label: 'Benodigd voor je inkomen', bedrag: result.requiredCapitalEindwaarde + later },
    ...(Math.round(later) !== 0
      ? [{
          label: later > 0
            ? 'Af: eenmalige bedragen na de pensioendatum (contante waarde)'
            : 'Bij: eenmalige bedragen na de pensioendatum (contante waarde)',
          bedrag: -later,
        }]
      : []),
    ...(Math.round(result.overbruggingsToeslag) !== 0
      ? [{ label: 'Bij: overbrugging tot dat geld binnenkomt', bedrag: result.overbruggingsToeslag }]
      : []),
    ...(Math.round(result.laterGeldOverschot) !== 0
      ? [{ label: 'Bij: later geld is meer dan nodig, telt niet mee', bedrag: result.laterGeldOverschot }]
      : []),
    ...(Math.round(result.box3Toeslag) !== 0
      ? [{ label: 'Bij: box 3-heffing', bedrag: result.box3Toeslag }]
      : []),
  ]
  return regels.length > 1 ? regels : []
}

/** Hoe een indexatiekeuze in een rapport staat. */
export function indexatieTekst(i: Indexatie | undefined): string {
  return i === 'vast' ? 'vast bedrag' : 'stijgt mee met inflatie'
}
