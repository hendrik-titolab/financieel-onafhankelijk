import type { JaarruimteInputs, JaarruimteResult, PensioenType } from '../types'
import {
  JAARRUIMTE_PARAMS, JAARRUIMTE_BELASTINGJAREN,
  RESERVERINGSRUIMTE_PCT_VOOR_2023, RESERVERINGSRUIMTE_TERUGKIJK,
} from '../config/fiscaleParameters'
import { belastingBox1 } from './brutoNetto'
import { PARAMETER_JAAR } from '../config/modelVersie'

// Alle fiscale parameters komen uit src/config/fiscaleParameters.ts
// !! Alleen dát bestand aanpassen bij een kwartaalcheck !!

function getParams(year: number) {
  const p = JAARRUIMTE_PARAMS[year]
  if (!p) {
    throw new Error(
      `Geen jaarruimteparameters bekend voor ${year}. Kies een jaar uit getAvailableYears().`
    )
  }
  return p
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
  pensioenpremie: number,
): number {
  const p = getParams(jaar)
  const base = Math.max(0, Math.min(inkomen, p.maxInkomen) - p.franchise)
  if (pensioenType === 'db')  return Math.max(0, p.percentage * base - p.factorMultiplier * factorA)
  if (pensioenType === 'wtp') return Math.max(0, p.percentage * base - pensioenpremie)
  return Math.max(0, p.percentage * base)
}

/**
 * Hoeveel jaar de reserveringsruimte terugkijkt voor een gegeven belastingjaar.
 *
 * Tot en met 2022 zeven jaar, vanaf 2023 tien. RESERVERINGSRUIMTE_TERUGKIJK stond
 * al in fiscaleParameters.ts maar werd nergens geimporteerd: het scherm hanteerde
 * een vaste tien, waardoor de tool voor belastingjaar 2021 en 2022 drie jaren te
 * veel meetelde (audit 7 september 2026, bevinding 17).
 */
export function terugkijktermijn(jaar: number): number {
  return jaar >= 2023 ? RESERVERINGSRUIMTE_TERUGKIJK.vanaf2023 : RESERVERINGSRUIMTE_TERUGKIJK.voor2023
}

/** Het oudste jaar dat voor een gegeven belastingjaar nog binnen de termijn valt. */
export function oudsteReserveringsjaar(jaar: number): number {
  return jaar - terugkijktermijn(jaar)
}

export interface JaarruimteControle {
  /** Blokkerend: hiermee mag geen uitkomst worden getoond. */
  errors: string[]
  /** Niet blokkerend, maar de gebruiker moet het weten. */
  waarschuwingen: string[]
}

/**
 * Toetst de invoer voordat er gerekend wordt.
 *
 * calculateJaarruimte() werd onbeschermd tijdens de render aangeroepen terwijl
 * getParams() een Error gooit bij een onbekend jaar, en de min/max op het
 * jaarveld werden niet afgedwongen. Een getypt jaartal buiten de tabel maakte het
 * hele tabblad wit. Daarnaast telde de kern positieve rijen op zonder te kijken
 * naar jaarbereik of dubbele jaren (audit 7 september 2026, bevinding 17).
 */
