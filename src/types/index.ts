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

  // Lijfrente, banksparen of pensioenbeleggen: fiscaal beklemd (box 1), geen vrije
  // onttrekking mogelijk (art. 3.125 Wet IB 2001). Ingevuld als de verwáchte
  // bruto-uitkering die het product oplevert, niet als opbouw — dezelfde conventie
  // als werkgeverspensioen hierboven (E1-optie-B).
  lijfrenteUitkering: number        // gross monthly (bruto/maand)
  lijfrenteStartAge: number         // age at which the lijfrente-/bankspaaruitkering starts

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
  // Income breakdown for this year, alles netto per maand.
  /** Wat er dit jaar uit eigen vermogen nódig was om het inkomensdoel te halen. */
  desiredFromCapital: number
  /** Wat er werkelijk uit vermogen betaald kon worden. Nooit meer dan er staat. */
  incomeFromCapital: number
  /** Het ongedekte deel: desiredFromCapital − incomeFromCapital. Nul als het lukt. */
  shortfall: number
  aowIncome: number
  employerIncome: number
  lijfrenteIncome: number
  /** incomeFromCapital + de drie vaste bronnen. Wat er werkelijk binnenkomt. */
  totalIncome: number
}

export interface IncomePhase {
  label: string
  fromAge: number
  toAge: number
  /**
   * Het bedrag dat in deze fase uit eigen vermogen nódig is. Of dat ook betaald
   * kan worden zegt shortfallFromAge: deze fasenlijst is een weergave van het
   * inkomensplan, niet van het saldoverloop.
   */
  incomeFromCapital: number
  aow: number
  employerPension: number
  lijfrenteUitkering: number
  total: number
  /**
   * De eerste leeftijd binnen deze fase waarop het vermogen het gewenste bedrag
   * niet meer kan opbrengen, of null als de fase volledig gedekt is. Afgeleid uit
   * dezelfde yearData als de grafiek, zodat de fasenlijst geen inkomen kan tonen
   * dat de rekenkern nergens betaalt.
   */
  shortfallFromAge: number | null
}

export interface PensionResult {
  projectedCapital: number
  /**
   * Het kleinste vermogen op de pensioendatum waarbij het saldo in geen enkel jaar
   * negatief wordt. Was tot september 2026 een zuivere eindwaardeberekening, die
   * niet zag dat een erfenis over vijf jaar de eerste vijf jaar niet betaalt
   * (audit 7 september 2026, bevinding 2).
   */
  requiredCapital: number
  /**
   * Hetzelfde doelbedrag volgens alleen de eindwaarde: contante waarde van de
   * onttrekkingen minus pvEventsAfterRetirement. Verklaart de opbouw op het scherm
   * en in de export. Gelijk aan requiredCapital zolang er niets te overbruggen is.
   */
  requiredCapitalEindwaarde: number
  /**
   * De leeftijd waarop de uitkeringsfase feitelijk begint. Gelijk aan de ingestelde
   * pensioenleeftijd, behalve wanneer iemand die al voorbij is: dan begint de
   * uitkeringsfase vandaag. Het scherm en de exports labelen hierop, zodat er geen
   * "bij leeftijd 60" boven een berekening staat die vanaf 70 loopt.
   */
  effectiveRetirementAge: number
  /**
   * Wat er bovenop requiredCapitalEindwaarde nodig is om de jaren te overbruggen
   * tot een later bedrag binnenkomt. Nul als de eindwaarde al toereikend is.
   */
  overbruggingsToeslag: number
  /**
   * De leeftijd waarop het inkomensdoel voor het eerst niet meer volledig uit
   * vermogen betaald kan worden, of null als dat niet gebeurt. "Wanneer ontstaat
   * het eerste tekort" is voor een adviesgesprek een bruikbaarder antwoord dan
   * alleen een bedrag aan het eind.
   */
  firstShortfallAge: number | null
  // Contante waarde, op de pensioendatum, van de eenmalige bedragen ná die datum.
  // Positief = geld dat later binnenkomt en dus verlaagt wat je óp de pensioendatum
  // nodig hebt. requiredCapital hierboven is hier al mee verrekend; wat je inkomen
  // op zichzelf kost (zonder die latere bedragen) is requiredCapital + dit veld.
  // Apart teruggegeven zodat het scherm en de export die verrekening kunnen tonen
  // in plaats van hem stilzwijgend in één getal te verstoppen.
  pvEventsAfterRetirement: number
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
