import type { PensionInputs, MonteCarloResult, PercentilePoint } from '../types'
import { brutoToNetto, getMonthlyWithdrawal, AOW_NETTO } from './pensionCalc'

const N_SIMULATIONS = 2000

function sampleNormal(mean: number, std: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
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

export function runMonteCarlo(inputs: PensionInputs): MonteCarloResult {
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentCapital, monthlyContribution, contributionFrequency,
    returnBeforeRetirement, returnAfterRetirement, inflation,
    desiredRetirementIncome, desiredRetirementIncomeType,
    aowPercentage, aowStartAge, aowType,
    employerPension, employerPensionStartAge,
    lifeEvents = [],
    stortingen = [],
    volatilityPre, volatilityPost,
  } = inputs

  const aowMonthlyNetto = (aowPercentage / 100) * AOW_NETTO[aowType]

  const currentYear = new Date().getFullYear()
  const retirementYear = currentYear + Math.max(0, retirementAge - currentAge)
  // Build accumulation-phase event map (life events + stortingen up to retirement)
  const allEvents = [...lifeEvents, ...stortingen]
  const lumpSumMap = new Map<number, number>()
  for (const e of allEvents) {
    if (e.year >= currentYear && e.year < retirementYear && e.amount !== 0) {
      lumpSumMap.set(e.year, (lumpSumMap.get(e.year) ?? 0) + e.amount)
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
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)

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

    for (let yr = 0; yr < totalYears; yr++) {
      const age = currentAge + yr
      capitalByAge[yr][sim] = Math.max(0, capital)

      if (age < retirementAge) {
        const r = sampleNormal(realPre, volatilityPre) / 100
        const calYear = currentYear + yr
        const lumpSum = lumpSumMap.get(calYear) ?? 0
        capital   = (capital   + lumpSum) * (1 + r) + monthlyPMT * 12
        capital75 = (capital75 + lumpSum) * (1 + r) + monthlyPMT * 12
      } else {
        const r = sampleNormal(realPost, volatilityPost) / 100
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
        capital   = capital   * (1 + r) - withdrawal
        capital75 = capital75 * (1 + r) - withdrawal75
      }
    }
    capitalByAge[totalYears][sim] = Math.max(0, capital)
    if (capital   >= 0) successCount++
    if (capital75 >= 0) successCount75++
  }

  const percentileData: PercentilePoint[] = []
  for (let yr = 0; yr <= totalYears; yr++) {
    const age = currentAge + yr
    // Only show accumulation + retirement, skip pre-retirement for the MC bands
    if (age >= retirementAge - yearsToRetirement) {
      percentileData.push({
        age,
        p10: Math.max(0, percentile(capitalByAge[yr], 10)),
        p25: Math.max(0, percentile(capitalByAge[yr], 25)),
        p50: Math.max(0, percentile(capitalByAge[yr], 50)),
        p75: Math.max(0, percentile(capitalByAge[yr], 75)),
        p90: Math.max(0, percentile(capitalByAge[yr], 90)),
      })
    }
  }

  return {
    successRate: (successCount / N_SIMULATIONS) * 100,
    successRate75: (successCount75 / N_SIMULATIONS) * 100,
    percentileData,
  }
}
