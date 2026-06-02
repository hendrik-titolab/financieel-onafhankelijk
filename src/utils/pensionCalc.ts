import type { PensionInputs, PensionResult, YearData, IncomePhase, LifeEvent, Storting } from '../types'

// AOW net monthly amounts (2025). Amount depends on living situation — always ask!
// Alleenstaand: ~€1.550/mnd netto | Samenwonend/gehuwd: ~€1.060/mnd netto per person
export const AOW_NETTO = {
  alleenstaand: 1550,
  samenwonend: 1060,
}

// Box 1 gross-to-net conversion.
// CRITICAL: pastAowAge changes the tax rate — before AOW age, employer pension is still
// subject to the AOW premium (36.97% total), which drops to 19.07% once AOW starts.
// This affects the overbrugging period: never use a fixed 19.07% for pre-AOW ages.
export function brutoToNetto(bruto: number, pastAowAge: boolean): number {
  const rate1 = pastAowAge ? 0.1907 : 0.3697
  const bracket1 = 75624
  if (bruto <= 0) return 0
  if (bruto <= bracket1) return bruto * (1 - rate1)
  return bruto - bracket1 * rate1 - (bruto - bracket1) * 0.495
}

export function nettoToBruto(netto: number, pastAowAge: boolean): number {
  const rate1 = pastAowAge ? 0.1907 : 0.3697
  const netBracket1 = 75624 * (1 - rate1)
  if (netto <= 0) return 0
  if (netto <= netBracket1) return netto / (1 - rate1)
  return (netto - 75624 * (1 - rate1)) / 0.505 + 75624
}

function realAnnualReturn(nominal: number, inflation: number): number {
  return ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100
}

// Monthly withdrawal needed from own capital, given age (phase-aware).
// Employer pension is taxed at different rates before vs after AOW age.
export function getMonthlyWithdrawal(
  age: number,
  desiredNetto: number,
  aowNetto: number,
  aowStartAge: number,
  employerPensionBruto: number,
  employerPensionStartAge: number
): number {
  const pastAow = age >= aowStartAge
  const aow = pastAow ? aowNetto : 0
  // Tax rate changes at AOW age: 36.97% → 19.07%
  const emp = age >= employerPensionStartAge
    ? brutoToNetto(employerPensionBruto, pastAow)
    : 0
  return Math.max(0, desiredNetto - aow - emp)
}

function buildEventMap(
  events: (LifeEvent | Storting)[],
  startYear: number,
  endYear: number
): Map<number, number> {
  const map = new Map<number, number>()
  for (const e of events) {
    if (e.year >= startYear && e.year < endYear && e.amount !== 0) {
      map.set(e.year, (map.get(e.year) ?? 0) + e.amount)
    }
  }
  return map
}

// Year-by-year accumulation simulation. Life events (positive or negative) are applied at
// the start of each year before growth — same as lump sums in the original design.
function simulateAccumulation(
  startCapital: number,
  monthlyPMT: number,
  yearsToRetirement: number,
  realReturnAnnual: number,
  eventMap: Map<number, number>,
  startCalendarYear: number
): number {
  let capital = startCapital
  const annualFactor = 1 + realReturnAnnual / 100

  for (let yr = 0; yr < yearsToRetirement; yr++) {
    const calYear = startCalendarYear + yr
    const event = eventMap.get(calYear) ?? 0
    capital = (capital + event) * annualFactor + monthlyPMT * 12
  }
  return capital
}

// Binary search for required monthly PMT to reach targetCapital
function findRequiredPMT(
  targetCapital: number,
  startCapital: number,
  yearsToRetirement: number,
  realReturnAnnual: number,
  eventMap: Map<number, number>,
  startCalendarYear: number
): number {
  if (yearsToRetirement <= 0) return 0
  let lo = -50000, hi = 200000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const cap = simulateAccumulation(startCapital, mid, yearsToRetirement, realReturnAnnual, eventMap, startCalendarYear)
    if (cap < targetCapital) lo = mid
    else hi = mid
  }
  return hi
}

