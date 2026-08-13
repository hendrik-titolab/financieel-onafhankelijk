import {
  BOX1_PRE_AOW, BOX1_POST_AOW,
  HEFFINGSKORTING_PRE_AOW, HEFFINGSKORTING_POST_AOW,
} from '../config/fiscaleParameters'

// Rekenlogica van de bruto-nettotool. Stond tot augustus 2026 in
// src/components/BrutoNetto/index.tsx en was daardoor niet te testen zonder de
// React-component te renderen (bevinding A21). De verhuizing is letterlijk: geen
// enkele formule is aangepast.
//
// Let op bij E4: dit rekent uitsluitend met de tarieven en kortingen van vóór de
// AOW-leeftijd. Er is nog geen post-AOW-variant, terwijl de cijfers daarvoor
// inmiddels wel in FISCALE-BRONNEN.md staan.

// ── Fiscale parameters 2026 ───────────────────────────────────────────────────
// Alle getallen komen uit de centrale config (fiscaleParameters.ts), zodat de
// kwartaalcheck ze meeneemt. Hier alleen omgezet naar de vorm die de tool gebruikt.
export const P = {
  jaar: 2026,
  schijven: [
    { tot: BOX1_PRE_AOW.schijf1Grens, tarief: BOX1_PRE_AOW.schijf1Tarief },
    { tot: BOX1_PRE_AOW.schijf2Grens, tarief: BOX1_PRE_AOW.schijf2Tarief },
    { tot: Infinity, tarief: BOX1_PRE_AOW.schijf3Tarief },
  ],
  ahk: HEFFINGSKORTING_PRE_AOW.algemeneHeffingskorting,
  ak: HEFFINGSKORTING_PRE_AOW.arbeidskorting,
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SchijfDetail {
  van: number
  tot: number
  tarief: number
  grondslag: number
  bedrag: number
}

export interface BerekeningResultaat {
  brutoJaar: number
  belastingBruto: number
  schijfDetail: SchijfDetail[]
  ahk: number
  ak: number
  /** Alleen na de AOW-leeftijd, anders 0. */
  ouderenkorting: number
  /** Alleen na de AOW-leeftijd én alleenstaand, anders 0. */
  alleenstaandeouderenkorting: number
  kortingenBenut: number
  teBetalen: number
  nettoJaar: number
  druk: number
}

// ── Berekeningen ──────────────────────────────────────────────────────────────

export function belastingSchijven(
  bruto: number,
  schijven: readonly { tot: number; tarief: number }[] = P.schijven,
): { totaal: number; detail: SchijfDetail[] } {
  let rest = bruto, vorigeGrens = 0, totaal = 0
  const detail: SchijfDetail[] = []
  for (const s of schijven) {
    const inSchijf = Math.max(0, Math.min(bruto, s.tot) - vorigeGrens)
    const bedrag = inSchijf * s.tarief
    if (inSchijf > 0) detail.push({ van: vorigeGrens, tot: Math.min(bruto, s.tot), tarief: s.tarief, grondslag: inSchijf, bedrag })
    totaal += bedrag
    vorigeGrens = s.tot
    rest -= inSchijf
    if (rest <= 0) break
  }
  return { totaal, detail }
}

export function algemeneHeffingskorting(inkomen: number): number {
  const { max, afbouwVanaf, afbouwPct } = P.ahk
  if (inkomen <= afbouwVanaf) return max
  return Math.max(0, max - afbouwPct * (inkomen - afbouwVanaf))
}

interface ArbeidskortingParams {
  knik1: number; pct1: number
  knik2: number; pct2: number
  knik3: number; pct3: number
  afbouwVanaf: number; afbouwPct: number
  max: number
}

/** Trapsgewijze opbouw, daarna lineaire afbouw. Werkt voor beide leeftijdsvarianten. */
export function arbeidskortingVoor(inkomen: number, a: ArbeidskortingParams): number {
  let k: number
  if (inkomen <= a.knik1) k = a.pct1 * inkomen
  else if (inkomen <= a.knik2) k = a.pct1 * a.knik1 + a.pct2 * (inkomen - a.knik1)
  else if (inkomen <= a.knik3) k = a.pct1 * a.knik1 + a.pct2 * (a.knik2 - a.knik1) + a.pct3 * (inkomen - a.knik2)
  else k = a.max - a.afbouwPct * (inkomen - a.afbouwVanaf)
  return Math.max(0, Math.min(a.max, k))
}

export function arbeidskorting(inkomen: number): number {
  return arbeidskortingVoor(inkomen, P.ak)
}

// ── Fase-bewuste variant (E4) ─────────────────────────────────────────────────
//
// Nog niet in gebruik. Gebouwd als voorbereiding op E4, waarin de FO-planner en
// de bruto-nettotool dezelfde belastingmotor moeten gaan gebruiken. Nu geven ze
// een verschillend netto voor hetzelfde bruto: bij € 30.000 zegt de
// bruto-nettotool € 2.313 per maand en de FO-planner € 1.606, een verschil van
// € 707. Dat komt doordat pensionCalc.ts alleen schijventarieven toepast en
// helemaal geen heffingskortingen kent.
//
// TWEE VALKUILEN VOOR WIE DIT AANSLUIT:
//
// 1. AOW_NETTO_MAAND is al een NETTO bedrag inclusief loonheffingskorting. Wie
//    dat bedrag optelt bij een bruto pensioen en daarna deze functie loslaat op
//    het totaal, telt de heffingskorting dubbel. De AOW hoort er als netto
//    bedrag naast te blijven staan, of bruto gemaakt te worden vóór de optelling.
//
// 2. De kortingen zijn inkomensafhankelijk over het TOTALE box 1-inkomen. Ze per
//    inkomensbron apart berekenen geeft een te hoge korting. AOW,
//    werkgeverspensioen en straks lijfrente moeten dus eerst opgeteld worden.
//
// Het marginale tarief loopt na de AOW-leeftijd hoger op dan het schijftarief
// suggereert: tussen € 46.002 en € 59.783 stapelen 37,56% schijf, 15% afbouw
// ouderenkorting en 3,195% afbouw algemene heffingskorting tot 55,8%.

export interface BelastingOpties {
  /** Bepaalt de schijftarieven én welke kortingen gelden. */
  pastAow: boolean
  /**
   * Deel van het inkomen dat arbeidsinkomen is, voor de arbeidskorting.
   * Standaard het hele bedrag, wat klopt voor een werknemer. Voor een
   * gepensioneerde hoort hier 0: een werkgeverspensioen is geen arbeidsinkomen.
   */
  arbeidsinkomen?: number
  /** Geeft recht op de alleenstaandeouderenkorting. Alleen na de AOW-leeftijd. */
  alleenstaand?: boolean
}

function schijvenVoor(pastAow: boolean) {
  const t = pastAow ? BOX1_POST_AOW : BOX1_PRE_AOW
  return [
    { tot: t.schijf1Grens, tarief: t.schijf1Tarief },
    { tot: t.schijf2Grens, tarief: t.schijf2Tarief },
    { tot: Infinity, tarief: t.schijf3Tarief },
  ]
}

/** Lineair afgebouwde korting: onder de grens het maximum, daarboven aflopend tot nul. */
function afgebouwdeKorting(
  inkomen: number,
  k: { max: number; afbouwVanaf: number; afbouwPct: number },
): number {
  if (inkomen <= k.afbouwVanaf) return k.max
  return Math.max(0, k.max - k.afbouwPct * (inkomen - k.afbouwVanaf))
}

export function belastingBox1(brutoJaar: number, opties: BelastingOpties): BerekeningResultaat {
  const { pastAow, alleenstaand = false } = opties
  const arbeidsinkomen = opties.arbeidsinkomen ?? brutoJaar

  const { totaal: belasting, detail } = belastingSchijven(brutoJaar, schijvenVoor(pastAow))

  const kortingSet = pastAow ? HEFFINGSKORTING_POST_AOW : HEFFINGSKORTING_PRE_AOW
  const ahk = afgebouwdeKorting(brutoJaar, kortingSet.algemeneHeffingskorting)
  const ak = arbeidskortingVoor(arbeidsinkomen, kortingSet.arbeidskorting)
  const ouderenkorting = pastAow
    ? afgebouwdeKorting(brutoJaar, HEFFINGSKORTING_POST_AOW.ouderenkorting)
    : 0
  const alleenstaandeouderenkorting = pastAow && alleenstaand
    ? HEFFINGSKORTING_POST_AOW.alleenstaandeouderenkorting
    : 0

  const kortingen = Math.min(
    belasting,
    ahk + ak + ouderenkorting + alleenstaandeouderenkorting,
  )
  const teBetalen = belasting - kortingen

  return {
    brutoJaar,
    belastingBruto: belasting,
    schijfDetail: detail,
    ahk,
    ak,
    ouderenkorting,
    alleenstaandeouderenkorting,
    kortingenBenut: kortingen,
    teBetalen,
    nettoJaar: brutoJaar - teBetalen,
    druk: brutoJaar > 0 ? teBetalen / brutoJaar : 0,
  }
}

/** Bruto naar netto voor een werknemer onder de AOW-leeftijd. Wat de bruto-nettotool gebruikt. */
export function brutoNaarNetto(brutoJaar: number): BerekeningResultaat {
  return belastingBox1(brutoJaar, { pastAow: false })
}

export function nettoNaarBruto(nettoJaar: number): BerekeningResultaat {
  let lo = nettoJaar, hi = nettoJaar * 2.5 + 50_000
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (brutoNaarNetto(mid).nettoJaar < nettoJaar) lo = mid
    else hi = mid
  }
  return brutoNaarNetto((lo + hi) / 2)
}
