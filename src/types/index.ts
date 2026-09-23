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

/**
 * Of een uitkering meestijgt met de inflatie of een vast bedrag in euro's is.
 *
 * De rekenkern werkt in koopkracht van vandaag. Tot september 2026 telde elke
 * uitkering als koopkracht van vandaag, ook een lijfrente die als vast bedrag is
 * afgesproken. Bij 40 jaar, € 1.000 bruto per maand vanaf 67 en 2,5% inflatie is
 * zo'n vast bedrag bij ingang nog € 513 aan koopkracht waard, en de tool rekende
 * met € 1.000 (review 22 september 2026, bevinding 4).
 *
 * 'vast': het ingevulde bedrag is het bedrag dat straks op je rekening komt. De
 * kern rekent het per jaar terug naar koopkracht van vandaag.
 * 'meestijgend': het bedrag houdt zijn koopkracht, zoals de AOW.
 */
export type Indexatie = 'meestijgend' | 'vast'

/**
 * De partner als tweede, apart belaste persoon.
 *
 * De inkomstenbelasting in box 1 is individueel: twee mensen hebben elk hun eigen
 * schijven en hun eigen heffingskortingen. De tool rekende één persoon, en voor
 * een stel ging dat op twee manieren mis. Vulde je alleen je eigen AOW in, dan
 * miste het huishouden de AOW van je partner. Vulde je de opgetelde AOW in één
 * veld in, dan belastte de tool dat als het inkomen van één persoon.
 *
 * Doorgerekend met de parameters van 2026, twee partners met elk € 1.084 AOW
 * netto en € 1.500 werkgeverspensioen bruto per maand:
 *   apart belast (juist)          € 4.673,81 netto per maand
 *   samengeteld in één veld       € 3.718,73
 *   verschil                      €   955,08, oftewel 25,7%
 *
 * Bij alleen AOW is het verschil circa 5%. Zodra er aanvullend pensioen bij komt
 * loopt het hard op, omdat één persoon door de schijven schuift en zijn
 * ouderenkorting volledig afbouwt terwijl twee personen elk onder die grenzen
 * blijven (audit 7 september 2026, bevinding 16).
 *
 * Bewust NIET gemodelleerd: een aparte portefeuille per persoon, een
 * nabestaandenscenario, een aparte planningshorizon, en een lijfrente voor de
 * partner. Die staan als openstaand punt in CLAUDE.md.
 */
export interface PartnerGegevens {
  actief: boolean
  /** Huidige leeftijd van de partner. Mag afwijken van die van de hoofdpersoon. */
  leeftijd: number
  aowMaandBedragNetto: number
  aowStartAge: number
  employerPension: number          // bruto/mnd
  employerPensionStartAge: number
  /** Ontbreekt bij oudere invoer; dan 'meestijgend', het gedrag van vóór deze keuze. */
  employerPensionIndexatie?: Indexatie
}

/**
 * Levenslang verzekerd of tijdelijk (bancair of verzekerd).
 *
 * Het verschil is fiscaal en praktisch relevant: een levenslange
 * oudedagslijfrente loopt tot overlijden en kent geen jaarmaximum, een tijdelijke
 * oudedagslijfrente loopt een afgesproken aantal jaren en kent dat wel
 * (art. 3.125 lid 1 onderdeel c Wet IB 2001).
 */
export type LijfrenteSoort = 'levenslang' | 'tijdelijk'

export interface PensionInputs {
  currentAge: number
  retirementAge: number
  lifeExpectancy: number

  currentCapital: number
  monthlyContribution: number
  contributionFrequency: ContributionFrequency

  returnBeforeRetirement: number  // nominal annual %, BRUTO: voor kosten en belasting
  returnAfterRetirement: number   // nominal annual %, BRUTO: voor kosten en belasting
  inflation: number               // annual %

