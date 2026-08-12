import type { PensionInputs, MonteCarloResult, PercentilePoint } from '../types'
import { brutoToNetto, getMonthlyWithdrawal } from './pensionCalc'

export const N_SIMULATIONS = 2000

function sampleNormal(mean: number, std: number, rng: () => number): number {
  const u1 = rng()
  const u2 = rng()
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// De rendementen in risicoprofielen.ts zijn verwachte MEETKUNDIGE (samengestelde)
// jaarrendementen, niet rekenkundige gemiddelden (besluit 12 augustus 2026).
// Trek daarom lognormaal: de mediaan van het samengestelde pad is dan exact
// (1+g)^n, in plaats van er structureel onder te liggen (E8).
// Twee bijvangsten: een trekking kan niet meer onder −100% rendement uitkomen (het
// mechanisme achter E6), en een pad kan het vermogen niet negatief maken door
// rendement alleen.
function sampleAnnualReturn(geoMeanPct: number, volPct: number, rng: () => number): number {
  const g = geoMeanPct / 100
  const s = volPct / 100  // volatiliteit staat in hele procentpunten
  // Randgeval: een reëel rendement van −100% of lager (absurde inflatie-invoer)
  // laat zich niet lognormaal modelleren. Val dan terug op een vast verlies.
  if (g <= -1) return -1
  const mu = Math.log(1 + g)
  const sigma = Math.sqrt(Math.log(1 + (s * s) / ((1 + g) * (1 + g))))
  return Math.exp(sampleNormal(mu, sigma, rng)) - 1
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function realReturn(nominal: number, inflation: number): number {
  return ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100
}

export function runMonteCarlo(inputs: PensionInputs, opts?: { rng?: () => number; currentYear?: number }): MonteCarloResult {
  const rng = opts?.rng ?? Math.random
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentCapital, monthlyContribution, contributionFrequency,
    returnBeforeRetirement, returnAfterRetirement, inflation,
    desiredRetirementIncome, desiredRetirementIncomeType,
    aowMaandBedragNetto, aowStartAge,
    employerPension, employerPensionStartAge,
    lifeEvents = [],
    volatilityPre, volatilityPost,
  } = inputs

  const aowMonthlyNetto = aowMaandBedragNetto

  const currentYear = opts?.currentYear ?? new Date().getFullYear()
  // Eén kaart over de hele looptijd, opbouw- én uitkeringsfase. Was tot augustus
  // 2026 gefilterd op year < retirementYear, waardoor een eenmalig bedrag ná de
  // pensioendatum de slagingskans en de bandbreedte niet raakte terwijl het de
  // deterministische lijn wél verschoof (E7).
  const eventMap = new Map<number, number>()
  for (const e of lifeEvents) {
    if (e.year >= currentYear && e.amount !== 0) {
      eventMap.set(e.year, (eventMap.get(e.year) ?? 0) + e.amount)
    }
  }
  const desiredNetto = desiredRetirementIncomeType === 'bruto'
    ? brutoToNetto(desiredRetirementIncome, true)
    : desiredRetirementIncome

  const realPre = realReturn(returnBeforeRetirement, inflation)
  const realPost = realReturn(returnAfterRetirement, inflation)
  const monthlyPMT = contributionFrequency === 'jaarlijks'
    ? monthlyContribution / 12
    : monthlyContribution

  const totalYears = Math.max(0, lifeExpectancy - currentAge)

  const capitalByAge: number[][] = Array.from(
    { length: totalYears + 1 },
    () => new Array(N_SIMULATIONS).fill(0)
  )

  let successCount = 0
  let successCount75 = 0

  for (let sim = 0; sim < N_SIMULATIONS; sim++) {
    let capital = currentCapital
    // Parallel tracker: same economic scenario, but client only needs 75% of income from capital.
    // Using the same random returns ensures a fair like-for-like comparison.
    let capital75 = currentCapital
    // Een pad is pas geslaagd als het kapitaal onderweg nooit onder nul is gedoken.
    // Alleen naar de eindstand kijken telt een pad dat halverwege de uitkeringsfase
    // leegloopt ten onrechte mee zodra het daarna weer boven nul uitkomt (E6).
    let everNegative = false
    let everNegative75 = false

    for (let yr = 0; yr < totalYears; yr++) {
      const age = currentAge + yr
      const calYear = currentYear + yr
      // Eenmalig bedrag aan het begin van het jaar, dan rendement, dan de
      // onttrekking. Zelfde volgorde als pensionCalc.ts.
      const event = eventMap.get(calYear) ?? 0
      capitalByAge[yr][sim] = Math.max(0, capital)

      if (age < retirementAge) {
        const r = sampleAnnualReturn(realPre, volatilityPre, rng)
        capital   = (capital   + event) * (1 + r) + monthlyPMT * 12
        capital75 = (capital75 + event) * (1 + r) + monthlyPMT * 12
      } else {
        const r = sampleAnnualReturn(realPost, volatilityPost, rng)
        // Full income scenario
        const withdrawal = getMonthlyWithdrawal(
          age, desiredNetto, aowMonthlyNetto, aowStartAge,
          employerPension, employerPensionStartAge
        ) * 12
        // 75% income scenario: client accepts 25% lower total income
        // getMonthlyWithdrawal handles phase-aware tax: fixed income (AOW + emp) already covers
        // part of the 75% threshold, so the capital withdrawal is reduced accordingly.
        const withdrawal75 = getMonthlyWithdrawal(
          age, desiredNetto * 0.75, aowMonthlyNetto, aowStartAge,
          employerPension, employerPensionStartAge
        ) * 12
        capital   = (capital   + event) * (1 + r) - withdrawal
        capital75 = (capital75 + event) * (1 + r) - withdrawal75
        if (capital   < 0) everNegative   = true
        if (capital75 < 0) everNegative75 = true
      }
    }
    capitalByAge[totalYears][sim] = Math.max(0, capital)
    if (!everNegative)   successCount++
    if (!everNegative75) successCount75++
  }

  const percentileData: PercentilePoint[] = []
  for (let yr = 0; yr <= totalYears; yr++) {
    const age = currentAge + yr
    percentileData.push({
      age,
      p10: Math.max(0, percentile(capitalByAge[yr], 10)),
      p25: Math.max(0, percentile(capitalByAge[yr], 25)),
      p50: Math.max(0, percentile(capitalByAge[yr], 50)),
      p75: Math.max(0, percentile(capitalByAge[yr], 75)),
      p90: Math.max(0, percentile(capitalByAge[yr], 90)),
    })
  }

  return {
    successRate: (successCount / N_SIMULATIONS) * 100,
    successRate75: (successCount75 / N_SIMULATIONS) * 100,
    percentileData,
  }
}
