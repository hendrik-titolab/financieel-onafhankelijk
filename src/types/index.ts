export type IncomeType = 'bruto' | 'netto'
export type ContributionFrequency = 'maandelijks' | 'jaarlijks'
export type { RiskProfile } from '../config/risicoprofielen'
import type { RiskProfile } from '../config/risicoprofielen'

// A life event is a named one-time financial event (schenking, woningaankoop, erfenis…).
export interface LifeEvent {
  name: string    // e.g. "Schenking huis dochter"
  amount: number  // positive = inkomst, negative = uitgave
  year: number    // calendar year
}

export type Woonsituatie = 'alleenstaand' | 'samenwonend'

export interface PensionInputs {
  currentAge: number
  retirementAge: number
  lifeExpectancy: number

  currentCapital: number
  monthlyContribution: number
  contributionFrequency: ContributionFrequency

  returnBeforeRetirement: number  // nominal annual %
  returnAfterRetirement: number   // nominal annual %
  inflation: number               // annual %

  currentIncome: number
  currentIncomeType: IncomeType
  desiredRetirementIncome: number
  desiredRetirementIncomeType: IncomeType

  // Bepaalt de standaard AOW-bedragen én of de alleenstaandeouderenkorting geldt.
  woonsituatie: Woonsituatie
  aowMaandBedragNetto: number  // net monthly AOW amount (find on mijnpensioenoverzicht.nl)
  aowStartAge: number         // age at which AOW kicks in
  employerPension: number     // gross monthly (bruto/maand)
  employerPensionStartAge: number  // age at which employer pension kicks in (default 67, see UPO)

  lifeEvents: LifeEvent[]  // named events: schenking, woningaankoop, erfenis…

  volatilityPre: number       // std dev annual % for Monte Carlo
  volatilityPost: number

  riskProfile: RiskProfile      // gekozen risicoprofiel (stuurt rendement + volatiliteit)
  useCustomReturns: boolean     // true = gebruiker vult rendement/volatiliteit zelf in
}

export interface YearData {
  age: number
  year: number
  capital: number
  phase: 'opbouw' | 'uitkering'
  // Income breakdown for this year
  incomeFromCapital: number
  aowIncome: number
  employerIncome: number
  totalIncome: number
}

export interface IncomePhase {
  label: string
  fromAge: number
  toAge: number
  incomeFromCapital: number
  aow: number
  employerPension: number
  total: number
}

export interface PensionResult {
  projectedCapital: number
  requiredCapital: number
  desiredMonthlyNetto: number
  requiredMonthlyContribution: number
  yearsToRetirement: number
  yearsInRetirement: number
  yearData: YearData[]
  incomePhases: IncomePhase[]
  surplusAtEnd: number  // capital remaining at life expectancy (negative = shortfall)
}

export interface MonteCarloResult {
  successRate: number      // % simulations where full income target is met
  successRate75: number    // % simulations where at least 75% of income target is met
  percentileData: PercentilePoint[]
}

export interface PercentilePoint {
  age: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

// --- Jaarruimte ---

// One row in the reserveringsruimte table: a past year and the unbenuted (unused) jaarruimte from that year
export interface ReserveringsruimteRij {
  jaar: number
  onbenutBedrag: number
}

export type PensioenType = 'geen' | 'db' | 'wtp'

export interface JaarruimteInputs {
  year: number
  income: number
  pensioenType: PensioenType   // geen / traditioneel DB (factor A) / Wtp (werkgeverspremie)
  factorA: number              // DB-regeling: pensioenaangroei van UPO (t-1), in €/jaar
  werkgeverspremie: number     // Wtp-regeling: door werkgever ingelegde premie in t-1
  alIngelegd: number           // already deposited in lijfrente this year
  reserveringsruimteRijen: ReserveringsruimteRij[]  // up to 10 past years, progressive UI
  // Alleen nodig bij belastingjaar 2021 of 2022. Het plafond van de
  // reserveringsruimte hing toen af van de leeftijd op 1 januari van dat jaar.
  geboortedatum?: string       // ISO, bijv. '1964-08-15'
  clientName: string
  adviseurNaam: string
  notities: string
}

export interface JaarruimteResult {
  jaarruimte: number                    // calculated jaarruimte for the chosen year
  beschikbareReserveringsruimte: number  // sum of past unbenuted jaarruimte (capped per year)
  totaalBeschikbaar: number             // jaarruimte + beschikbareReserveringsruimte
  alIngelegd: number                    // already deposited (from input)
  nogTeDoen: number                     // remaining room = totaalBeschikbaar - alIngelegd
  belastingVoordeel: number             // tax benefit on the remaining amount to deposit
  belastingTarief: number
  // Welk plafond op de reserveringsruimte is toegepast, en waarom. Voor 2021 en
  // 2022 kan dat het percentage van de premiegrondslag zijn of een van twee
  // leeftijdsafhankelijke bedragen; vanaf 2023 is het altijd het vaste jaarplafond.
  reserveringsruimtePlafond: number
  reserveringsruimtePlafondReden: string
}

export interface SavedJaarruimte {
  id: string
  clientName: string
  adviseurNaam: string
  date: string
  year: number
  inputs: JaarruimteInputs
  result: JaarruimteResult
  notities: string
}