  /**
   * Lopende kosten van beleggen, in procentpunten van het rendement.
   *
   * De rendementen hierboven zijn bruto. Tot september 2026 zei de UI dat ze
   * "netto na kosten en box 3" waren terwijl er nergens iets werd afgetrokken en
   * risicoprofielen.ts diezelfde getallen als nominaal documenteert (audit
   * 7 september 2026, bevinding 10). Standaard 0, zodat een bestaande berekening
   * dezelfde uitkomst houdt en de gebruiker zelf kiest wat hij invult.
   */
  kostenPct: number
  /**
   * Vermogensbelasting (box 3), in procentpunten van het rendement.
   *
   * Doet alleen iets als vermogensbelastingHandmatig true is. Staat die op false,
   * dan rekent de kern de heffing per jaar uit over het dán actuele vermogen en
   * blijft dit veld ongebruikt; het houdt dan wel de schatting bij het opgegeven
   * vermogen vast, zodat overschakelen naar handmatig met een zinnig getal begint.
   */
  vermogensbelastingPct: number
  /**
   * Welke van de twee box 3-routes de rekenkern volgt.
   *
   * false: de heffing wordt elk jaar opnieuw berekend over het vermogen van dát
   * jaar en gaat in euro's van het saldo af. Dit is sinds september 2026 de
   * standaard in de tool, en het antwoord op openstaand punt 2 uit de audit van
   * 7 september 2026: één vast percentage over de hele looptijd kan niet kloppen,
   * want door het heffingsvrije vermogen loopt de druk op met de omvang van het
   * vermogen (ongeveer 0,9 procentpunt bij een ton, ruim 2,0 bij een miljoen).
   *
   * true: de gebruiker vult zelf een vast percentage in, dat als procentpunten van
   * het rendement af gaat. Dat was tot september 2026 de enige route.
   *
   * Nooit allebei: staat deze vlag op false, dan doet vermogensbelastingPct niets.
   * De default in de testfixtures is bewust true met 0%, zodat de golden values van
   * vóór deze wijziging onveranderd blijven.
   */
  vermogensbelastingHandmatig: boolean

  currentIncome: number
  currentIncomeType: IncomeType
  desiredRetirementIncome: number
  desiredRetirementIncomeType: IncomeType

  // Bepaalt de standaard AOW-bedragen én of de alleenstaandeouderenkorting geldt.
  woonsituatie: Woonsituatie
  aowMaandBedragNetto: number  // net monthly AOW amount (find on mijnpensioenoverzicht.nl)
  /**
   * Of het AOW-vakantiegeld meetelt.
   *
   * De SVB keert het in mei apart uit, dus het maandbedrag op je overzicht is
   * exclusief. De rekenkern gebruikte twaalf van die maandbedragen en liet het
   * vakantiegeld vallen, waardoor het beschikbare inkomen structureel circa 6,4%
   * te laag uitkwam (audit 7 september 2026, bevinding 12). Standaard aan; uit
   * zetten hoort alleen als het ingevulde bedrag het al bevat.
   */
  aowVakantiegeld: boolean

  /**
   * De partner. `actief: false` betekent dat er alleen voor één persoon wordt
   * gerekend, en dan is de uitkomst exact gelijk aan die van vóór september 2026.
   */
  partner: PartnerGegevens
  aowStartAge: number         // age at which AOW kicks in
  employerPension: number     // gross monthly (bruto/maand)
  employerPensionStartAge: number  // age at which employer pension kicks in (default 67, see UPO)
  /** Zie Indexatie. Ontbreekt bij oudere invoer; dan 'meestijgend'. */
  employerPensionIndexatie?: Indexatie

