import type { PensionInputs, PensionResult, YearData, IncomePhase, LifeEvent, Woonsituatie } from '../types'
import { AOW_NETTO_MAAND, ZVW } from '../config/fiscaleParameters'
import { belastingBox1 } from './brutoNetto'

// AOW netto maandbedragen — uit centrale config (fiscaleParameters.ts)
export const AOW_NETTO = {
  alleenstaand: AOW_NETTO_MAAND.alleenstaand,
  samenwonend:  AOW_NETTO_MAAND.samenwonend,
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
 * Een bruto MAANDbedrag naar netto per maand, via de volledige belastingmotor.
 *
 * Hier stond tot september 2026 een eigen conversie (brutoToNetto) die een
 * maandbedrag rechtstreeks tegen de JAARschijven legde. Bij € 5.000 bruto per
 * maand viel dat bedrag daardoor altijd in de eerste schijf en kwam er € 4.107,50
 * netto uit, terwijl het werkelijke antwoord voor een alleenstaande die het hele
 * jaar AOW-gerechtigd is rond € 3.612 ligt. Het netto doelinkomen lag zo circa
 * 14% te hoog, en daarmee ook het benodigde vermogen en de benodigde inleg.
 *
 * Even belangrijk: die conversie kende geen heffingskortingen en geen Zvw,
 * terwijl getIncomeBreakdown() hieronder de inkomstenbronnen wél door
 * belastingBox1 + Zvw haalt. Er stonden dus twee belastingmotoren naast elkaar
 * in één berekening. Alleen ×12 doen had die scheefheid laten staan; daarom loopt
 * dit nu door dezelfde nettoJaarinkomen() als alle andere bronnen.
 *
 * Let op de beperking: dit is één conversie voor de hele uitkeringsfase, op basis
 * van het regime dat geldt op de pensioendatum. Wie vóór de AOW-leeftijd stopt
 * betaalt over hetzelfde brutobedrag in de overbruggingsjaren méér belasting dan
 * daarna. De invoer is één getal, dus dat verschil is hier niet uit te drukken.
 * De UI benoemt onder welke aannames de omrekening geldt.
 */
export function brutoMaandNaarNettoMaand(
  brutoMaand: number,
  pastAow: boolean,
  alleenstaand: boolean
): number {
  if (brutoMaand <= 0) return 0
  return nettoJaarinkomen(brutoMaand * 12, pastAow, alleenstaand) / 12
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

/**
 * Doorloopt de uitkeringsfase vanaf een gegeven startvermogen en geeft terug wat
 * het laagste saldo onderweg was. Zelfde recursie als de jaartabel verderop:
 * eenmalig bedrag aan het begin van het jaar, dan rendement, dan de onttrekking.
 *
 * Het laagste saldo is wat telt, niet het eindsaldo. Een eindwaardeberekening zegt
 * alleen of het geld op de einddatum uitkomt, niet of iedere tussenliggende maand
 * betaalbaar was. Zie findRequiredCapital() hieronder.
 */
function simulateRetirementPath(
  startCapital: number,
  yearsInRetirement: number,
  retirementAge: number,
  retirementYear: number,
  realPostAnnual: number,
  retEventMap: Map<number, number>,
  withdrawalAtAge: (age: number) => number
): { minCapital: number; endCapital: number } {
  let capital = startCapital
  let minCapital = startCapital
  const factor = 1 + realPostAnnual / 100

  for (let yr = 0; yr < yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const event = retEventMap.get(retirementYear + yr) ?? 0
    capital = (capital + event) * factor - withdrawalAtAge(age) * 12
    // Ná de onttrekking van dat jaar: dát is het moment waarop de rekening
    // betaald moet zijn. Vóór de onttrekking meten zou een tekort dat pas in
    // december ontstaat een jaar te laat zien.
    if (capital < minCapital) minCapital = capital
  }

  return { minCapital, endCapital: capital }
}

/**
 * Het kleinste startvermogen waarbij het saldo in GEEN ENKEL jaar negatief wordt.
 *
 * Hier stond tot september 2026 een contante-waardeberekening die de contante
 * waarde van latere ontvangsten volledig van het doelbedrag aftrok. Dat is een
 * eindwaardeberekening en die garandeert niet dat iedere tussentijdse uitgave
 * betaalbaar is. Het geval uit de audit van 7 september 2026: stoppen op 60,
 * plannen tot 70, geen vermogen, € 1.000 netto per maand nodig, en over vijf jaar
 * € 120.000 erven. Het doelbedrag kwam op € 0 uit en de hoofdvergelijking meldde
 * geen tekort, terwijl de simulatie 0% slaagde. Voor de eerste vijf jaar is
 * € 60.000 overbrugging nodig.
 *
 * Het saldo is een strikt stijgende functie van het startvermogen (de recursie is
 * lineair, iedere euro extra groeit mee met r^t), dus bisectie vindt hier één
 * eenduidig antwoord. De bovengrens wordt eerst verdubbelend gezocht: een vaste
 * bovengrens kan bij een negatief reëel rendement of een grote uitgave in de
 * uitkeringsfase te laag uitvallen, en dan zou de tool stilzwijgend een te laag
 * doelbedrag noemen.
 *
 * Zonder eenmalige bedragen komt dit exact op de oude contante waarde uit: het
 * saldo daalt dan monotoon naar nul op de einddatum, dus het laagste saldo ís het
 * eindsaldo. Dat is vastgelegd in een test.
 */
function findRequiredCapital(
  yearsInRetirement: number,
  retirementAge: number,
  retirementYear: number,
  realPostAnnual: number,
  retEventMap: Map<number, number>,
  withdrawalAtAge: (age: number) => number
): number {
  const haalbaar = (start: number) => simulateRetirementPath(
    start, yearsInRetirement, retirementAge, retirementYear,
    realPostAnnual, retEventMap, withdrawalAtAge
  ).minCapital >= 0

  if (haalbaar(0)) return 0

  let hi = 1000
  for (let i = 0; i < 60 && !haalbaar(hi); i++) hi *= 2
  // Blijft het onhaalbaar, dan is de invoer zo extreem (bijvoorbeeld een reëel
  // rendement van bijna −100%) dat geen bedrag volstaat. Teruggeven wat we hebben
  // is dan eerlijker dan doorzoeken met een grens die toch niet werkt.
  if (!haalbaar(hi)) return hi

  let lo = 0
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (haalbaar(mid)) hi = mid
    else lo = mid
  }
  return hi
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

  // Gewenst netto maandinkomen. Bij een bruto-invoer geldt het belastingregime op
  // de pensioendatum: wie ná de AOW-leeftijd stopt valt onder de lagere eerste
  // schijf, wie eerder stopt niet. Zie brutoMaandNaarNettoMaand() voor waarom dit
  // één conversie is en niet per jaar verschilt.
  const desiredMonthlyNetto = desiredRetirementIncomeType === 'bruto'
    ? brutoMaandNaarNettoMaand(
        desiredRetirementIncome,
        retirementAge >= aowStartAge,
        woonsituatie === 'alleenstaand'
      )
    : desiredRetirementIncome

  const aowMonthlyNetto = aowMaandBedragNetto

  // Required capital = PV of all future withdrawals at retirement.
  // Employer pension tax rate is age-dependent (36.97% pre-AOW, 19.07% post-AOW).
  // Discontering met exponent yr + 1: dezelfde eind-jaar-conventie als de
  // jaar-voor-jaar-simulatie verderop (eerst een vol jaar rendement, dan de
  // onttrekking). Anders ligt dit doelbedrag ~1% boven wat de simulatie werkelijk
  // nodig heeft en spreken het KPI-oordeel en de jaartabel elkaar tegen (E9).
  const rPostAnnual = 1 + realPost / 100
  const withdrawalAtAge = (age: number) => getMonthlyWithdrawal(
    age, desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
    employerPension, employerPensionStartAge, woonsituatie,
    lijfrenteUitkering, lijfrenteStartAge
  )

  // Contante waarde van alle onttrekkingen: wat je inkomen op zichzelf kost, nog
  // zonder de latere eenmalige bedragen. Blijft berekend omdat het scherm en de
  // export laten zien hoe het doelbedrag is opgebouwd.
  let pvWithdrawals = 0
  for (let yr = 0; yr < yearsInRetirement; yr++) {
    pvWithdrawals += withdrawalAtAge(retirementAge + yr) * 12 / Math.pow(rPostAnnual, yr + 1)
  }

  // Eenmalige bedragen ná de pensioendatum verlagen (of verhogen) wat je óp die
  // datum nodig hebt: een erfenis van € 400.000 een jaar na je pensioen betaalt
  // een deel van je uitkeringen gewoon mee. Zonder deze correctie vergeleek het
  // KPI-raster een vermogen zónder dat bedrag met een doelbedrag dat er evenmin
  // rekening mee hield, waardoor het bedrag aan beide kanten wegviel. Eén jaar
  // schuiven met een bedrag (van vlak vóór naar vlak ná de pensioendatum) sloeg
  // daardoor een overschot van € 122.039 om in een tekort van € 301.262, terwijl
  // het restkapitaal op de einddatum nauwelijks veranderde: de KPI toonde het
  // tekort óp de pensioendatum, niet het tekort om financieel onafhankelijk te
  // zijn (gemeld 30 augustus 2026).
  //
  // Contant maken met exponent yr en niet yr + 1: de simulatie hieronder schrijft
  // een eenmalig bedrag aan het BEGIN van het jaar bij, vóór het rendement,
  // terwijl een onttrekking aan het eind valt. Uit C_{yr+1} = (C_yr + E_yr) * r
  // − W_yr volgt voor een eindkapitaal van nul precies
  // C_0 = Σ W_yr / r^(yr+1) − Σ E_yr / r^yr.
  //
  // De optelsom wordt apart bijgehouden en meegegeven in het resultaat. Zonder dat
  // verdwijnt een bedrag van bijvoorbeeld € 400.000 stilzwijgend in één netto
  // doelbedrag: je ziet dan wel dat het doel lager ligt, maar niet waardoor.
  let pvEventsAfterRetirement = 0
  for (const [calYear, amount] of retEventMap) {
    const yr = calYear - retirementYear
    // Alleen de jaren die de uitkeringslus hieronder ook echt doorloopt. In het
    // jaar waarin de levensverwachting bereikt wordt breekt die lus af vóórdat
    // er nog een bedrag wordt bijgeschreven, dus dat jaar telt hier ook niet mee.
    if (yr >= 0 && yr < yearsInRetirement) {
      pvEventsAfterRetirement += amount / Math.pow(rPostAnnual, yr)
    }
  }
  // Het doelbedrag volgens de eindwaarde: alle onttrekkingen contant gemaakt, minus
  // wat er later binnenkomt. Dit is wat er tot september 2026 als requiredCapital
  // uit deze functie kwam, en het is nog steeds het bedrag dat de opbouw op het
  // scherm verklaart.
  const requiredCapitalEindwaarde = pvWithdrawals - pvEventsAfterRetirement

  // Het werkelijke doelbedrag: het kleinste startvermogen waarbij het saldo
  // onderweg nooit negatief wordt. Gelijk aan de eindwaarde zolang er geen
  // overbrugging nodig is, hoger zodra een ontvangst pas later binnenkomt.
  const requiredCapital = findRequiredCapital(
    yearsInRetirement, retirementAge, retirementYear, realPost, retEventMap, withdrawalAtAge
  )

  // Wat er bovenop de eindwaarde nodig is om de jaren tót die latere ontvangst te
  // overbruggen. Apart teruggegeven zodat het scherm dit als eigen regel kan tonen
  // in plaats van het stilzwijgend in het doelbedrag te verwerken: zonder die regel
  // ziet iemand wél een hoger doelbedrag, maar niet waardoor.
  const overbruggingsToeslag = Math.max(0, requiredCapital - requiredCapitalEindwaarde)

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
      desiredFromCapital: 0,
      incomeFromCapital: 0,
      shortfall: 0,
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
  let firstShortfallAge: number | null = null
  for (let yr = 0; yr <= yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const calYear = retirementYear + yr
    const isLaatsteRij = yr === yearsInRetirement

    const { aow, employerPension: emp, lijfrenteUitkering: lijf, fromCapital } = getIncomeBreakdown(
      age, desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
      employerPension, employerPensionStartAge, woonsituatie,
      lijfrenteUitkering, lijfrenteStartAge
    )

    // Het eenmalige bedrag van dit jaar komt aan het begin binnen en is dus
    // beschikbaar voor het inkomen van datzelfde jaar. Het werd hieronder pas
    // verwerkt nádat de inkomensregel was samengesteld, waardoor een ontvangst van
    // € 12.000 in januari bij een beginsaldo van € 0 een getoond inkomen uit
    // vermogen van € 0 opleverde (audit 7 september 2026, bevinding 5).
    const retEvent = retEventMap.get(calYear) ?? 0

    // De laatste rij is de eindstand op de planningshorizon, geen uitkeringsjaar:
    // daar vindt geen groei en geen onttrekking meer plaats. Ze toont dus wat er
    // overblijft plus de vaste bronnen die gewoon doorlopen, en géén onttrekking
    // uit vermogen. Anders meldt een plan dat op de einddatum precies op nul
    // uitkomt daar een tekort van een vol maandbedrag, terwijl het gewoon geslaagd
    // is. Tot september 2026 toonde die rij juist het omgekeerde: bij een
    // restvermogen stond er een onttrekking die het model nooit heeft uitgevoerd.
    const gewenstPerMaand = isLaatsteRij ? 0 : fromCapital

    // Wat er dit jaar werkelijk uit vermogen te halen valt, ná het eenmalige bedrag
    // en de groei van dat jaar. Begrenzen op dat bedrag: dit was een binaire poort
    // (capital > 0 ? fromCapital : 0), waardoor de tabel in het jaar waarin de pot
    // leegloopt nog de vólle onttrekking toonde. Bij € 1.000 vermogen en € 1.000
    // maandbehoefte stond er twaalf maanden lang € 1.000 aan inkomen uit vermogen,
    // terwijl er één maandbedrag van € 83,33 beschikbaar was.
    const beschikbaarJaar = Math.max(0, (capital + retEvent) * (1 + realPost / 100))
    const betaaldPerMaand = Math.min(gewenstPerMaand, beschikbaarJaar / 12)
    const tekortPerMaand = Math.max(0, gewenstPerMaand - betaaldPerMaand)

    if (tekortPerMaand > 0.005 && firstShortfallAge === null) firstShortfallAge = age

    yearData.push({
      age,
      year: calYear,
      capital: Math.max(0, capital),
      phase: 'uitkering',
      desiredFromCapital: gewenstPerMaand,
      incomeFromCapital: betaaldPerMaand,
      shortfall: tekortPerMaand,
      aowIncome: aow,
      employerIncome: emp,
      lijfrenteIncome: lijf,
      totalIncome: betaaldPerMaand + aow + emp + lijf,
    })

    if (isLaatsteRij) {
      surplusAtEnd = capital
      break
    }

    // De kapitaalmutatie gebruikt bewust de ónbeperkte fromCapital. Zou de
    // onttrekking hier op nul worden geklemd zodra de pot leeg is, dan zou
    // surplusAtEnd altijd nul zijn en zou het KPI-raster geen tekort meer kunnen
    // tonen. Het saldo loopt dus dóór in het negatieve; alleen de weergave is
    // begrensd (bevinding A1).
    capital = (capital + retEvent) * (1 + realPost / 100) - fromCapital * 12
  }

  const incomePhases = buildIncomePhases(
    retirementAge, lifeExpectancy,
    desiredMonthlyNetto, aowMonthlyNetto, aowStartAge,
    employerPension, employerPensionStartAge, woonsituatie,
    lijfrenteUitkering, lijfrenteStartAge,
    yearData
  )

  return {
    projectedCapital,
    requiredCapital,
    requiredCapitalEindwaarde,
    overbruggingsToeslag,
    pvEventsAfterRetirement,
    desiredMonthlyNetto,
    requiredMonthlyContribution,
    yearsToRetirement,
    yearsInRetirement,
    yearData,
    incomePhases,
    surplusAtEnd,
    firstShortfallAge,
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
  lijfrenteStartAge = 67,
  // Het saldoverloop uit dezelfde berekening. Zonder dit toonde de fasenlijst het
  // volledige gewenste bedrag uit eigen vermogen, ook voor jaren waarin de pot al
  // leeg was: het scherm sprak dan de grafiek ernaast tegen (audit 7 september
  // 2026, bevinding 5, "laat tabel, diagram, fasen en exports dezelfde uitkomst
  // gebruiken").
  yearData: YearData[] = []
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

    const toAge = sorted[i + 1]
    const eersteTekort = yearData.find(
      y => y.phase === 'uitkering' && y.age >= fromAge && y.age < toAge && y.shortfall > 0.005
    )

    phases.push({
      label: `Leeftijd ${sorted[i]}–${toAge}`,
      fromAge,
      toAge,
      incomeFromCapital: fromCapital,
      aow,
      employerPension: emp,
      lijfrenteUitkering: lijf,
      total: fromCapital + aow + emp + lijf,
      shortfallFromAge: eersteTekort ? eersteTekort.age : null,
    })
  }

  return phases
}