export function controleerJaarruimteInvoer(inputs: JaarruimteInputs): JaarruimteControle {
  const errors: string[] = []
  const waarschuwingen: string[] = []

  if (!JAARRUIMTE_BELASTINGJAREN.includes(inputs.year)) {
    errors.push(
      `Voor belastingjaar ${inputs.year} rekent deze tool niet. Kies een jaar tussen ` +
      `${Math.min(...JAARRUIMTE_BELASTINGJAREN)} en ${Math.max(...JAARRUIMTE_BELASTINGJAREN)}.`
    )
    // Zonder een geldig jaar hebben de controles hieronder geen betekenis.
    return { errors, waarschuwingen }
  }

  const getal = (v: number) => Number.isFinite(v)

  if (!getal(inputs.income) || inputs.income < 0) {
    errors.push('Vul een inkomen in van nul of hoger.')
  }
  if (inputs.pensioenType === 'db' && (!getal(inputs.factorA) || inputs.factorA < 0)) {
    errors.push('Vul een factor A in van nul of hoger.')
  }
  if (inputs.pensioenType === 'wtp' && (!getal(inputs.pensioenpremie) || inputs.pensioenpremie < 0)) {
    errors.push('Vul een totale pensioenpremie in van nul of hoger.')
  }
  if (!getal(inputs.alIngelegd) || inputs.alIngelegd < 0) {
    errors.push('Vul een reeds ingelegd bedrag in van nul of hoger.')
  }

  const oudste = oudsteReserveringsjaar(inputs.year)
  const gezien = new Set<number>()

  for (const rij of inputs.reserveringsruimteRijen) {
    if (rij.onbenutBedrag === 0) continue

    if (!getal(rij.onbenutBedrag) || rij.onbenutBedrag < 0) {
      errors.push(`Onbenutte ruimte over ${rij.jaar}: vul een bedrag van nul of hoger in.`)
      continue
    }
    if (!getal(rij.jaar)) {
      errors.push('Vul bij elke regel onbenutte ruimte een jaartal in.')
      continue
    }
    if (rij.jaar < oudste || rij.jaar > inputs.year - 1) {
      errors.push(
        `Het jaar ${rij.jaar} telt niet mee voor belastingjaar ${inputs.year}. ` +
        `De reserveringsruimte kijkt ${terugkijktermijn(inputs.year)} jaar terug: ` +
        `${oudste} tot en met ${inputs.year - 1}.`
      )
      continue
    }
    if (gezien.has(rij.jaar)) {
      errors.push(`Het jaar ${rij.jaar} staat er twee keer in. Tel die bedragen bij elkaar op.`)
      continue
    }
    gezien.add(rij.jaar)
  }

  // De belastingschijven in fiscaleParameters.ts zijn er voor een jaar. Voor een
  // ander aftrekjaar is het geschatte voordeel dus een benadering, en dat hoort
  // de gebruiker te weten in plaats van te moeten raden.
  if (inputs.year !== PARAMETER_JAAR) {
    waarschuwingen.push(
      `Het geschatte belastingvoordeel rekent met de schijven en heffingskortingen van ` +
      `${PARAMETER_JAAR}. Voor aftrekjaar ${inputs.year} is dat een benadering.`
    )
  }

  return { errors, waarschuwingen }
}

