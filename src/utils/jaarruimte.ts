import type { JaarruimteInputs, JaarruimteResult, PensioenType } from '../types'

// Jaarruimte parameters per belastingjaar.
// !! Jaarlijks updaten met de nieuwe Lindenhaege advieskaart !!
// Bron: Lindenhaege advieskaart 2026 (C:\Users\schak\Desktop\Claude local files HS - niet wissen\Parametercheck fin onafhankelijk tool)
// Pre-2023: oud regime (13,3%, factor 7,44). 2023+: Wtp (30%, factor 6,27).
const PARAMS: Record<number, { franchise: number; factorMultiplier: number; maxIncome: number; percentage: number; belastingSchijf1: number; belastingSchijf2: number }> = {
  // --- Pre-Wtp (oud regime) ---
  2019: { franchise: 12275,  factorMultiplier: 6.27, maxIncome: 107593, percentage: 0.133, belastingSchijf1: 68507, belastingSchijf2: 68507 },
  2020: { franchise: 12472,  factorMultiplier: 6.27, maxIncome: 110111, percentage: 0.133, belastingSchijf1: 68507, belastingSchijf2: 68507 },
  2021: { franchise: 12672,  factorMultiplier: 6.27, maxIncome: 112189, percentage: 0.133, belastingSchijf1: 68507, belastingSchijf2: 68507 },
  2022: { franchise: 12837,  factorMultiplier: 7.44, maxIncome: 114866, percentage: 0.133, belastingSchijf1: 69398, belastingSchijf2: 69398 },
  // --- Wtp (nieuw regime, vanaf 2023) ---
  2023: { franchise: 13646,  factorMultiplier: 6.27, maxIncome: 128810, percentage: 0.30,  belastingSchijf1: 73031, belastingSchijf2: 73031 },
  2024: { franchise: 17545,  factorMultiplier: 6.27, maxIncome: 137800, percentage: 0.30,  belastingSchijf1: 75624, belastingSchijf2: 75624 },
  2025: { franchise: 18475,  factorMultiplier: 6.27, maxIncome: 137800, percentage: 0.30,  belastingSchijf1: 38883, belastingSchijf2: 78426 },
  // 2026: Lindenhaege advieskaart 2026 (januari 2026)
  2026: { franchise: 19172,  factorMultiplier: 6.27, maxIncome: 137800, percentage: 0.30,  belastingSchijf1: 38883, belastingSchijf2: 78426 },
}

// Reserveringsruimte totaalplafond per jaar (bron: Lindenhaege advieskaart)
// !! Jaarlijks updaten !!
const RESERVERINGSRUIMTE_MAX: Record<number, number> = {
  2026: 42753,
  2025: 38000,  // schatting — controleer met advieskaart 2025
  2024: 36000,  // schatting — controleer met advieskaart 2024
}
const RESERVERINGSRUIMTE_MAX_DEFAULT = 42753


function getReserveringsruimteMax(year: number): number {
  return RESERVERINGSRUIMTE_MAX[year] ?? RESERVERINGSRUIMTE_MAX_DEFAULT
}

// Verwijderd — reserveringsruimteplafond staat nu per jaar in RESERVERINGSRUIMTE_MAX

function getParams(year: number) {
  return PARAMS[year] ?? PARAMS[2025]
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
  const base = Math.max(0, Math.min(inkomen, p.maxIncome) - p.franchise)
  if (pensioenType === 'db')  return Math.max(0, p.percentage * base - p.factorMultiplier * factorA)
  if (pensioenType === 'wtp') return Math.max(0, p.percentage * base - werkgeverspremie)
  return Math.max(0, p.percentage * base)
}

export function calculateJaarruimte(inputs: JaarruimteInputs): JaarruimteResult {
  const { year, income, pensioenType, factorA, werkgeverspremie, alIngelegd, reserveringsruimteRijen } = inputs
  const p = getParams(year)

  const effectiveIncome = Math.min(income, p.maxIncome)
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

  // Marginaal belastingtarief op basis van 3-schijvensysteem 2026
  // (belastingvoordeel = hoeveel belasting je bespaart door de aftrek)
  let belastingTarief: number
  if (income > p.belastingSchijf2) belastingTarief = 0.495
  else if (income > p.belastingSchijf1) belastingTarief = 0.3756
  else belastingTarief = p.percentage >= 0.30 ? 0.3575 : 0.3693 // pre/post Wtp schijf 1
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
  return `Franchise €${p.franchise.toLocaleString('nl-NL')} · Max inkomen €${p.maxIncome.toLocaleString('nl-NL')} · ${pct} − ${factor} × factor A`
}
