import type { JaarruimteInputs, JaarruimteResult, PensioenType } from '../types'
import { JAARRUIMTE_PARAMS, BOX1_PRE_AOW } from '../config/fiscaleParameters'

// Alle fiscale parameters komen uit src/config/fiscaleParameters.ts
// !! Alleen dát bestand aanpassen bij een kwartaalcheck !!

function getParams(year: number) {
  return JAARRUIMTE_PARAMS[year] ?? JAARRUIMTE_PARAMS[2026]
}

function getReserveringsruimteMax(year: number): number {
  return (JAARRUIMTE_PARAMS[year] ?? JAARRUIMTE_PARAMS[2026]).reserveringsruimteMax
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

  // Reserveringsruimte: som van onbenutte jaarruimten vorige jaren,
  // gemaximeerd op het totaalplafond voor dit belastingjaar (Lindenhaege advieskaart).
  const maxReserveringsruimte = getReserveringsruimteMax(year)
  let beschikbareReserveringsruimte = 0
  for (const rij of reserveringsruimteRijen) {
    if (rij.onbenutBedrag > 0) {
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

export function getAvailableYears(): number[] {
  return [2020, 2021, 2022, 2023, 2024, 2025, 2026]
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
