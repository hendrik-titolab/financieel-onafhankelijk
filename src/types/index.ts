export type IncomeType = 'bruto' | 'netto'
export type ContributionFrequency = 'maandelijks' | 'jaarlijks'

// A life event is a named one-time financial event (schenking, woningaankoop, erfenis…).
export interface LifeEvent {
  name: string    // e.g. "Schenking huis dochter"
  amount: number  // positive = inkomst, negative = uitgave
  year: number    // calendar year
}

// A planned extra deposit or withdrawal
export interface Storting {
  name?: string   // optionele omschrijving
  amount: number  // positive = storting, negative = onttrekking
  year: number
}

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

  aowMaandBedragNetto: number  // net monthly AOW amount (find on mijnpensioenoverzicht.nl)
  aowStartAge: number         // age at which AOW kicks in
  employerPension: number     // gross monthly (bruto/maand)
  employerPensionStartAge: number  // age at which employer pension kicks in (default 67, see UPO)

  lifeEvents: LifeEvent[]  // named events: schenking, woningaankoop, erfenis…
  stortingen: Storting[]  // extra deposits (positive) or withdrawals (negative) by year

  volatilityPre: number       // std dev annual % for Monte Carlo
  volatilityPost: number
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
