import type { PensionInputs, PensionResult, MonteCarloResult } from '../types'

export interface Doorrekening {
  inputs: PensionInputs
  result: PensionResult
  mc: MonteCarloResult
}

/** Eén waarde in de vergelijking. Euro's blijven getallen, zodat Excel ermee kan rekenen. */
export type Waarde =
  | { soort: 'eur'; bedrag: number }
  | { soort: 'kans'; pct: number }
  | { soort: 'tekst'; tekst: string }

export interface VergelijkingsRegel {
  label: string
  zonder: Waarde
  met: Waarde
}

const eur = (bedrag: number): Waarde => ({ soort: 'eur', bedrag })
const kans = (pct: number): Waarde => ({ soort: 'kans', pct })
const tekst = (t: string): Waarde => ({ soort: 'tekst', tekst: t })

function slechtWeer(d: Doorrekening): Waarde {
  return d.result.yearsToRetirement > 0 ? eur(d.mc.slechtWeerBijPensioen) : tekst('n.v.t., al met pensioen')
}

function inleg(d: Doorrekening): Waarde {
  return d.result.yearsToRetirement === 0
    ? tekst('n.v.t., al met pensioen')
    : eur(Math.max(0, d.result.requiredMonthlyContribution))
}

/**
 * De uitkomst zonder en met scenario naast elkaar, voor de PDF en de Excel.
 *
 * Tot 28 september 2026 gaf de export bij een scenario alleen de scenariouitkomst,
 * met één regel over de uitkomst zonder scenario. Hendrik wil in het rapport allebei
 * volledig zien: het scenario is een stresstest op zijn plan, en zonder het plan
 * zelf ernaast zegt het rapport weinig.
 */
export function vergelijkingsRegels(zonder: Doorrekening, met: Doorrekening): VergelijkingsRegel[] {
  const regel = (label: string, f: (d: Doorrekening) => Waarde): VergelijkingsRegel =>
    ({ label, zonder: f(zonder), met: f(met) })

  return [
    regel('Verwacht eindvermogen', d => eur(d.result.projectedCapital)),
    regel('Benodigd eindvermogen', d => eur(d.result.requiredCapital)),
    regel('Overschot (+) of tekort (-)', d => eur(d.result.projectedCapital - d.result.requiredCapital)),
    regel('Benodigde maandinleg', inleg),
    regel('Kans op volledig inkomensdoel', d => kans(d.mc.successRate)),
    regel('Kans op 75% van het inkomensdoel', d => kans(d.mc.successRate75)),
    regel('Eindvermogen bij slecht weer (5e percentiel)', slechtWeer),
    regel('Tekort in de opbouwfase', d => d.result.opbouwTekort
      ? tekst(`vanaf leeftijd ${d.result.opbouwTekort.leeftijd}`)
      : tekst('geen')),
    regel('Plan loopt vast vanaf leeftijd', d => tekst(
      d.result.firstShortfallAge !== null ? String(d.result.firstShortfallAge) : 'niet binnen de looptijd')),
    // De leeftijd staat erbij, want "5 jaar langer leven" verschuift het eindpunt.
    regel('Restkapitaal aan het eind van de planning', d => eur(d.result.surplusAtEnd)),
    regel('Einde planning (leeftijd)', d => tekst(String(d.inputs.lifeExpectancy))),
  ]
}
