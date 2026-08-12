import type { PensionInputs, PensionResult, YearData, IncomePhase, LifeEvent } from '../types'
import { BOX1_PRE_AOW, BOX1_POST_AOW, AOW_NETTO_MAAND } from '../config/fiscaleParameters'

// AOW netto maandbedragen — uit centrale config (fiscaleParameters.ts)
export const AOW_NETTO = {
  alleenstaand: AOW_NETTO_MAAND.alleenstaand,
  samenwonend:  AOW_NETTO_MAAND.samenwonend,
}

// Box 1 bruto → netto conversie — tarieven uit centrale config (fiscaleParameters.ts)
export function brutoToNetto(bruto: number, pastAowAge: boolean): number {
  if (bruto <= 0) return 0
  const t = pastAowAge ? BOX1_POST_AOW : BOX1_PRE_AOW
  if (bruto <= t.schijf1Grens) return bruto * (1 - t.schijf1Tarief)
  if (bruto <= t.schijf2Grens) return t.schijf1Grens * (1 - t.schijf1Tarief) + (bruto - t.schijf1Grens) * (1 - t.schijf2Tarief)
  return t.schijf1Grens * (1 - t.schijf1Tarief) + (t.schijf2Grens - t.schijf1Grens) * (1 - t.schijf2Tarief) + (bruto - t.schijf2Grens) * (1 - t.schijf3Tarief)
}

export function nettoToBruto(netto: number, pastAowAge: boolean): number {
  if (netto <= 0) return 0
  const t = pastAowAge ? BOX1_POST_AOW : BOX1_PRE_AOW
  const net1 = t.schijf1Grens * (1 - t.schijf1Tarief)
  const net2 = net1 + (t.schijf2Grens - t.schijf1Grens) * (1 - t.schijf2Tarief)
  if (netto <= net1) return netto / (1 - t.schijf1Tarief)
  if (netto <= net2) return t.schijf1Grens + (netto - net1) / (1 - t.schijf2Tarief)
  return t.schijf2Grens + (netto - net2) / (1 - t.schijf3Tarief)
}

function realAnnualReturn(nominal: number, inflation: number): number {
  return ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100
}

// Netto maandinkomen op een gegeven leeftijd, uitgesplitst naar bron.
// Enige plek waar deze opsplitsing wordt gemaakt: de jaartabel, de fasenlijst en
// monteCarlo.ts leunen alle drie hierop (was tot augustus 2026 drie keer los
// uitgeschreven, bevinding A1).
export interface MaandInkomenVerdeling {
  aow: number
  employerPension: number  // netto, fase-afhankelijk belast
  fromCapital: number      // wat er nog uit eigen vermogen moet komen
}

export function getIncomeBreakdown(
  age: number,
  desiredNetto: number,
  aowNetto: number,
  aowStartAge: number,
  employerPensionBruto: number,
  employerPensionStartAge: number
): MaandInkomenVerdeling {
  const pastAow = age >= aowStartAge
  const aow = pastAow ? aowNetto : 0
  // Tax rate changes at AOW age: 36.97% → 19.07%
  const employerPension = age >= employerPensionStartAge
    ? brutoToNetto(employerPensionBruto, pastAow)
    : 0
  return {
    aow,
    employerPension,
    fromCapital: Math.max(0, desiredNetto - aow - employerPension),
  }
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
  return getIncomeBreakdown(
    age, desiredNetto, aowNetto, aowStartAge, employerPensionBruto, employerPensionStartAge
  ).fromCapital
}

function buildEventMap(
  events: LifeEvent[],
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

export function calculatePension(inputs: PensionInputs, opts?: { currentYear?: number }): PensionResult {
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentCapital, monthlyContribution, contributionFrequency,
    returnBeforeRetirement, returnAfterRetirement, inflation,
    desiredRetirementIncome, desiredRetirementIncomeType,
    aowMaandBedragNetto, aowStartAge,
    employerPension, employerPensionStartAge,
    lifeEvents = [],
  } = inputs

  const realPre = realAnnualReturn(returnBeforeRetirement, inflation)
  const realPost = realAnnualReturn(returnAfterRetirement, inflation)

  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  const yearsInRetirement = Math.max(1, lifeExpectancy - retirementAge)

  const monthlyPMT = contributionFrequency === 'jaarlijks'
    ? monthlyContribution / 12
    : monthlyContribution

  const currentYear = opts?.currentYear ?? new Date().getFullYear()
  const retirementYear = currentYear + yearsToRetirement

  // Split life events into accumulation and retirement phase
  const accEventMap = buildEventMap(lifeEvents, currentYear, retirementYear)
  const retEventMap = buildEventMap(lifeEvents, retirementYear, retirementYear + yearsInRetirement + 1)

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
  // Discontering met exponent yr + 1: dezelfde eind-jaar-conventie als de
  // jaar-voor-jaar-simulatie verderop (eerst een vol jaar rendement, dan de
  // onttrekking). Anders ligt dit doelbedrag ~1% boven wat de simulatie werkelijk
  // nodig heeft en spreken het KPI-oordeel en de jaartabel elkaar tegen (E9).
  const rPostAnnual = 1 + realPost / 100
  let requiredCapital = 0
  for (let yr = 0; yr < yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const annualWithdrawal = getMonthlyWithdrawal(
      age, desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
      employerPension, employerPensionStartAge
    ) * 12
    requiredCapital += annualWithdrawal / Math.pow(rPostAnnual, yr + 1)
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

    const { aow, employerPension: emp, fromCapital } = getIncomeBreakdown(
      age, desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
      employerPension, employerPensionStartAge
    )
    // Alleen voor de weergave: is het vermogen op, dan krijgt iemand feitelijk nog
    // alleen AOW en werkgeverspensioen. De kapitaalmutatie hieronder gebruikt bewust
    // de ónbeperkte fromCapital, anders stopt de onttrekking zodra de pot leeg is en
    // meet het getoonde tekort iets anders dan het tekort werkelijk is (A1).
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
    const { aow, employerPension: emp, fromCapital } = getIncomeBreakdown(
      fromAge, desiredNetto, aowNetto, aowStartAge, employerPensionBruto, empStartAge
    )

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
