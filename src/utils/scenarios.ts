import type { PensionInputs } from '../types'

/**
 * Scenario's: stresstests op de eigen invoer.
 *
 * Een scenario is geen voorspelling maar een "wat als". Het verandert de invoer vóór
 * de berekening en niets anders, zodat beide rekenkernen (calculatePension en
 * runMonteCarlo) het vanzelf op dezelfde manier meenemen. Gevraagd door Hendrik op
 * 28 september 2026, naar het voorbeeld van scenario-schakelaars in planningssoftware.
 *
 * Bewust niet als scenario: het wegvallen van een partner. Dat vraagt een moment van
 * overlijden, een nabestaandenpensioen en een ander inkomensdoel, en dat kent het
 * model nog niet (zie "Huishoudmodel is er half" in CLAUDE.md).
 */

export type AowScenario = 'normaal' | 'gehalveerd' | 'verdwenen'
export type Richting = 'lager' | 'normaal' | 'hoger'

export interface Scenarios {
  aow: AowScenario
  /** 2 procentpunt lager of hoger rendement, vóór en ná de pensioendatum. */
  rendement: Richting
  /** 1 procentpunt lagere of hogere inflatie, bij hetzelfde nominale rendement. */
  inflatie: Richting
  /** 5 jaar langer plannen. */
  langerLeven: boolean
  /** Werkgeverspensioen en lijfrente stijgen niet mee met de inflatie (de AOW wel). */
  geenIndexatie: boolean
}

export const GEEN_SCENARIO: Scenarios = {
  aow: 'normaal', rendement: 'normaal', inflatie: 'normaal', langerLeven: false, geenIndexatie: false,
}

export const SCENARIO_STAPPEN = {
  rendementProcentpunt: 2,
  inflatieProcentpunt: 1,
  langerLevenJaren: 5,
} as const

export function heeftScenario(s: Scenarios): boolean {
  return s.aow !== 'normaal' || s.rendement !== 'normaal' || s.inflatie !== 'normaal'
    || s.langerLeven || s.geenIndexatie
}

const teken = (r: Richting) => (r === 'lager' ? -1 : r === 'hoger' ? 1 : 0)

/**
 * De invoer zoals hij onder de gekozen scenario's wordt doorgerekend.
 *
 * AOW: het ingevulde netto bedrag wordt gehalveerd of op nul gezet, voor beide
 * partners. Over alleen een AOW-uitkering is de loonheffing nul (zie
 * aowNettoNaarBruto in pensionCalc.ts), dus het halve netto bedrag hoort bij het
 * halve bruto bedrag; de belasting over het aanvullend pensioen rekent de kern daarna
 * opnieuw uit.
 *
 * Inflatie: het nominale rendement blijft gelijk. Hogere inflatie betekent dan een
 * lager rendement ná inflatie, en vaste uitkeringen verliezen sneller koopkracht.
 */
export function pasScenarioToe(inputs: PensionInputs, s: Scenarios): PensionInputs {
  if (!heeftScenario(s)) return inputs

  const aowFactor = s.aow === 'gehalveerd' ? 0.5 : s.aow === 'verdwenen' ? 0 : 1
  const dRendement = teken(s.rendement) * SCENARIO_STAPPEN.rendementProcentpunt
  const dInflatie = teken(s.inflatie) * SCENARIO_STAPPEN.inflatieProcentpunt

  return {
    ...inputs,
    aowMaandBedragNetto: inputs.aowMaandBedragNetto * aowFactor,
    returnBeforeRetirement: inputs.returnBeforeRetirement + dRendement,
    returnAfterRetirement: inputs.returnAfterRetirement + dRendement,
    inflation: inputs.inflation + dInflatie,
    lifeExpectancy: inputs.lifeExpectancy + (s.langerLeven ? SCENARIO_STAPPEN.langerLevenJaren : 0),
    ...(s.geenIndexatie
      ? { employerPensionIndexatie: 'vast' as const, lijfrenteIndexatie: 'vast' as const }
      : {}),
    partner: {
      ...inputs.partner,
      aowMaandBedragNetto: inputs.partner.aowMaandBedragNetto * aowFactor,
      ...(s.geenIndexatie ? { employerPensionIndexatie: 'vast' as const } : {}),
    },
  }
}

/** De actieve scenario's in woorden, voor het scherm en de exports. */
export function scenarioOmschrijving(s: Scenarios): string[] {
  const regels: string[] = []
  if (s.aow === 'gehalveerd') regels.push('AOW gehalveerd')
  if (s.aow === 'verdwenen') regels.push('geen AOW')
  if (s.rendement !== 'normaal') {
    regels.push(`rendement ${SCENARIO_STAPPEN.rendementProcentpunt} procentpunt ${s.rendement}`)
  }
  if (s.inflatie !== 'normaal') {
    regels.push(`inflatie ${SCENARIO_STAPPEN.inflatieProcentpunt} procentpunt ${s.inflatie}`)
  }
  if (s.langerLeven) regels.push(`${SCENARIO_STAPPEN.langerLevenJaren} jaar langer leven`)
  if (s.geenIndexatie) regels.push('pensioenen niet geïndexeerd')
  return regels
}