export function calculatePension(inputs: PensionInputs): PensionResult {
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentCapital, monthlyContribution, contributionFrequency,
    returnBeforeRetirement, returnAfterRetirement, inflation,
    desiredRetirementIncome, desiredRetirementIncomeType,
    aowMaandBedragNetto, aowStartAge,
    employerPension, employerPensionStartAge,
    lifeEvents = [],
    stortingen = [],
  } = inputs

  const allEvents = [...lifeEvents, ...stortingen]

  const realPre = realAnnualReturn(returnBeforeRetirement, inflation)
  const realPost = realAnnualReturn(returnAfterRetirement, inflation)

  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  const yearsInRetirement = Math.max(1, lifeExpectancy - retirementAge)

  const monthlyPMT = contributionFrequency === 'jaarlijks'
    ? monthlyContribution / 12
    : monthlyContribution

  const currentYear = new Date().getFullYear()
  const retirementYear = currentYear + yearsToRetirement

  // Split all events (life events + stortingen) into accumulation and retirement phase
  const accEventMap = buildEventMap(allEvents, currentYear, retirementYear)
  const retEventMap = buildEventMap(allEvents, retirementYear, retirementYear + yearsInRetirement + 1)

  // Projected capital at retirement (year-by-year with life events)
  const projectedCapital = simulateAccumulation(
    currentCapital, monthlyPMT, yearsToRetirement, realPre, accEventMap, currentYear
  )

  // Desired netto monthly income
  const desiredMonthlyNetto = desiredRetirementIncomeType === 'bruto'
    ? brutoToNetto(desiredRetirementIncome, true)
    : desiredRetirementIncome

  const aowMonthlyNetto = aowMaandBedragNetto

  // Required capital = PV of all future withdrawals at retirement.
  // Employer pension tax rate is age-dependent (36.97% pre-AOW, 19.07% post-AOW).
  const rPostAnnual = 1 + realPost / 100
  let requiredCapital = 0
  for (let yr = 0; yr < yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const annualWithdrawal = getMonthlyWithdrawal(
      age, desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
      employerPension, employerPensionStartAge
    ) * 12
    requiredCapital += annualWithdrawal / Math.pow(rPostAnnual, yr + 0.5)
  }

  // Required monthly contribution (binary search, accounts for life events)
  const requiredMonthlyContribution = findRequiredPMT(
    requiredCapital, currentCapital, yearsToRetirement, realPre, accEventMap, currentYear
  )

  // --- Year-by-year simulation for chart & table ---
  const yearData: YearData[] = []
  let capital = currentCapital

  // Accumulation phase
  for (let yr = 0; yr < yearsToRetirement; yr++) {
    const age = currentAge + yr
    const calYear = currentYear + yr
    const event = accEventMap.get(calYear) ?? 0

    yearData.push({
      age,
      year: calYear,
      capital: Math.max(0, capital),
      phase: 'opbouw',
      incomeFromCapital: 0,
      aowIncome: 0,
      employerIncome: 0,
      totalIncome: 0,
    })

    capital = (capital + event) * (1 + realPre / 100) + monthlyPMT * 12
  }

  // Retirement phase
  let surplusAtEnd = 0
  for (let yr = 0; yr <= yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const calYear = retirementYear + yr
    const pastAow = age >= aowStartAge

    const aow = pastAow ? aowMonthlyNetto : 0
    // Phase-aware tax: employer pension taxed at 36.97% before AOW age, 19.07% after
    const emp = age >= employerPensionStartAge
      ? brutoToNetto(employerPension, pastAow)
      : 0
    const fromCapital = Math.max(0, desiredMonthlyNetto - aow - emp)
    const actualFromCapital = capital > 0 ? fromCapital : 0

    yearData.push({
      age,
      year: calYear,
      capital: Math.max(0, capital),
      phase: 'uitkering',
      incomeFromCapital: actualFromCapital,
      aowIncome: aow,
      employerIncome: emp,
      totalIncome: actualFromCapital + aow + emp,
    })

    if (yr === yearsInRetirement) {
      surplusAtEnd = capital
      break
    }

    // Apply retirement life events at start of year before growth and withdrawal
    const retEvent = retEventMap.get(calYear) ?? 0
    capital = (capital + retEvent) * (1 + realPost / 100) - fromCapital * 12
  }

  const incomePhases = buildIncomePhases(
    retirementAge, lifeExpectancy,
    desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
    employerPension, employerPensionStartAge
  )

  return {
    projectedCapital,
    requiredCapital,
    desiredMonthlyNetto,
    requiredMonthlyContribution,
    yearsToRetirement,
    yearsInRetirement,
    yearData,
    incomePhases,
    surplusAtEnd,
  }
}

function buildIncomePhases(
  retirementAge: number,
  lifeExpectancy: number,
  desiredNetto: number,
  aowNetto: number,
  aowStartAge: number,
  employerPensionBruto: number,
  empStartAge: number
): IncomePhase[] {
  const breakpoints = new Set([retirementAge, lifeExpectancy])
  if (aowStartAge > retirementAge && aowStartAge < lifeExpectancy) breakpoints.add(aowStartAge)
  if (empStartAge > retirementAge && empStartAge < lifeExpectancy) breakpoints.add(empStartAge)

  const sorted = [...breakpoints].sort((a, b) => a - b)
  const phases: IncomePhase[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const fromAge = sorted[i]
    const pastAow = fromAge >= aowStartAge
    const aow = pastAow ? aowNetto : 0
    // Phase-aware tax rate for employer pension
    const emp = fromAge >= empStartAge
      ? brutoToNetto(employerPensionBruto, pastAow)
      : 0
    const fromCapital = Math.max(0, desiredNetto - aow - emp)

    phases.push({
      label: `Leeftijd ${sorted[i]}–${sorted[i + 1]}`,
      fromAge,
      toAge: sorted[i + 1],
      incomeFromCapital: fromCapital,
      aow,
      employerPension: emp,
      total: fromCapital + aow + emp,
    })
  }

  return phases
}
