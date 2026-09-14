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
    kostenPct: 0,
    // Nul in de fixtures, zodat de golden master over de rekenfixes gaat en niet
    // ook over de box 3-schatting. De tool zelf start wél met een schatting.
    vermogensbelastingPct: 0,
    vermogensbelastingHandmatig: true,
    currentIncome: 80000,
    currentIncomeType: 'bruto',
    desiredRetirementIncome: 5000,
    // Basisscenario gebruikt bewust 'netto' zodat scenario 8 ("bruto i.p.v.
    // netto") een echt ander codepad raakt (brutoToNetto-conversie) i.p.v.
    // hetzelfde pad nogmaals te testen.
    desiredRetirementIncomeType: 'netto',
    woonsituatie: 'alleenstaand',
    aowMaandBedragNetto: 1558,
    aowStartAge: 67,
    // Uit in de fixtures, zodat de golden master over de bruto-nettofix gaat en
    // niet ook nog over deze wijziging. Er is een aparte test voor.
    aowVakantiegeld: false,
    partner: {
      actief: false,
      leeftijd: 45,
      aowMaandBedragNetto: 1084,
      aowStartAge: 67,
      employerPension: 0,
      employerPensionStartAge: 67,
    },
    employerPension: 0,
    employerPensionStartAge: 67,
    lijfrenteUitkering: 0,
    lijfrenteStartAge: 67,
    lijfrenteSoort: 'levenslang',
    lijfrenteEindLeeftijd: 87,
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
  // Beide partners symmetrisch: elk € 1.084 AOW + € 1.500 werkgeverspensioen, beiden
  // vanaf 67 (zelfde leeftijd als de hoofdpersoon, dus geen kalenderverschil dat de
  // uitkomst zou beïnvloeden — dat wordt al apart getest). Bewust gelijk aan het
  // scenario in pensionCalc.golden.test.ts ("partner — apart belast, niet opgeteld"),
  // waar € 2.336,91 per persoon / € 4.673,82 huishouden al onafhankelijk is
  // nagerekend, zodat dit scenario tegen een bekend anker te controleren is.
  '9_partner': baseInputs({
    woonsituatie: 'samenwonend',
    aowMaandBedragNetto: 1084,
    employerPension: 1500,
    employerPensionStartAge: 67,
    partner: {
      actief: true,
      leeftijd: 45,
      aowMaandBedragNetto: 1084,
      aowStartAge: 67,
      employerPension: 1500,
      employerPensionStartAge: 67,
    },
  }),
}

export function round(v: number, dec = 0): number {
  const f = 10 ** dec
  return Math.round(v * f) / f
}
