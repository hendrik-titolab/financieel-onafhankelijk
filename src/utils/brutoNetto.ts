import { BOX1_PRE_AOW, HEFFINGSKORTING_PRE_AOW } from '../config/fiscaleParameters'

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
  kortingenBenut: number
  teBetalen: number
  nettoJaar: number
  druk: number
}

// ── Berekeningen ──────────────────────────────────────────────────────────────

export function belastingSchijven(bruto: number): { totaal: number; detail: SchijfDetail[] } {
  let rest = bruto, vorigeGrens = 0, totaal = 0
  const detail: SchijfDetail[] = []
  for (const s of P.schijven) {
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

export function arbeidskorting(inkomen: number): number {
  const a = P.ak
  let k: number
  if (inkomen <= a.knik1) k = a.pct1 * inkomen
  else if (inkomen <= a.knik2) k = a.pct1 * a.knik1 + a.pct2 * (inkomen - a.knik1)
  else if (inkomen <= a.knik3) k = a.pct1 * a.knik1 + a.pct2 * (a.knik2 - a.knik1) + a.pct3 * (inkomen - a.knik2)
  else k = a.max - a.afbouwPct * (inkomen - a.afbouwVanaf)
  return Math.max(0, Math.min(a.max, k))
}

export function brutoNaarNetto(brutoJaar: number): BerekeningResultaat {
  const { totaal: belasting, detail } = belastingSchijven(brutoJaar)
  const ahk = algemeneHeffingskorting(brutoJaar)
  const ak = arbeidskorting(brutoJaar)
  const kortingen = Math.min(belasting, ahk + ak)
  const teBetalen = belasting - kortingen
  return {
    brutoJaar,
    belastingBruto: belasting,
    schijfDetail: detail,
    ahk,
    ak,
    kortingenBenut: kortingen,
    teBetalen,
    nettoJaar: brutoJaar - teBetalen,
    druk: brutoJaar > 0 ? teBetalen / brutoJaar : 0,
  }
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
