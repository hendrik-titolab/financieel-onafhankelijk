import type { JaarruimteInputs, JaarruimteResult, PensioenType } from '../types'
import {
  JAARRUIMTE_PARAMS, BOX1_PRE_AOW, JAARRUIMTE_BELASTINGJAREN,
  RESERVERINGSRUIMTE_PCT_VOOR_2023,
} from '../config/fiscaleParameters'

// Alle fiscale parameters komen uit src/config/fiscaleParameters.ts
// !! Alleen dát bestand aanpassen bij een kwartaalcheck !!

function getParams(year: number) {
  return JAARRUIMTE_PARAMS[year] ?? JAARRUIMTE_PARAMS[2026]
}

/**
 * Leeftijd in hele maanden op 1 januari van het opgegeven jaar.
 *
 * Artikel 3.127 lid 2 Wet IB 2001 toetst de leeftijd uitdrukkelijk "bij het begin
 * van het kalenderjaar", dus niet ergens in het jaar en niet op de verjaardag.
 * Geeft null bij een onbruikbare datum, zodat de aanroeper dat zelf kan afhandelen
 * in plaats van met een stille nul verder te rekenen.
 */
export function leeftijdInMaandenOp1Januari(geboortedatum: string, jaar: number): number | null {
  const d = new Date(geboortedatum)
  if (isNaN(d.getTime())) return null
  let maanden = (jaar - d.getFullYear()) * 12 - d.getMonth()
  if (d.getDate() > 1) maanden -= 1   // de maand is op 1 januari nog niet vol
  return maanden
}

export interface Plafond {
  bedrag: number
  reden: string
}

/**
 * Het plafond van de reserveringsruimte hoort bij het jaar waarin je de ruimte
 * benut, niet bij de jaren waaruit de onbenutte ruimte komt. Wat je dat jaar niet
 * kwijt kunt gaat niet verloren: dat schuift door, zolang je binnen de
 * terugkijktermijn blijft.
 *
 * Twee regimes:
 * - Vanaf 2023 een vast jaarbedrag, gelijk voor iedereen.
 * - Tot en met 2022 de laagste van 17% van de premiegrondslag en een absoluut
 *   maximum, waarbij dat maximum hoger lag voor wie op 1 januari van dat jaar
 *   binnen tien jaar van zijn AOW-leeftijd zat.
 */
function bepaalPlafond(year: number, premiegrondslag: number, geboortedatum?: string): Plafond | null {
  const p = JAARRUIMTE_PARAMS[year]

  if (p?.reserveringsruimteMax !== undefined) {
    return { bedrag: p.reserveringsruimteMax, reden: `vast jaarplafond ${year}` }
  }

  // Niet elk jaar in de parametertabel is ook een jaar waarvoor de tool rekent.
  // De oudere jaren zitten er alleen in omdat de wizard er de onbenutte ruimte
  // van uitrekent, en daar speelt het plafond geen rol. null betekent dus: voor
  // dit jaar is geen plafond bekend, en dat is alleen een probleem als er ook
  // werkelijk iets af te toppen valt.
  const oud = p?.reserveringsruimteVoor2023
  if (!oud) return null

  const omslagpuntMaanden = oud.aowLeeftijdMaanden - 120
  const leeftijd = geboortedatum ? leeftijdInMaandenOp1Januari(geboortedatum, year) : null
  // Zonder bruikbare geboortedatum het lage bedrag aanhouden. Te weinig aftrek
  // claimen is te herstellen, te veel claimen niet.
  const binnenTienJaar = leeftijd !== null && leeftijd >= omslagpuntMaanden

  const absoluutMax = binnenTienJaar ? oud.maxBinnenTienJaarVanAow : oud.maxStandaard
  const pctMax = RESERVERINGSRUIMTE_PCT_VOOR_2023 * premiegrondslag

  if (pctMax < absoluutMax) {
    return {
      bedrag: pctMax,
      reden: `${Math.round(RESERVERINGSRUIMTE_PCT_VOOR_2023 * 100)}% van de premiegrondslag`,
    }
  }
  return {
    bedrag: absoluutMax,
    reden: binnenTienJaar
      ? `maximum ${year} voor wie binnen tien jaar van de AOW-leeftijd zat`
      : leeftijd === null
        ? `maximum ${year}, zonder geboortedatum is het lage bedrag aangehouden`
        : `maximum ${year}`,
  }
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
  const plafond = bepaalPlafond(year, base, inputs.geboortedatum)
  let beschikbareReserveringsruimte = 0
  if (teVerdelen.length > 0) {
    if (!plafond) {
      throw new Error(
        `Geen plafond voor de reserveringsruimte bekend voor ${year}, terwijl er wel ` +
        `onbenutte ruimte is opgegeven. Kies een jaar uit getAvailableYears().`
      )
    }
    const som = teVerdelen.reduce((s, r) => s + r.onbenutBedrag, 0)
    beschikbareReserveringsruimte = Math.min(som, plafond.bedrag)
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
    reserveringsruimtePlafond: plafond?.bedrag ?? 0,
    reserveringsruimtePlafondReden: plafond?.reden ?? 'geen plafond bekend voor dit jaar',
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

const nl = (n: number) => n.toLocaleString('nl-NL')

/**
 * De formule zoals hij voor dit jaar en dit pensioentype werkelijk luidt.
 *
 * Stond tot augustus 2026 op drie plekken als vaste tekst, met cijfers die niet
 * met de berekening meeliepen: "13,3% − 7,44 × factor A" voor elk jaar vóór 2023,
 * en ergens zelfs een vaste regel "30% − 6,27" die ook onder een jaar met 13,3%
 * bleef staan (bevinding A7). Nu afgeleid uit dezelfde parameters waarmee
 * gerekend wordt, zodat tekst en uitkomst niet meer uit elkaar kunnen lopen.
 */
export function getFormuleTekst(year: number, pensioenType: PensioenType = 'db'): string {
  const p = getParams(year)
  const pct = `${nl(p.percentage * 100)}%`
  if (pensioenType === 'wtp') return `${pct} × grondslag − werkgeverspremie`
  if (pensioenType === 'geen') return `${pct} × grondslag`
  return `${pct} × grondslag − ${nl(p.factorMultiplier)} × factor A`
}

// Return a human-readable note about the chosen year's parameters
export function getJaarruimteParamsNote(year: number): string {
  const p = getParams(year)
  return `Franchise €${nl(p.franchise)} · Max inkomen €${nl(p.maxInkomen)} · ${getFormuleTekst(year)}`
}
