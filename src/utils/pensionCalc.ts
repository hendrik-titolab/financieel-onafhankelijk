import type { PensionInputs, PensionResult, YearData, IncomePhase, LifeEvent, Woonsituatie } from '../types'
import { BOX1_PRE_AOW, BOX1_POST_AOW, AOW_NETTO_MAAND, ZVW } from '../config/fiscaleParameters'
import { belastingBox1 } from './brutoNetto'

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
  employerPension: number      // netto, fase-afhankelijk belast
  lijfrenteUitkering: number   // netto, fase-afhankelijk belast (E1-optie-B)
  fromCapital: number          // wat er nog uit eigen vermogen moet komen
}

/**
 * De AOW wordt netto ingevuld, want dat is het bedrag dat de SVB noemt en dat
 * mensen op hun overzicht zien. Voor een belastingberekening is bruto nodig.
 *
 * Bruteren kan hier met één deling, omdat over alleen een AOW-uitkering geen
 * loonheffing verschuldigd is: de algemene heffingskorting en de ouderenkorting
 * samen zijn hoger dan de belasting daarover. Wat er van bruto naar netto af gaat
 * is dus uitsluitend de bijdrage Zvw. Controle met de advieskaart 2026:
 * 1.558,15 / (1 − 4,85%) = 1.637,57, precies het brutobedrag dat daar staat.
 *
 * Dat deze verhouding wordt gebruikt en niet een vast verschil is bewust: wie
 * later naar Nederland is geïmmigreerd krijgt een gekorte AOW, en dan schaalt de
 * Zvw-inhouding mee terwijl een vast verschil ernaast zou zitten.
 */
export function aowNettoNaarBruto(nettoMaand: number): number {
  return nettoMaand / (1 - ZVW.lageBijdrage)
}

/** Bijdrage Zvw over een jaarinkomen, afgetopt op het maximumbijdrage-inkomen. */
function zvwBijdrage(brutoJaar: number): number {
  return Math.min(Math.max(0, brutoJaar), ZVW.maximumBijdrageInkomen) * ZVW.lageBijdrage
}

/** Wat er van een bruto jaarinkomen overblijft na box 1-belasting en Zvw. */
export function nettoJaarinkomen(brutoJaar: number, pastAow: boolean, alleenstaand: boolean): number {
  if (brutoJaar <= 0) return 0
  // arbeidsinkomen 0: AOW en pensioen zijn geen arbeidsinkomen, dus geen arbeidskorting.
  const r = belastingBox1(brutoJaar, { pastAow, arbeidsinkomen: 0, alleenstaand })
  return r.nettoJaar - zvwBijdrage(brutoJaar)
}

/**
 * Effectief marginaal tarief op een extra euro AOW-/pensioeninkomen: niet alleen
 * het schijftarief, maar ook de afbouw van heffingskortingen én de Zvw-bijdrage
 * (die nettoJaarinkomen ook aftrekt, en die dus ook in dit cijfer hoort — anders
 * spreekt dit tarief de netto-bedragen tegen die de rest van de tool toont).
 * Numeriek afgeleid in plaats van de tarieven los opgeteld, zodat dit cijfer nooit
 * kan losraken van wat nettoJaarinkomen() daadwerkelijk berekent (bevinding A7 was
 * precies dat een los opgeschreven formule niet meer overeenkwam met de rekenkern).
 */
export function marginaalTarief(brutoJaar: number, pastAow: boolean, alleenstaand: boolean): number {
  const delta = 100
  const laag = nettoJaarinkomen(brutoJaar, pastAow, alleenstaand)
  const hoog = nettoJaarinkomen(brutoJaar + delta, pastAow, alleenstaand)
  return 1 - (hoog - laag) / delta
}