  // Lijfrente, banksparen of pensioenbeleggen: fiscaal beklemd (box 1), geen vrije
  // onttrekking mogelijk (art. 3.125 Wet IB 2001). Ingevuld als de verwáchte
  // bruto-uitkering die het product oplevert, niet als opbouw — dezelfde conventie
  // als werkgeverspensioen hierboven (E1-optie-B).
  lijfrenteUitkering: number        // gross monthly (bruto/maand)
  lijfrenteStartAge: number         // age at which the lijfrente-/bankspaaruitkering starts
  /**
   * Levenslang of tijdelijk.
   *
   * De tool kende dit onderscheid niet: iedere lijfrente liep door tot de
   * planningshorizon, waardoor een tijdelijke uitkering van vijf of twintig jaar
   * veel te lang meetelde. Bovendien werd elke uitkering getoetst aan de grens
   * voor een overbruggingslijfrente (EUR 63.288), terwijl een levenslange
   * oudedagslijfrente helemaal geen jaarmaximum kent en voor een tijdelijke
   * oudedagslijfrente een heel ander bedrag geldt (audit 7 september 2026,
   * bevinding 9).
   */
  lijfrenteSoort: LijfrenteSoort
  /**
   * Leeftijd waarop een tijdelijke uitkering stopt. Alleen van betekenis bij
   * lijfrenteSoort 'tijdelijk'; bij 'levenslang' loopt de uitkering door tot de
   * planningshorizon.
   */
  lijfrenteEindLeeftijd: number
  /** Zie Indexatie. Ontbreekt bij oudere invoer; dan 'meestijgend'. */
  lijfrenteIndexatie?: Indexatie

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

/**
 * Wat één persoon netto per maand aan vaste uitkeringen ontvangt. Stond tot
 * 15 september 2026 in pensionCalc.ts; hierheen verplaatst toen IncomePhase het
 * partnerdeel ging meedragen, anders zou types/index.ts uit de rekenkern moeten
 * importeren en die importeert zelf al uit dit bestand.
 */
export interface PersoonInkomen {
  aow: number
  employerPension: number
  lijfrenteUitkering: number
  totaal: number
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
   * Het deel van de drie bronnen hierboven dat van de partner komt, of null als
   * er geen partner meerekent. Alleen voor weergave: de bedragen hierboven zijn
   * al inclusief dit deel, dus nooit bij elkaar optellen.
   *
   * incomeFromCapital heeft bewust geen tegenhanger. Box 1 is individueel, dus
   * AOW en pensioen zijn per persoon toe te rekenen; het vermogen is dat niet,
   * dat geldt in dit model voor het huishouden samen (zie CLAUDE.md,
   * "Huishoudmodel is er half").
   */
  partner: PersoonInkomen | null
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
   * en in de export.
   *
   * Niet meer gelijk aan requiredCapital zodra er niets te overbruggen is: deze
   * formule kent de box 3-heffing niet, requiredCapital sinds september 2026 wel
   * (vermogensbelastingHandmatig:false). Een verschil tussen deze twee kan dus
   * zowel van een echte overbrugging komen als van box 3 alleen — zie
   * overbruggingsToeslag hieronder voor hoe dat uit elkaar wordt gehouden
   * (bevinding review 14 september 2026).
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
   * tot een later eenmalig bedrag binnenkomt: het verschil tussen "op de einddatum
   * op nul uitkomen" en "onderweg nooit onder nul komen", gerekend zonder box 3.
   *
   * Tot 22 september 2026 telde dit alleen mee als er een periode vóór de eerste
   * uitkering was. Wie ná de AOW-datum stopte en op 73 zou erven, kreeg daardoor
   * een doelbedrag waarvan € 120.637 in de opbouw nergens verklaard werd (review
   * 22 september 2026, bevinding 3).
   *
   * Samen sluiten de vier delen altijd: requiredCapitalEindwaarde +
   * overbruggingsToeslag + laterGeldOverschot + box3Toeslag = requiredCapital.
   */
  overbruggingsToeslag: number
  /**
   * Alleen als wat er later binnenkomt méér is dan alle onttrekkingen samen: dan is
   * de eindwaarde negatief, maar nodig is € 0 en niet minder. Dit veld is dat
   * verschil, zodat de opbouw ook dan optelt.
   */
  laterGeldOverschot: number
  /**
   * Wat de box 3-heffing aan het doelbedrag toevoegt. Nul als de heffing via een
   * vast percentage op het rendement loopt, want dan zit ze al in het rendement.
   */
  box3Toeslag: number
  /**
   * Het vermogen komt in de opbouwfase onder nul, bijvoorbeeld door een uitgave die
   * er nog niet is. Leeftijd van het eerste jaar waarin dat gebeurt en het diepste
   * tekort. Null als dat niet gebeurt.
   *
   * Tot 22 september 2026 toetste alleen de simulatie dit. De vaste berekening liet
   * een negatief saldo gewoon doorgroeien tegen beleggingsrendement, alsof lenen
   * gratis was, en meldde een overschot terwijl de simulatie 0% gaf (review
   * 22 september 2026, bevinding 1).
   */
  opbouwTekort: { leeftijd: number; bedrag: number } | null
  /**
   * Aantal jaar tussen de pensioendatum en de eerste eigen inkomstenbron (AOW,
   * werkgeverspensioen, lijfrente, of de partner-equivalenten). Nul als er geen
   * overbruggingsperiode is. Los van overbruggingsToeslag teruggegeven zodat het
   * scherm "X jaar" kan tonen zonder de ingangsleeftijden-vergelijking zelf over
   * te doen (bevinding review 14 september 2026).
   */
  overbruggingsJaren: number
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
  /**
   * Het vermogen op de feitelijke pensioenleeftijd in het slechtweerscenario: het
   * 5e percentiel. Dezelfde maat die pensioenfondsen hanteren (art. 30b lid 5
   * Regeling Pensioenwet en Wvb). Eén op de twintig scenario's valt lager uit.
   */
  slechtWeerBijPensioen: number
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
  pensioenType: PensioenType   // geen / traditioneel DB (factor A) / Wtp (pensioenpremie)
  factorA: number              // DB-regeling: pensioenaangroei van UPO (t-1), in €/jaar
  /**
   * Wtp-regeling: de TOTALE premie die in t-1 in de werkgeversregeling is gestort,
   * dus werkgeversdeel én eigen bijdrage samen.
   *
   * Heette werkgeverspremie en het scherm vroeg ook alleen naar het werkgeversdeel.
   * Dat is te weinig: het bedrag dat de jaarruimte vermindert is de totale inleg in
   * de regeling (audit 7 september 2026, bevinding 18; bevestigd door Hendrik op
   * 8 september 2026). Wie alleen het werkgeversdeel invulde kreeg een te hoge
   * jaarruimte en dus een te hoge aftrek.
   *
   * De veldnaam is meeveranderd omdat een naam die het tegenovergestelde zegt van
   * wat er bedoeld wordt precies de fout is die hier gemaakt werd. Opgeslagen
   * berekeningen met de oude naam worden bij het inlezen omgezet.
   */
  pensioenpremie: number
  alIngelegd: number           // already deposited in lijfrente this year
  reserveringsruimteRijen: ReserveringsruimteRij[]  // up to 10 past years, progressive UI
  // Alleen nodig bij belastingjaar 2021 of 2022. Het plafond van de
  // reserveringsruimte hing toen af van de leeftijd op 1 januari van dat jaar.
  geboortedatum?: string       // ISO, bijv. '1964-08-15'
  /**
   * Verwacht belastbaar inkomen in het jaar waarin je de lijfrentepremie aftrekt.
   *
   * De jaarruimte zelf rekent met het inkomen van het vóórafgaande jaar (art. 3.127
   * lid 1 Wet IB 2001), maar het belastingvoordeel valt in het aftrekjaar. Die twee
   * hoeven niet gelijk te zijn. Blijft dit leeg, dan valt de schatting terug op
   * `income` en zegt de UI dat erbij (audit 7 september 2026, bevinding 19).
   */
  aftrekjaarInkomen?: number
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
  /**
   * Met welk rekenmodel en welke fiscale cijfers deze berekening destijds is
   * gemaakt. Zonder dit is een heropende berekening uit vorig jaar niet te
   * verklaren: het bedrag klopt dan niet met wat de tool vandaag zou uitrekenen,
   * en niets laat zien waarom.
   *
   * Optioneel omdat berekeningen van vóór 16 september 2026 het niet hebben. Bij
   * het laden blijft het dan leeg en toont het scherm er niets over, in plaats van
   * een versie te verzinnen die er nooit was (WP9, vraag 5).
   */
  modelVersie?: string
  /** Belastingjaar van de fiscale parameters waarmee is gerekend. */
  parameterJaar?: number
}

/**
 * Eén afgeronde berekening: de invoer, beide uitkomsten en waar ze vandaan komen.
 *
 * Tot september 2026 kon een export twee verschillende berekeningen door elkaar
 * halen. De deterministische uitkomst werd bij elke toetsaanslag opnieuw berekend,
 * de Monte Carlo-uitkomst alleen op knopdruk, en exporteren mocht altijd. Een
 * Excel-bestand bevatte dan een invoertab met € 50.000 vermogen naast een Monte
 * Carlo-tab die op € 100.000 begon: aantoonbaar verschillende scenario's in één
 * rapport (audit 7 september 2026, bevinding 6).
 *
 * Deze set wordt vastgelegd op het moment van rekenen en daarna niet meer
 * aangeraakt. De export leest uitsluitend hieruit.
 */
export interface BerekeningsSet {
  inputs: PensionInputs
  result: PensionResult
  mc: MonteCarloResult
  /** Wanneer er gerekend is, als ISO-string. */
  peildatum: string
  /** Versie van de rekenmodellen, zie config/modelVersie.ts. */
  modelVersie: string
  /** Belastingjaar van de gebruikte fiscale parameters. */
  parameterJaar: number
}
