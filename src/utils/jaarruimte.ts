import type { JaarruimteInputs, JaarruimteResult, PensioenType } from '../types'

// Dutch jaarruimte parameters per tax year.
// Source: belastingdienst.nl — update annually.
// Pre-2023: old regime (13.3%, factor 7.44). 2023+: Wtp (30%, factor 6.27).
const PARAMS: Record<number, { franchise: number; factorMultiplier: number; maxIncome: number; percentage: number; belastingSchijf: number }> = {
  // --- Pre-Wtp (oude regime) ---
  2020: { franchise: 11408,  factorMultiplier: 7.44, maxIncome: 110111, percentage: 0.133, belastingSchijf: 68507 },
  2021: { franchise: 11954,  factorMultiplier: 7.44, maxIncome: 112189, percentage: 0.133, belastingSchijf: 68507 },
  2022: { franchise: 12837,  factorMultiplier: 7.44, maxIncome: 114866, percentage: 0.133, belastingSchijf: 69398 },
  // --- Wtp (nieuw regime, vanaf 2023) ---
  2023: { franchise: 16322,  factorMultiplier: 6.27, maxIncome: 128810, percentage: 0.30,  belastingSchijf: 73031 },
  2024: { franchise: 17545,  factorMultiplier: 6.27, maxIncome: 137800, percentage: 0.30,  belastingSchijf: 75624 },
  2025: { franchise: 17848,  factorMultiplier: 6.27, maxIncome: 141224, percentage: 0.30,  belastingSchijf: 75624 },
  // 2026 values not yet published — estimated based on indexation trend.
  // Verify at belastingdienst.nl before advising clients for 2026.
  2026: { franchise: 18171,  factorMultiplier: 6.27, maxIncome: 143800, percentage: 0.30,  belastingSchijf: 76817 },
}

// Reserveringsruimte caps also changed with Wtp
function getReserveringsCap(year: number): number {
  return year >= 2023 ? 8000 : Math.round(7587 * Math.pow(1.02, year - 2022)) // approx pre-2023
}

const MAX_RESERVERINGSRUIMTE_TOTAAL = 80000

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

  // Sum up reserveringsruimte from past years.
  // Each year's contribution is capped at the cap for that year,
  // and the total is capped at MAX_RESERVERINGSRUIMTE_TOTAAL.
  let beschikbareReserveringsruimte = 0
  for (const rij of reserveringsruimteRijen) {
    if (rij.onbenutBedrag > 0) {
      const capVoorJaar = getReserveringsCap(rij.jaar)
      const bijdrage = Math.min(rij.onbenutBedrag, capVoorJaar)
      beschikbareReserveringsruimte = Math.min(
        beschikbareReserveringsruimte + bijdrage,
        MAX_RESERVERINGSRUIMTE_TOTAAL
      )
    }
  }

  const totaalBeschikbaar = jaarruimte + beschikbareReserveringsruimte
  const nogTeDoen = Math.max(0, totaalBeschikbaar - (alIngelegd ?? 0))

  // Tax benefit: use the bracket threshold for the chosen year
  const belastingTarief = income > p.belastingSchijf ? 0.495 : 0.3697
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
  const isEstimate = year >= 2026
  const isOld = isPreWtp(year)
  const estremark = isEstimate ? ' (geschat — controleer belastingdienst.nl)' : ''
  const pct = isOld ? '13,3%' : '30%'
  const factor = isOld ? '7,44' : '6,27'
  return `Franchise €${p.franchise.toLocaleString('nl-NL')} · Max inkomen €${p.maxIncome.toLocaleString('nl-NL')} · ${pct} − ${factor} × factor A${estremark}`
}
