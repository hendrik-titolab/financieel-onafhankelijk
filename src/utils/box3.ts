import { BOX3 } from '../config/fiscaleParameters'
import type { Woonsituatie } from '../types'

/**
 * Box 3 in de FO-planner.
 *
 * Het probleem dat dit oplost. De risicoprofielen werden in de UI aangeprezen als
 * "netto: wat je overhoudt na kosten van beleggen en na belasting in box 3",
 * terwijl risicoprofielen.ts diezelfde getallen als nominaal rendement
 * documenteert en de rekenkern nergens iets aftrok. Het uitlegartikel zei op de
 * ene regel "geen rekening met box 3" en twee regels verder "netto, na kosten en
 * na box 3". Drie plekken die elkaar tegenspraken, en geen ervan die rekende
 * (audit 7 september 2026, bevinding 10).
 *
 * Wat hier nu staat is een vereenvoudiging, en dat is een bewuste keuze. Een
 * volledig box 3-model met vermogensmix, schulden en fiscaal partnerschap bouwen
 * terwijl het stelsel richting heffing over werkelijk rendement beweegt, levert
 * een fiscale motor op die bij invoering opnieuw fout is. Voor een
 * Wft-vergunningaanvraag is dat een risico dat je niet neemt voor een uitkomst die
 * je ook eerlijk kunt benoemen.
 *
 * Daarom: de gebruiker vult zelf een belastingdruk in procentpunten in, en deze
 * module rekent voor wat die druk ongeveer is bij het opgegeven vermogen. Dat is
 * navolgbaar, het gebruikt uitsluitend gepubliceerde parameters, en het is één
 * plek om te vervangen zodra het volledige model er komt.
 *
 * VERVANGPUNT. Wie hier later het echte model inbouwt, vervangt
 * geschatteBox3Druk() door een jaarlijkse heffing per jaar in de kasstroomlus.
 * De aanroepers hoeven daarvoor niet te veranderen: pensionCalc.ts en
 * monteCarlo.ts kennen alleen nettoNominaalRendement() hieronder.
 */

/** Box 3-heffing over een vermogen in een jaar, in euro's. */
export function box3HeffingPerJaar(vermogen: number, woonsituatie: Woonsituatie): number {
  const vrij = woonsituatie === 'samenwonend'
    ? BOX3.heffingsvrijVermogen.fiscaalPartnersSamen
    : BOX3.heffingsvrijVermogen.alleenstaand

  const grondslag = Math.max(0, vermogen - vrij)
  // Het forfait voor beleggingen, niet dat voor spaargeld: de planner gaat uit van
  // vrij belegd vermogen. Wie vooral spaart betaalt minder, en zal deze schatting
  // dus naar beneden bijstellen.
  return grondslag * BOX3.forfaitairRendement.beleggingen * BOX3.tarief
}

/**
 * De box 3-druk als percentage van het totale vermogen, in procentpunten.
 *
 * Dit is precies waarom één vast percentage niet voor iedereen kan kloppen: door
 * het heffingsvrije vermogen loopt de druk op met de omvang van het vermogen. Bij
 * € 100.000 alleenstaand is het ongeveer 0,9 procentpunt, bij € 1.000.000 ruim
 * 2,0. Vandaar een invoerveld met deze schatting ernaast, en geen vast getal in
 * de code.
 */
export function geschatteBox3Druk(vermogen: number, woonsituatie: Woonsituatie): number {
  if (vermogen <= 0) return 0
  return (box3HeffingPerJaar(vermogen, woonsituatie) / vermogen) * 100
}

/**
 * Het nominale rendement dat overblijft na kosten en vermogensbelasting.
 *
 * Beide worden als procentpunten van het rendement afgetrokken, niet als
 * percentage ván het rendement: zo werken lopende kosten en zo werkt een
 * forfaitaire heffing over het vermogen ook. 6% bruto met 0,4% kosten en 1,9%
 * belasting geeft 3,7% netto.
 *
 * Staan beide op nul, dan verandert er niets aan de uitkomst. Dat is de
 * begintoestand: de tool rekende tot september 2026 met het volle rendement,
 * alleen zei de tekst iets anders.
 */
export function nettoNominaalRendement(
  brutoNominaal: number,
  kostenPct: number,
  belastingPct: number
): number {
  return brutoNominaal - (kostenPct || 0) - (belastingPct || 0)
}