export function getIncomeBreakdown(
  age: number,
  desiredNetto: number,
  aowNetto: number,
  aowStartAge: number,
  employerPensionBruto: number,
  employerPensionStartAge: number,
  woonsituatie: Woonsituatie = 'alleenstaand',
  // Lijfrente-/bankspaaruitkering (E1-optie-B): fiscaal beklemd, box 1, dezelfde
  // behandeling als werkgeverspensioen. Achteraan toegevoegd met een default, zodat
  // elke bestaande aanroep ongewijzigd blijft werken en compileren — geen van de
  // andere call sites in pensionCalc.ts/monteCarlo.ts hoefde hierdoor aangepast te
  // worden aan de argumentvolgorde.
  lijfrenteUitkeringBruto = 0,
  lijfrenteStartAge = 67
): MaandInkomenVerdeling {
  const pastAow = age >= aowStartAge
  const alleenstaand = woonsituatie === 'alleenstaand'

  const aow = pastAow ? aowNetto : 0
  const heeftPensioen = age >= employerPensionStartAge
  const heeftLijfrente = age >= lijfrenteStartAge

  // Belasten over het TOTALE box 1-inkomen, niet per bron. Heffingskortingen zijn
  // inkomensafhankelijk, dus per bron rekenen geeft een te hoge korting en daarmee
  // een te rooskleurig netto (bevinding E4).
  //
  // De AOW blijft staan op het bedrag dat de gebruiker invulde. Elke volgende bron
  // krijgt wat er bovenop de vorige netto overblijft. Dat is precies de marginale
  // behandeling die klopt: elke bron duwt de algemene heffingskorting en de
  // ouderenkorting verder in de afbouw. De volgorde AOW -> werkgeverspensioen ->
  // lijfrente is willekeurig gekozen (er is geen fiscaal correcte manier om een
  // gedeelde korting-afbouw over twee gelijktijdige bronnen te verdelen), niet
  // fiscaal betekenisvol.
  const aowBrutoJaar = pastAow ? aowNettoNaarBruto(aowNetto) * 12 : 0
  const pensioenBrutoJaar = heeftPensioen ? employerPensionBruto * 12 : 0
  const lijfrenteBrutoJaar = heeftLijfrente ? lijfrenteUitkeringBruto * 12 : 0

  const nettoAowJaar = pastAow ? aowNetto * 12 : 0
  const nettoAowPensioenJaar = nettoJaarinkomen(aowBrutoJaar + pensioenBrutoJaar, pastAow, alleenstaand)
  const nettoAowPensioenLijfrenteJaar = nettoJaarinkomen(
    aowBrutoJaar + pensioenBrutoJaar + lijfrenteBrutoJaar, pastAow, alleenstaand
  )

  const employerPension = Math.max(0, (nettoAowPensioenJaar - nettoAowJaar) / 12)
  const lijfrenteUitkering = Math.max(0, (nettoAowPensioenLijfrenteJaar - nettoAowPensioenJaar) / 12)

  return {
    aow,
    employerPension,
    lijfrenteUitkering,
    fromCapital: Math.max(0, desiredNetto - aow - employerPension - lijfrenteUitkering),
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
  employerPensionStartAge: number,
  woonsituatie: Woonsituatie = 'alleenstaand',
  lijfrenteUitkeringBruto = 0,
  lijfrenteStartAge = 67
): number {
  return getIncomeBreakdown(
    age, desiredNetto, aowNetto, aowStartAge, employerPensionBruto, employerPensionStartAge,
    woonsituatie, lijfrenteUitkeringBruto, lijfrenteStartAge
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
//
// De jaarinleg (monthlyPMT * 12) krijgt Math.sqrt(annualFactor) mee: de
// mid-year-conventie voor een bedrag dat in werkelijkheid in twaalf gelijke
// maandelijkse termijnen wordt ingelegd, niet in één keer aan het einde van
// het jaar. Zonder deze factor kreeg de inleg van dat jaar zelf nul rendement
// (rekenkundig alsof ze allemaal op 31 december binnenkwamen), terwijl de
// eerste termijn al in januari rendement had moeten opbouwen. Geometrisch
// (wortel) in plaats van lineair (annualFactor/2 erbij), consistent met hoe
// deze codebase elders ook exact rekent i.p.v. benadert (zie realAnnualReturn:
// (1+n)/(1+i)-1, niet n-i). Op 22 augustus 2026 hand-nagerekend: bij 10%
// rendement en €12.000 jaarinleg geeft dit €12.585,71 i.p.v. €12.000 in het
// eerste jaar — dat is 12.000 * sqrt(1,10), zoals verwacht bij een bedrag dat
// gemiddeld een half jaar heeft kunnen groeien.
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
    capital = (capital + event) * annualFactor + monthlyPMT * 12 * Math.sqrt(annualFactor)
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
    aowMaandBedragNetto, aowStartAge, woonsituatie = 'alleenstaand',
    employerPension, employerPensionStartAge,
    lijfrenteUitkering, lijfrenteStartAge,
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
      employerPension, employerPensionStartAge, woonsituatie,
      lijfrenteUitkering, lijfrenteStartAge
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
      lijfrenteIncome: 0,
      totalIncome: 0,
    })

    // Mid-year-conventie voor de jaarinleg, zie simulateAccumulation hierboven.
    capital = (capital + event) * (1 + realPre / 100) + monthlyPMT * 12 * Math.sqrt(1 + realPre / 100)
  }

  // Retirement phase
  let surplusAtEnd = 0
  for (let yr = 0; yr <= yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const calYear = retirementYear + yr

    const { aow, employerPension: emp, lijfrenteUitkering: lijf, fromCapital } = getIncomeBreakdown(
      age, desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
      employerPension, employerPensionStartAge, woonsituatie,
      lijfrenteUitkering, lijfrenteStartAge
    )
    // Alleen voor de weergave: is het vermogen op, dan krijgt iemand feitelijk nog
    // alleen AOW, werkgeverspensioen en lijfrente-/bankspaaruitkering. De
    // kapitaalmutatie hieronder gebruikt bewust de ónbeperkte fromCapital, anders
    // stopt de onttrekking zodra de pot leeg is en meet het getoonde tekort iets
    // anders dan het tekort werkelijk is (A1).
    const actualFromCapital = capital > 0 ? fromCapital : 0

    yearData.push({
      age,
      year: calYear,
      capital: Math.max(0, capital),
      phase: 'uitkering',
      incomeFromCapital: actualFromCapital,
      aowIncome: aow,
      employerIncome: emp,
      lijfrenteIncome: lijf,
      totalIncome: actualFromCapital + aow + emp + lijf,
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
    employerPension, employerPensionStartAge, woonsituatie,
    lijfrenteUitkering, lijfrenteStartAge
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
  empStartAge: number,
  woonsituatie: Woonsituatie,
  lijfrenteUitkeringBruto = 0,
  lijfrenteStartAge = 67
): IncomePhase[] {
  const breakpoints = new Set([retirementAge, lifeExpectancy])
  if (aowStartAge > retirementAge && aowStartAge < lifeExpectancy) breakpoints.add(aowStartAge)
  if (empStartAge > retirementAge && empStartAge < lifeExpectancy) breakpoints.add(empStartAge)
  if (lijfrenteStartAge > retirementAge && lijfrenteStartAge < lifeExpectancy) breakpoints.add(lijfrenteStartAge)

  const sorted = [...breakpoints].sort((a, b) => a - b)
  const phases: IncomePhase[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const fromAge = sorted[i]
    const { aow, employerPension: emp, lijfrenteUitkering: lijf, fromCapital } = getIncomeBreakdown(
      fromAge, desiredNetto, aowNetto, aowStartAge, employerPensionBruto, empStartAge,
      woonsituatie, lijfrenteUitkeringBruto, lijfrenteStartAge
    )

    phases.push({
      label: `Leeftijd ${sorted[i]}–${sorted[i + 1]}`,
      fromAge,
      toAge: sorted[i + 1],
      incomeFromCapital: fromCapital,
      aow,
      employerPension: emp,
      lijfrenteUitkering: lijf,
      total: fromCapital + aow + emp + lijf,
    })
  }

  return phases
}
