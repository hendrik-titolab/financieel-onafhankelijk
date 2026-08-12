// Gedeelde scenario-definities voor de golden-master-tests. Eén bron zodat
// pensionCalc.golden.test.ts en monteCarlo.golden.test.ts (die scenario 1 en
// 4 hergebruikt) niet uit de pas kunnen lopen met elkaar.
import type { PensionInputs } from '../../types'

export function baseInputs(overrides: Partial<PensionInputs> = {}): PensionInputs {
  return {
    currentAge: 45,
    retirementAge: 67,
    lifeExpectancy: 90,
    currentCapital: 100000,
    monthlyContribution: 500,
    contributionFrequency: 'maandelijks',
    returnBeforeRetirement: 6,
    returnAfterRetirement: 4,
    inflation: 2.5,
    currentIncome: 80000,
    currentIncomeType: 'bruto',
    desiredRetirementIncome: 5000,
    // Basisscenario gebruikt bewust 'netto' zodat scenario 8 ("bruto i.p.v.
    // netto") een echt ander codepad raakt (brutoToNetto-conversie) i.p.v.
    // hetzelfde pad nogmaals te testen.
    desiredRetirementIncomeType: 'netto',
    aowMaandBedragNetto: 1558,
    aowStartAge: 67,
    employerPension: 0,
    employerPensionStartAge: 67,
    lifeEvents: [],
    volatilityPre: 12,
    volatilityPost: 8,
    riskProfile: 'neutraal',
    useCustomReturns: false,
    ...overrides,
  }
}

// currentYear is overal 2026 (via de testnaad opts.currentYear), currentAge 45,
// retirementAge 67 -> retirementYear = 2048. Leeftijd 75 in de uitkeringsfase
// = retirementYear + (75-67) = 2056 (gebruikt in scenario 4).
export const SCENARIOS: Record<string, PensionInputs> = {
  '1_basis': baseInputs(),
  '2_werkgeverspensioen_voor_aow': baseInputs({
    employerPension: 15000,
    employerPensionStartAge: 65,
    aowStartAge: 67,
  }),
  '3_negatief_bedrag_opbouwfase': baseInputs({
    lifeEvents: [{ name: 'Test-uitgave', amount: -200000, year: 2030 }],
  }),
  '4_negatief_bedrag_na_pensioendatum': baseInputs({
    lifeEvents: [{ name: 'Test-uitgave', amount: -100000, year: 2056 }],
  }),
  '5_randgeval_leeg': baseInputs({ currentCapital: 0, monthlyContribution: 0 }),
  '6_al_gepensioneerd': baseInputs({ currentAge: 67, retirementAge: 67 }),
  '7_extreem_18_100': baseInputs({ currentAge: 18, lifeExpectancy: 100 }),
  '8_bruto_gewenst_inkomen': baseInputs({ desiredRetirementIncomeType: 'bruto' }),
}

export function round(v: number, dec = 0): number {
  const f = 10 ** dec
  return Math.round(v * f) / f
}