export function calculateJaarruimte(inputs: JaarruimteInputs): JaarruimteResult {
  const { year, income, pensioenType, factorA, pensioenpremie, alIngelegd, reserveringsruimteRijen } = inputs
  const p = getParams(year)

  const effectiveIncome = Math.min(income, p.maxInkomen)
  const base = Math.max(0, effectiveIncome - p.franchise)

  // Jaarruimte formula depends on pension type:
  // - geen:  30% (or 13.3% pre-2023) × grondslag, no deduction
  // - db:    percentage × grondslag − factorMultiplier × factorA
  // - wtp:   percentage × grondslag − pensioenpremie (de totale inleg in de
  //          werkgeversregeling, werkgeversdeel én eigen bijdrage, vervangt factor A)
  let jaarruimte: number
  if (pensioenType === 'db') {
    jaarruimte = Math.max(0, p.percentage * base - p.factorMultiplier * factorA)
  } else if (pensioenType === 'wtp') {
    jaarruimte = Math.max(0, p.percentage * base - (pensioenpremie ?? 0))
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
  // Alleen jaren binnen de terugkijktermijn, en elk jaar hoogstens een keer. De
  // kern telde eerder alle positieve rijen op: bij belastingjaar 2026 telde een
  // rij uit 2015 gewoon mee, en hetzelfde jaar twee keer invullen verdubbelde de
  // ruimte (audit 7 september 2026, bevinding 17).
  const oudsteJaar = oudsteReserveringsjaar(year)
  const gezieneJaren = new Set<number>()
  const teVerdelen = reserveringsruimteRijen.filter(r => {
    if (!(r.onbenutBedrag > 0) || !Number.isFinite(r.onbenutBedrag)) return false
    if (!Number.isFinite(r.jaar) || r.jaar < oudsteJaar || r.jaar > year - 1) return false
    if (gezieneJaren.has(r.jaar)) return false
    gezieneJaren.add(r.jaar)
    return true
  })
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

  // Belastingvoordeel als echte verschilberekening: belasting zonder aftrek min
  // belasting met aftrek.
  //
  // Hier stond een vlak marginaal tarief over de hele aftrek. Bij EUR 80.000
  // inkomen en EUR 20.000 aftrek rekende dat 49,5% over het volle bedrag, terwijl
  // de aftrek het inkomen door de schijfgrens van EUR 78.426 heen duwt en het
  // grootste deel dus tegen 37,56% valt. Dat overschatte het voordeel (audit
  // 7 september 2026, bevinding 19).
  //
  // Het inkomen van het aftrekjaar mag apart worden opgegeven. Is dat niet
  // ingevuld, dan valt het terug op het inkomen uit de jaarruimteberekening, dat
  // van het voorafgaande jaar is. Dat is een aanname en de UI benoemt hem.
  //
  // arbeidsinkomen blijft op het inkomen vóór aftrek staan: een lijfrentepremie is
  // een uitgave voor inkomensvoorziening en verlaagt het belastbaar inkomen, maar
  // niet het arbeidsinkomen waarover de arbeidskorting loopt. De algemene
  // heffingskorting bouwt wél af over het lagere inkomen, en dat effect zit hier
  // dus in.
  const aftrekInkomen = inputs.aftrekjaarInkomen ?? income
  const voorAftrek = belastingBox1(Math.max(0, aftrekInkomen), {
    pastAow: false, arbeidsinkomen: Math.max(0, aftrekInkomen),
  })
  const naAftrek = belastingBox1(Math.max(0, aftrekInkomen - nogTeDoen), {
    pastAow: false, arbeidsinkomen: Math.max(0, aftrekInkomen),
  })
  const belastingVoordeel = Math.max(0, voorAftrek.teBetalen - naAftrek.teBetalen)
  // Het effectieve tarief over déze aftrek, niet een schijftarief. Bij een aftrek
  // die twee schijven doorkruist ligt dit er ergens tussenin.
  const belastingTarief = nogTeDoen > 0 ? belastingVoordeel / nogTeDoen : 0

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

// Vanaf 2023 het Wtp-regime. Daarnaast 2021 en 2022: het leeftijdsafhankelijke
// pre-2023-plafond is inmiddels wél geïmplementeerd (zie bepaalPlafond hierboven).
// Verder terug dan 2021 is een gemiste lijfrenteaftrek niet meer te herstellen via
// een ambtshalve vermindering, dus is er voor die jaren fiscaal niets meer aan een
// uitkomst te doen, ook al zou de berekening zelf wel kunnen. Besluit Hendrik,
// 13 augustus 2026. De lijst komt uit de fiscale bron, zie fiscaleParameters.ts.
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
  if (pensioenType === 'wtp') return `${pct} × grondslag − pensioenpremie`
  if (pensioenType === 'geen') return `${pct} × grondslag`
  return `${pct} × grondslag − ${nl(p.factorMultiplier)} × factor A`
}

// Return a human-readable note about the chosen year's parameters
export function getJaarruimteParamsNote(year: number): string {
  const p = getParams(year)
  return `Franchise €${nl(p.franchise)} · Max inkomen €${nl(p.maxInkomen)} · ${getFormuleTekst(year)}`
}
