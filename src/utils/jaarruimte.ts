import type { JaarruimteInputs, JaarruimteResult, PensioenType } from '../types'
import { JAARRUIMTE_PARAMS, BOX1_PRE_AOW, JAARRUIMTE_BELASTINGJAREN } from '../config/fiscaleParameters'

// Alle fiscale parameters komen uit src/config/fiscaleParameters.ts
// !! Alleen dát bestand aanpassen bij een kwartaalcheck !!

function getParams(year: number) {
  return JAARRUIMTE_PARAMS[year] ?? JAARRUIMTE_PARAMS[2026]
}

// Het plafond van de reserveringsruimte hoort bij het jaar waarin je de ruimte
// benut, niet bij de jaren waaruit de onbenutte ruimte komt. Wat je dat jaar niet
// kwijt kunt, schuift door naar volgend jaar zolang je binnen de terugkijktermijn
// blijft.
//
// Tot en met 2022 bestond er geen enkel plafond: het waren twee bedragen,
// afhankelijk van of je binnen tien jaar van je AOW-leeftijd zat. Voor die jaren
// is het veld daarom leeg. Dat kan alleen voorkomen als er een belastingjaar
// wordt doorgegeven dat de tool niet aanbiedt, en dan is stilzwijgend doorrekenen
// erger dan stoppen.
function getReserveringsruimteMax(year: number): number {
  const max = JAARRUIMTE_PARAMS[year]?.reserveringsruimteMax
  if (max === undefined) {
    throw new Error(
      `Geen plafond voor de reserveringsruimte bekend voor ${year}. ` +
      `Tot en met 2022 was dat leeftijdsafhankelijk en dat kent deze tool niet. ` +
      `Kies een jaar uit getAvailableYears().`
    )
  }
  return max
}

// Berekent alleen de jaarruimte voor een enkel jaar — gebruikt in de reserveringsruimte-wizard
export function berekenJaarruimteEenvoudig(
  jaar: number,
  inkomen: number,
  pensioenType: PensioenType,
  factorA: number,
  werkgeverspremie: number,
): number {
  const p = getParams(jaar)
  const base = Math.max(0, Math.min(inkomen, p.maxInkomen) - p.franchise)
  if (pensioenType === 'db')  return Math.max(0, p.percentage * base - p.factorMultiplier * factorA)
  if (pensioenType === 'wtp') return Math.max(0, p.percentage * base - werkgeverspremie)
  return Math.max(0, p.percentage * base)
}

export function calculateJaarruimte(inputs: JaarruimteInputs): JaarruimteResult {
  const { year, income, pensioenType, factorA, werkgeverspremie, alIngelegd, reserveringsruimteRijen } = inputs
  const p = getParams(year)

  const effectiveIncome = Math.min(income, p.maxInkomen)
  const base = Math.max(0, effectiveIncome - p.franchise)

  // Jaarruimte formula depends on pension type:
  // - geen:  30% (or 13.3% pre-2023) × grondslag, no deduction
  // - db:    percentage × grondslag − factorMultiplier × factorA
  // - wtp:   percentage × grondslag − werkgeverspremie (employer contribution replaces factor A)
  let jaarruimte: number
  if (pensioenType === 'db') {
    jaarruimte = Math.max(0, p.percentage * base - p.factorMultiplier * factorA)
  } else if (pensioenType === 'wtp') {
    jaarruimte = Math.max(0, p.percentage * base - (werkgeverspremie ?? 0))
  } else {
    // geen pensioenregeling
    jaarruimte = Math.max(0, p.percentage * base)
  }

  // Reserveringsruimte: som van de onbenutte jaarruimten uit voorgaande jaren,
  // afgetopt op het plafond van dít belastingjaar. Wat er boven valt gaat niet
  // verloren, dat schuift door naar een volgend jaar zolang je binnen de
  // terugkijktermijn blijft.
  //
  // Het plafond wordt pas opgevraagd als er iets af te toppen valt. Voor de jaren
  // tot en met 2022 bestaat er namelijk geen enkel plafond, en dan moet de
  // jaarruimte zelf nog gewoon te berekenen zijn.
  const teVerdelen = reserveringsruimteRijen.filter(r => r.onbenutBedrag > 0)
  let beschikbareReserveringsruimte = 0
  if (teVerdelen.length > 0) {
    const maxReserveringsruimte = getReserveringsruimteMax(year)
    for (const rij of teVerdelen) {
      beschikbareReserveringsruimte = Math.min(
        beschikbareReserveringsruimte + rij.onbenutBedrag,
        maxReserveringsruimte
      )
    }
  }

  const totaalBeschikbaar = jaarruimte + beschikbareReserveringsruimte
  const nogTeDoen = Math.max(0, totaalBeschikbaar - (alIngelegd ?? 0))

  // Marginaal belastingtarief (pre-AOW schijven uit centrale config).
  // Het belastingvoordeel = hoeveel belasting je bespaart door de lijfrenteaftrek.
  let belastingTarief: number
  if (income > BOX1_PRE_AOW.schijf2Grens) belastingTarief = BOX1_PRE_AOW.schijf3Tarief
  else if (income > BOX1_PRE_AOW.schijf1Grens) belastingTarief = BOX1_PRE_AOW.schijf2Tarief
  else belastingTarief = BOX1_PRE_AOW.schijf1Tarief
  const belastingVoordeel = nogTeDoen * belastingTarief

  return {
    jaarruimte,
    beschikbareReserveringsruimte,
    totaalBeschikbaar,
    alIngelegd: alIngelegd ?? 0,
    nogTeDoen,
    belastingVoordeel,
    belastingTarief,
  }
}

// Alleen het Wtp-regime vanaf 2023. Vóór dat jaar was het plafond van de
// reserveringsruimte leeftijdsafhankelijk en dat kent deze tool niet, dus zou een
// berekening over 2020 tot en met 2022 een te hoge uitkomst geven. Een historische
// reconstructie valt buiten de scope; geen antwoord is daar beter dan een verkeerd
// antwoord. De lijst komt uit de fiscale bron, zie fiscaleParameters.ts.
export function getAvailableYears(): number[] {
  return [...JAARRUIMTE_BELASTINGJAREN]
}

// Oudste jaar waarvoor er werkelijk fiscale parameters zijn. getParams() valt voor
// een onbekend jaar stil terug op 2026, wat in het Wft-domein het vervelendste
// soort fout is: geen melding, wel een verkeerd bedrag. Deze grens sluit het pad
// naar die terugval af aan de invoerkant.
export function getOudsteParameterJaar(): number {
  return Math.min(...Object.keys(JAARRUIMTE_PARAMS).map(Number))
}

export function isPreWtp(year: number): boolean {
  return year < 2023
}

// Return a human-readable note about the chosen year's parameters
export function getJaarruimteParamsNote(year: number): string {
  const p = getParams(year)
  const isOld = isPreWtp(year)
  const pct = isOld ? '13,3%' : '30%'
  const factor = isOld ? '7,44' : '6,27'
  return `Franchise €${p.franchise.toLocaleString('nl-NL')} · Max inkomen €${p.maxInkomen.toLocaleString('nl-NL')} · ${pct} − ${factor} × factor A`
}
