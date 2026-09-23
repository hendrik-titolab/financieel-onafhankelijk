import type { PensionInputs, PensionResult, YearData, IncomePhase, PersoonInkomen, LifeEvent, Woonsituatie, PartnerGegevens, Indexatie } from '../types'
import { AOW_NETTO_MAAND, AOW_BRUTO_MAAND, AOW_VAKANTIEGELD_BRUTO_MAAND, ZVW } from '../config/fiscaleParameters'
import { belastingBox1 } from './brutoNetto'
import { nettoNominaalRendement, box3HeffingPerJaar } from './box3'

// AOW netto maandbedragen — uit centrale config (fiscaleParameters.ts)
export const AOW_NETTO = {
  alleenstaand: AOW_NETTO_MAAND.alleenstaand,
  samenwonend:  AOW_NETTO_MAAND.samenwonend,
}

/**
 * Toetst of de drie leeftijden een samenhangend verhaal vertellen.
 *
 * De schuifjes blijven bewust zelfstandig bedienbaar (zie het commentaar in
 * PensionPlanner/index.tsx): geen enkel veld corrigeert een ander. Dat betekent
 * wél dat er combinaties in te stellen zijn die niets betekenen, en tot september
 * 2026 rekende de tool die gewoon door. Huidige leeftijd 70, stoppen op 60,
 * eindleeftijd 65 liet de deterministische kern vanaf leeftijd 60 lopen terwijl
 * Monte Carlo nul jaren doorliep en 100% slagingskans meldde: twee kernen die
 * elkaar tegenspraken, allebei zonder waarschuwing (audit 7 september 2026,
 * bevinding 3).
 *
 * Errors blokkeren de uitkomst. Notes leggen alleen uit hoe een ongebruikelijke
 * maar zinnige combinatie wordt gelezen.
 */
export interface LeeftijdControle {
  errors: string[]
  notes: string[]
  /** De leeftijd waarop de uitkeringsfase feitelijk begint. */
  effectiveRetirementAge: number
}

export function controleerLeeftijden(
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number
): LeeftijdControle {
  const errors: string[] = []
  const notes: string[] = []

  // Al gepensioneerd: de uitkeringsfase begint vandaag, niet in het verleden.
  // Zonder deze regel begon de jaartabel op een leeftijd die al voorbij is.
  const effectiveRetirementAge = Math.max(currentAge, retirementAge)

  if (retirementAge < currentAge) {
    notes.push(
      `Je pensioenleeftijd (${retirementAge}) ligt vóór je huidige leeftijd (${currentAge}). ` +
      `We rekenen daarom vanaf vandaag: je bent al met pensioen.`
    )
  }

  if (lifeExpectancy <= effectiveRetirementAge) {
    errors.push(
      `Je plant tot leeftijd ${lifeExpectancy}, maar je uitkeringsfase begint pas op ` +
      `${effectiveRetirementAge}. Zet "plannen tot leeftijd" hoger dan ${effectiveRetirementAge}.`
    )
  }

  return { errors, notes, effectiveRetirementAge }
}

function realAnnualReturn(nominal: number, inflation: number): number {
  return ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100
}

// Netto maandinkomen op een gegeven leeftijd, uitgesplitst naar bron.
// Enige plek waar deze opsplitsing wordt gemaakt: de jaartabel, de fasenlijst en
// monteCarlo.ts leunen alle drie hierop (was tot augustus 2026 drie keer los
// uitgeschreven, bevinding A1).
export interface MaandInkomenVerdeling {
  /** Beide personen samen, netto per maand. */
  aow: number
  employerPension: number      // netto, fase-afhankelijk belast
  lijfrenteUitkering: number   // netto, fase-afhankelijk belast (E1-optie-B)
  fromCapital: number          // wat er nog uit eigen vermogen moet komen
  /**
   * De uitsplitsing van de partner, of null als er geen partner meerekent.
   * Alleen voor weergave; de bedragen hierboven zijn al het totaal.
   */
  partner: PersoonInkomen | null
}


/** De inkomensgegevens van één persoon op een gegeven leeftijd. */
export interface PersoonInvoer {
  age: number
  aowNetto: number
  aowStartAge: number
  employerPensionBruto: number
  employerPensionStartAge: number
  lijfrenteUitkeringBruto?: number
  lijfrenteStartAge?: number
  /** Oneindig betekent levenslang. */
  lijfrenteEindLeeftijd?: number
}

/**
 * Eén huishouden op een gegeven moment.
 *
 * De parameterlijst van getIncomeBreakdown() was gegroeid naar tien positionele
 * argumenten met defaults. Met een partner erbij zouden dat er zestien worden, en
 * dan is de volgorde niet meer te overzien. Vandaar dit object.
 */
export interface HuishoudInvoer {
  /** Het gewenste netto maandinkomen van het hele huishouden. */
  desiredNetto: number
  persoon: PersoonInvoer
  /**
   * De partner, of null wanneer er alleen voor één persoon wordt gerekend.
   *
   * De partner wordt APART belast en dat is de hele reden dat dit veld bestaat.
   * De inkomstenbelasting in box 1 is individueel: twee mensen hebben elk hun
   * eigen schijven en hun eigen heffingskortingen. Twee AOW-uitkeringen bij
   * elkaar optellen in één veld en dat als het inkomen van één persoon belasten
   * levert een fors te laag netto op. Doorgerekend met de parameters van 2026,
   * twee partners met elk € 1.084 AOW en € 1.500 werkgeverspensioen per maand:
   * apart belast € 4.673,81 netto per maand, samengeteld in één veld
   * € 3.718,73. Een verschil van € 955 per maand (audit 7 september 2026,
   * bevinding 16; gebouwd 8 september).
   */
  partner?: PersoonInvoer | null
  woonsituatie?: Woonsituatie
  aowVakantiegeld?: boolean
}

/**
 * Alles wat huishoudOp() nodig heeft, op één leeftijd na (die verschilt per
 * aanroep binnen de jaar-voor-jaar-lus). Was tot 14 september 2026 een losse,
 * bijna-identieke closure in zowel calculatePension() als runMonteCarlo(): het
 * commentaar in beide bestanden zei al "zodat ze niet uiteen kunnen lopen", maar
 * de code zelf was toch gekopieerd. Nu één gedeelde functie, hier en in
 * monteCarlo.ts geïmporteerd (bevinding review 14 september 2026).
 */
export interface HuishoudOpParams {
  woonsituatie: Woonsituatie
  aowVakantiegeld: boolean
  currentAge: number
  aowMonthlyNetto: number
  aowStartAge: number
  employerPension: number
  employerPensionStartAge: number
  lijfrenteUitkering: number
  lijfrenteStartAge: number
  lijfrenteEinde: number
  partnerActief: boolean
  partner?: PartnerGegevens
  /** Inflatie in procenten, voor het terugrekenen van vaste bedragen. */
  inflation: number
  employerPensionIndexatie: Indexatie
  lijfrenteIndexatie: Indexatie
}

/**
 * Wat een vast bedrag in euro's op een gegeven leeftijd waard is in koopkracht van
 * vandaag. Een meestijgend bedrag houdt zijn waarde. De jaren tellen vanaf nu, op
 * de kalender: dat geldt voor de partner net zo, want de inflatie loopt voor het
 * hele huishouden in dezelfde jaren.
 */
function koopkrachtFactor(indexatie: Indexatie | undefined, inflation: number, jarenVanafNu: number): number {
  if (indexatie !== 'vast') return 1
  return Math.pow(1 + inflation / 100, -Math.max(0, jarenVanafNu))
}

/**
 * Stelt het huishouden samen op een gegeven leeftijd van de hoofdpersoon. De
 * leeftijd van de partner loopt mee met de kalender, niet met die van de
 * hoofdpersoon: een partner die drie jaar jonger is, krijgt zijn AOW drie
 * kalenderjaren later. Vandaar het verschil ten opzichte van p.currentAge.
 *
 * Vaste bedragen (zie Indexatie) worden hier teruggerekend naar koopkracht van
 * vandaag, en daarna pas belast. Dat klopt in dit reële model: de schijven en
 * kortingen stijgen mee met de inflatie, dus een vast bruto bedrag belasten tegen
 * de schijven van nu, na terugrekenen, is hetzelfde als het nominale bedrag
 * belasten tegen de geïndexeerde schijven van dat jaar. Omdat beide rekenkernen via
 * deze functie lopen, kan de indexatie nergens anders uiteenlopen.
 */
export function huishoudOp(p: HuishoudOpParams, age: number, netto: number): HuishoudInvoer {
  const jarenVanafNu = age - p.currentAge
  const pensioenFactor = koopkrachtFactor(p.employerPensionIndexatie, p.inflation, jarenVanafNu)
  const lijfrenteFactor = koopkrachtFactor(p.lijfrenteIndexatie, p.inflation, jarenVanafNu)
  const partnerPensioenFactor = koopkrachtFactor(p.partner?.employerPensionIndexatie, p.inflation, jarenVanafNu)
  return {
    desiredNetto: netto,
    woonsituatie: p.woonsituatie,
    aowVakantiegeld: p.aowVakantiegeld,
    persoon: {
      age,
      aowNetto: p.aowMonthlyNetto,
      aowStartAge: p.aowStartAge,
      employerPensionBruto: p.employerPension * pensioenFactor,
      employerPensionStartAge: p.employerPensionStartAge,
      lijfrenteUitkeringBruto: p.lijfrenteUitkering * lijfrenteFactor,
      lijfrenteStartAge: p.lijfrenteStartAge,
      lijfrenteEindLeeftijd: p.lijfrenteEinde,
    },
    partner: p.partnerActief && p.partner
      ? {
          age: p.partner.leeftijd + (age - p.currentAge),
          aowNetto: p.partner.aowMaandBedragNetto,
          aowStartAge: p.partner.aowStartAge,
          employerPensionBruto: p.partner.employerPension * partnerPensioenFactor,
          employerPensionStartAge: p.partner.employerPensionStartAge,
          // Geen lijfrente voor de partner. Dat veld hoort bij persoon 1; zie
          // CLAUDE.md bij de openstaande punten.
        }
      : null,
  }
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

/**
 * Met hoeveel het AOW-jaarinkomen omhoog gaat als je het vakantiegeld meetelt.
 *
 * De SVB keert het vakantiegeld in mei apart uit; het maandbedrag dat mensen op
 * hun overzicht zien is exclusief. De rekenkern gebruikte twaalf van die
 * maandbedragen en liet het vakantiegeld dus vallen, waardoor het beschikbare
 * inkomen structureel te laag uitkwam (audit 7 september 2026, bevinding 12).
 * AOW_VAKANTIEGELD_BRUTO_MAAND stond al in de config maar werd nergens gebruikt.
 *
 * Als factor en niet als vast bedrag, zodat een gekorte AOW (wie niet zijn hele
 * leven in Nederland woonde) evenredig meeschaalt in plaats van er een volledig
 * vakantiegeld bovenop te krijgen.
 *
 * Over alleen een AOW-uitkering is de loonheffing nul, dus netto en bruto schalen
 * met dezelfde factor. Zodra er aanvullend pensioen bij komt belast
 * getIncomeBreakdown() het totaal, inclusief dit deel, tegen het juiste marginale
 * tarief.
 *
 * Alleenstaand: (1.662,64 + 106,55) / 1.662,64 = 1,064086.
 * Samenwonend:  (1.139,25 +  76,10) / 1.139,25 = 1,066799.
 */
export function aowVakantiegeldFactor(woonsituatie: Woonsituatie): number {
  const bruto = AOW_BRUTO_MAAND[woonsituatie]
  const vakantiegeld = AOW_VAKANTIEGELD_BRUTO_MAAND[woonsituatie]
  if (!(bruto > 0)) return 1
  return (bruto + vakantiegeld) / bruto
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

/**
 * Wat één persoon netto per maand overhoudt aan AOW, werkgeverspensioen en
 * lijfrente, op een gegeven leeftijd.
 *
 * Belasten over het TOTALE box 1-inkomen van deze persoon, niet per bron.
 * Heffingskortingen zijn inkomensafhankelijk, dus per bron rekenen geeft een te
 * hoge korting en daarmee een te rooskleurig netto (bevinding E4).
 *
 * De AOW blijft staan op het bedrag dat de gebruiker invulde. Elke volgende bron
 * krijgt wat er bovenop de vorige netto overblijft. Dat is precies de marginale
 * behandeling die klopt: elke bron duwt de algemene heffingskorting en de
 * ouderenkorting verder in de afbouw. De volgorde AOW -> werkgeverspensioen ->
 * lijfrente is willekeurig gekozen (er is geen fiscaal correcte manier om een
 * gedeelde korting-afbouw over twee gelijktijdige bronnen te verdelen), niet
 * fiscaal betekenisvol.
 *
 * Deze functie rekent bewust voor ÉÉN persoon. Een partner gaat er apart doorheen,
 * want box 1 is individueel. Zie HuishoudInvoer.partner.
 */
export function persoonNettoInkomen(
  p: PersoonInvoer,
  woonsituatie: Woonsituatie = 'alleenstaand',
  aowVakantiegeld = false
): PersoonInkomen {
  const {
    age, aowNetto, aowStartAge, employerPensionBruto, employerPensionStartAge,
    lijfrenteUitkeringBruto = 0, lijfrenteStartAge = 67, lijfrenteEindLeeftijd = Infinity,
  } = p

  const pastAow = age >= aowStartAge
  const alleenstaand = woonsituatie === 'alleenstaand'

  // Het vakantiegeld verhoogt zowel het bruto- als het nettobedrag met dezelfde
  // factor, zie aowVakantiegeldFactor() hierboven. Uitgedrukt per maand, want de
  // rest van deze functie rekent in maandbedragen: het bedrag komt in mei binnen,
  // maar over een jaar gemeten telt het gewoon mee.
  const vg = pastAow && aowVakantiegeld ? aowVakantiegeldFactor(woonsituatie) : 1
  const aowNettoMetVg = aowNetto * vg

  const aow = pastAow ? aowNettoMetVg : 0
  const heeftPensioen = age >= employerPensionStartAge
  // Een tijdelijke uitkering stopt. Tot september 2026 liep iedere lijfrente door
  // tot de planningshorizon, ook een uitkering van vijf jaar (bevinding 9).
  const heeftLijfrente = age >= lijfrenteStartAge && age < lijfrenteEindLeeftijd

  const aowBrutoJaar = pastAow ? aowNettoNaarBruto(aowNettoMetVg) * 12 : 0
  const pensioenBrutoJaar = heeftPensioen ? employerPensionBruto * 12 : 0
  const lijfrenteBrutoJaar = heeftLijfrente ? lijfrenteUitkeringBruto * 12 : 0

  const nettoAowJaar = pastAow ? aowNettoMetVg * 12 : 0
  const nettoAowPensioenJaar = nettoJaarinkomen(aowBrutoJaar + pensioenBrutoJaar, pastAow, alleenstaand)
  const nettoAowPensioenLijfrenteJaar = nettoJaarinkomen(
    aowBrutoJaar + pensioenBrutoJaar + lijfrenteBrutoJaar, pastAow, alleenstaand
  )

  const employerPension = Math.max(0, (nettoAowPensioenJaar - nettoAowJaar) / 12)
  const lijfrenteUitkering = Math.max(0, (nettoAowPensioenLijfrenteJaar - nettoAowPensioenJaar) / 12)

  return { aow, employerPension, lijfrenteUitkering, totaal: aow + employerPension + lijfrenteUitkering }
}

/**
 * Het netto maandinkomen van het hele huishouden, en wat er daarna nog uit eigen
 * vermogen moet komen.
 *
 * Beide personen gaan apart door de belastingmotor en pas daarna worden hun
 * netto's opgeteld. Dat is niet alleen netter maar ook het enige wat klopt: de
 * inkomstenbelasting in box 1 is individueel.
 */
export function getIncomeBreakdown(o: HuishoudInvoer): MaandInkomenVerdeling {
  const { desiredNetto, persoon, partner = null, woonsituatie = 'alleenstaand', aowVakantiegeld = false } = o

  const eigen = persoonNettoInkomen(persoon, woonsituatie, aowVakantiegeld)
  const vanPartner = partner ? persoonNettoInkomen(partner, woonsituatie, aowVakantiegeld) : null

  const aow = eigen.aow + (vanPartner?.aow ?? 0)
  const employerPension = eigen.employerPension + (vanPartner?.employerPension ?? 0)
  const lijfrenteUitkering = eigen.lijfrenteUitkering + (vanPartner?.lijfrenteUitkering ?? 0)

  return {
    aow,
    employerPension,
    lijfrenteUitkering,
    fromCapital: Math.max(0, desiredNetto - aow - employerPension - lijfrenteUitkering),
    partner: vanPartner,
  }
}

/** Wat er dit jaar uit eigen vermogen moet komen. Zie getIncomeBreakdown(). */
export function getMonthlyWithdrawal(o: HuishoudInvoer): number {
  return getIncomeBreakdown(o).fromCapital
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
  startCalendarYear: number,
  heffing: (vermogenBeginJaar: number) => number = () => 0
): { endCapital: number; minCapital: number } {
  let capital = startCapital
  // Het laagste saldo aan het eind van een jaar. Zelfde meetmoment als de
  // liquiditeitstoets in monteCarlo.ts (na de jaarmutatie), zodat een uitgave
  // die in hetzelfde jaar door inleg wordt goedgemaakt in geen van beide kernen
  // als tekort telt. Het startvermogen zelf telt niet mee: dat is invoer.
  let minCapital = Infinity
  const annualFactor = 1 + realReturnAnnual / 100

  for (let yr = 0; yr < yearsToRetirement; yr++) {
    const calYear = startCalendarYear + yr
    const event = eventMap.get(calYear) ?? 0
    // Box 3 kent één peildatum: 1 januari. De heffing gaat dus over het saldo aan
    // het begin van het jaar, inclusief een eenmalig bedrag dat volgens de
    // conventie hierboven ook aan het begin van het jaar binnenkomt. Afgetrokken
    // ná de groei, want de aanslag komt pas in het jaar erna.
    const beginSaldo = capital + event
    capital = beginSaldo * annualFactor + monthlyPMT * 12 * Math.sqrt(annualFactor)
      - heffing(beginSaldo)
    if (capital < minCapital) minCapital = capital
  }
  return { endCapital: capital, minCapital }
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
  withdrawalAtAge: (age: number) => number,
  heffing: (vermogenBeginJaar: number) => number = () => 0
): { minCapital: number; endCapital: number } {
  let capital = startCapital
  let minCapital = startCapital
  const factor = 1 + realPostAnnual / 100
  // Mid-year-conventie voor de onttrekking, zie de uitkeringslus in
  // calculatePension(). Moet hier hetzelfde zijn, anders zoekt findRequiredCapital()
  // naar een doelbedrag dat de jaartabel ernaast niet waarmaakt.
  const onttrekkingsFactor = Math.sqrt(factor)

  for (let yr = 0; yr < yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const event = retEventMap.get(retirementYear + yr) ?? 0
    const beginSaldo = capital + event
    capital = beginSaldo * factor - withdrawalAtAge(age) * 12 * onttrekkingsFactor
      - heffing(beginSaldo)
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
 * Het saldo is een strikt stijgende functie van het startvermogen, dus bisectie
 * vindt hier één eenduidig antwoord. Zonder box 3-heffing is de recursie lineair:
 * iedere euro extra groeit mee met r^t. Mét heffing is ze stuksgewijs lineair,
 * maar nog steeds strikt stijgend: boven de vrijstelling levert een euro extra
 * (1 + r) − 2,16% op, en dat is positief bij elk realistisch rendement. De
 * bisectie blijft dus geldig. De bovengrens wordt eerst verdubbelend gezocht: een vaste
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
  withdrawalAtAge: (age: number) => number,
  heffing: (vermogenBeginJaar: number) => number = () => 0
): number {
  const haalbaar = (start: number) => simulateRetirementPath(
    start, yearsInRetirement, retirementAge, retirementYear,
    realPostAnnual, retEventMap, withdrawalAtAge, heffing
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

/**
 * De kleinste maandinleg waarmee het doelbedrag op de pensioendatum gehaald wordt
 * én het saldo onderweg nooit onder nul komt.
 *
 * Die tweede eis ontbrak tot 22 september 2026. Een uitgave van € 50.000 volgend
 * jaar bij € 0 vermogen, gevolgd door € 60.000 erven drie jaar later, gaf een
 * benodigde inleg van min € 19 en een overschot, terwijl de simulatie 0% slaagde
 * (review 22 september 2026, bevinding 1). Beide eisen zijn stijgend in de inleg,
 * dus de bisectie blijft één eenduidig antwoord vinden.
 */
function findRequiredPMT(
  targetCapital: number,
  startCapital: number,
  yearsToRetirement: number,
  realReturnAnnual: number,
  eventMap: Map<number, number>,
  startCalendarYear: number,
  heffing: (vermogenBeginJaar: number) => number = () => 0
): number {
  if (yearsToRetirement <= 0) return 0
  let lo = -50000, hi = 200000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const { endCapital, minCapital } = simulateAccumulation(
      startCapital, mid, yearsToRetirement, realReturnAnnual, eventMap, startCalendarYear, heffing)
    if (endCapital < targetCapital || minCapital < 0) lo = mid
    else hi = mid
  }
  return hi
}

/**
 * De FO-planner rekent bewust op één belastingjaar: PARAMETER_JAAR, via de
 * standaardwaarden van belastingBox1() en box3HeffingPerJaar().
 *
 * Dat is geen vergeten stap in WP9 maar een keuze. De planner projecteert
 * tientallen jaren vooruit en voor die jaren bestaan geen gepubliceerde tarieven;
 * voor zo'n projectie wil je altijd de meest actuele cijfers, niet een ouder jaar.
 *
 * Een belastingjaar-parameter zou hier bovendien misleidend zijn zolang ZVW en
 * AOW_*_MAAND niet per jaar in de bron staan: hij zou alleen de box 1-helft sturen
 * en de Zvw- en AOW-helft stil op het huidige jaar laten. Precies de halve
 * migratie die box3.ts tot september 2026 had. Zie PLAN-wp9-belastingmotor-per-jaar.md,
 * "Waarom fase 4 en 5 beter kunnen blijven liggen".
 *
 * currentYear hieronder is het KALENDERjaar voor de tijdlijn van de simulatie
 * (wanneer is "nu"), niet het belastingjaar voor de tarieven. Die twee niet door
 * elkaar halen.
 */
export function calculatePension(inputs: PensionInputs, opts?: { currentYear?: number }): PensionResult {
  const {
    currentAge, retirementAge: retirementAgeInput, lifeExpectancy,
    currentCapital, monthlyContribution, contributionFrequency,
    returnBeforeRetirement, returnAfterRetirement, inflation,
    kostenPct = 0, vermogensbelastingPct = 0, vermogensbelastingHandmatig = true,
    desiredRetirementIncome, desiredRetirementIncomeType,
    aowMaandBedragNetto, aowStartAge, woonsituatie = 'alleenstaand',
    employerPension, employerPensionStartAge,
    lijfrenteUitkering, lijfrenteStartAge,
    lijfrenteSoort = 'levenslang', lijfrenteEindLeeftijd = Infinity,
    employerPensionIndexatie = 'meestijgend', lijfrenteIndexatie = 'meestijgend',
    aowVakantiegeld = false,
    partner,
    lifeEvents = [],
  } = inputs

  // Alleen een tijdelijke uitkering heeft een einddatum. Bij levenslang blijft de
  // uitkering doorlopen tot de planningshorizon.
  const lijfrenteEinde = lijfrenteSoort === 'tijdelijk' ? lijfrenteEindLeeftijd : Infinity

  // Twee routes voor box 3, en precies één ervan is actief.
  //
  // vermogensbelastingHandmatig = true: de gebruiker vult zelf een percentage in,
  // dat gaat er als procentpunten van het rendement af. Dat was tot september 2026
  // de enige route (audit-bevinding 10).
  //
  // vermogensbelastingHandmatig = false: de heffing wordt per jaar uitgerekend over
  // het dán actuele vermogen en gaat in euro's van het saldo af. Dat is wat de
  // audit vroeg: een vast percentage over de hele looptijd kan niet kloppen, want
  // door het heffingsvrije vermogen loopt de druk op met de omvang van het
  // vermogen. Bij € 100.000 is het ongeveer 0,9 procentpunt, bij € 1.000.000 ruim
  // 2,0, en een plan dat van de eerste naar de tweede groeit zit er met één
  // percentage per definitie naast.
  //
  // Twee aannames, allebei bewust:
  //
  // 1. Het hele vermogen telt als beleggingen (forfait 6,00%), niet als spaargeld.
  //    De planner kent geen vermogensmix. Wie vooral spaart betaalt minder dan hier
  //    staat. Zie box3HeffingPerJaar().
  // 2. Het heffingsvrije vermogen wordt jaarlijks geïndexeerd en is in reële euro's
  //    dus constant. Deze rekenkern werkt in euro's van vandaag; zonder die aanname
  //    zou de vrijstelling gedurende de looptijd langzaam verdampen. De heffing
  //    zelf is inflatieneutraal: 6% × 36% is 2,16% van het vermogen, en dat
  //    percentage is in reële en nominale euro's hetzelfde.
  const belastingViaPercentage = vermogensbelastingHandmatig ? vermogensbelastingPct : 0
  const heffing = vermogensbelastingHandmatig
    ? () => 0
    : (vermogenBeginJaar: number) => box3HeffingPerJaar(vermogenBeginJaar, woonsituatie)

  const brutoPre = nettoNominaalRendement(returnBeforeRetirement, kostenPct, belastingViaPercentage)
  const brutoPost = nettoNominaalRendement(returnAfterRetirement, kostenPct, belastingViaPercentage)
  const realPre = realAnnualReturn(brutoPre, inflation)
  const realPost = realAnnualReturn(brutoPost, inflation)

  // Eén gedeelde lezing van de leeftijden, zodat deze kern en monteCarlo.ts niet
  // uiteen kunnen lopen bij een combinatie die zichzelf tegenspreekt. Wie zijn
  // pensioenleeftijd onder zijn huidige leeftijd zet is al met pensioen: de
  // uitkeringsfase begint dan vandaag en niet in het verleden.
  const retirementAge = controleerLeeftijden(
    currentAge, retirementAgeInput, lifeExpectancy
  ).effectiveRetirementAge

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
    currentCapital, monthlyPMT, yearsToRetirement, realPre, accEventMap, currentYear, heffing
  ).endCapital

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

  // Eén plek die het huishouden op een gegeven leeftijd samenstelt. De jaartabel,
  // de fasenlijst en de contante waarde gebruiken alle drie deze functie, zodat ze
  // niet uiteen kunnen lopen. Zelfde gedeelde huishoudOp() als monteCarlo.ts.
  const partnerActief = Boolean(partner?.actief)
  const huishoudOpParams: HuishoudOpParams = {
    woonsituatie, aowVakantiegeld, currentAge,
    aowMonthlyNetto, aowStartAge,
    employerPension, employerPensionStartAge,
    lijfrenteUitkering, lijfrenteStartAge, lijfrenteEinde,
    partnerActief, partner,
    inflation, employerPensionIndexatie, lijfrenteIndexatie,
  }

  const withdrawalAtAge = (age: number) =>
    getMonthlyWithdrawal(huishoudOp(huishoudOpParams, age, desiredMonthlyNetto))

  // Contante waarde van alle onttrekkingen: wat je inkomen op zichzelf kost, nog
  // zonder de latere eenmalige bedragen. Blijft berekend omdat het scherm en de
  // export laten zien hoe het doelbedrag is opgebouwd.
  const onttrekkingsFactor = Math.sqrt(rPostAnnual)
  let pvWithdrawals = 0
  for (let yr = 0; yr < yearsInRetirement; yr++) {
    pvWithdrawals += withdrawalAtAge(retirementAge + yr) * 12 * onttrekkingsFactor
      / Math.pow(rPostAnnual, yr + 1)
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
  //
  // Let op: deze contante waarde kent de box 3-heffing niet en toetst niet of het
  // saldo onderweg onder nul komt. Het echte doelbedrag (requiredCapital) komt uit
  // findRequiredCapital(); de verschillen staan als eigen regels in de opbouw
  // hieronder (overbruggingsToeslag, laterGeldOverschot, box3Toeslag).
  const requiredCapitalEindwaarde = pvWithdrawals - pvEventsAfterRetirement

  // Het werkelijke doelbedrag: het kleinste startvermogen waarbij het saldo
  // onderweg nooit negatief wordt. Gelijk aan de eindwaarde zolang er geen
  // overbrugging nodig is, hoger zodra een ontvangst pas later binnenkomt.
  const requiredCapital = findRequiredCapital(
    yearsInRetirement, retirementAge, retirementYear, realPost, retEventMap, withdrawalAtAge,
    heffing
  )

  // De opbouw van het doelbedrag, in vier delen die altijd optellen:
  //
  //   requiredCapitalEindwaarde + overbruggingsToeslag + laterGeldOverschot
  //     + box3Toeslag = requiredCapital
  //
  // Daarvoor is één extra zoekronde nodig: hetzelfde doelbedrag zonder box 3
  // (zonderHeffing). Het verschil met de eindwaarde is dan zuiver liquiditeit, het
  // verschil met requiredCapital zuiver box 3.
  //
  // Tot 22 september 2026 hing overbrugging aan de vraag of er een periode vóór de
  // eerste uitkering was. Dat gaf twee fouten. Wie ná de AOW-datum stopte en later
  // zou erven, kreeg een doelbedrag waarvan € 120.637 in de opbouw nergens stond.
  // En het box 3-deel stond in geen enkele regel (review 22 september 2026,
  // bevinding 3). De eerdere reparatie van 14 september, die het box 3-verschil
  // terecht niet meer "overbrugging" noemde, blijft hiermee overeind: box 3 heeft
  // nu een eigen regel.
  const zonderHeffing = !vermogensbelastingHandmatig
    ? findRequiredCapital(
        yearsInRetirement, retirementAge, retirementYear, realPost, retEventMap, withdrawalAtAge
      )
    : requiredCapital
  // De bisectie convergeert tot op een fractie van een cent; een verschil daaronder
  // is rekenruis en geen overbrugging.
  const liquiditeitsVerschil = zonderHeffing - requiredCapitalEindwaarde
  const overbruggingsToeslag = zonderHeffing > 0 && Math.abs(liquiditeitsVerschil) >= 0.01
    ? liquiditeitsVerschil
    : 0
  const laterGeldOverschot = zonderHeffing > 0 ? 0 : Math.max(0, -requiredCapitalEindwaarde)
  const box3Toeslag = requiredCapital - zonderHeffing

  // Hoeveel jaar er ligt tussen de pensioendatum en de eerste uitkering. Alleen voor
  // de waarschuwing op het invoerscherm; het doelbedrag rekent de jaren zelf door.
  //
  // Een bron telt alleen mee als er ook een bedrag bij staat. Werkgeverspensioen
  // € 0 met een ingangsleeftijd van 60 liet de waarschuwing tot 22 september 2026
  // verdwijnen bij wie op 60 stopte en pas op 67 AOW kreeg (review, bevinding 11).
  //
  // Dit is de ENIGE plek die deze vergelijking maakt. InputPanel.tsx leest
  // overbruggingsJaren uit het resultaat, zodat er niet twee plekken zijn die uiteen
  // kunnen lopen.
  const ingangsleeftijden: number[] = []
  if (aowMaandBedragNetto > 0) ingangsleeftijden.push(aowStartAge)
  if (employerPension > 0) ingangsleeftijden.push(employerPensionStartAge)
  if (lijfrenteUitkering > 0) ingangsleeftijden.push(lijfrenteStartAge)
  if (partnerActief && partner) {
    const leeftijdsverschilPartner = partner.leeftijd - currentAge
    if (partner.aowMaandBedragNetto > 0) ingangsleeftijden.push(partner.aowStartAge - leeftijdsverschilPartner)
    if (partner.employerPension > 0) ingangsleeftijden.push(partner.employerPensionStartAge - leeftijdsverschilPartner)
  }
  // Zonder enige uitkering loopt de overbrugging tot de planningshorizon.
  const eersteEigenInkomen = Math.min(lifeExpectancy, ...ingangsleeftijden)
  const overbruggingsJaren = Math.max(0, eersteEigenInkomen - retirementAge)

  // Required monthly contribution (binary search, accounts for life events)
  const requiredMonthlyContribution = findRequiredPMT(
    requiredCapital, currentCapital, yearsToRetirement, realPre, accEventMap, currentYear, heffing
  )

  // --- Year-by-year simulation for chart & table ---
  const yearData: YearData[] = []
  let capital = currentCapital
  // Eerste leeftijd waarop het saldo in de opbouwfase onder nul komt, en het
  // diepste punt. Zelfde meetmoment als simulateAccumulation(): na de jaarmutatie.
  let opbouwTekort: { leeftijd: number; bedrag: number } | null = null

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
    // De box 3-heffing gaat over het saldo aan het begin van het jaar, net als
    // daar, anders loopt de tabel uit de pas met de KPI erboven.
    const beginSaldo = capital + event
    capital = beginSaldo * (1 + realPre / 100) + monthlyPMT * 12 * Math.sqrt(1 + realPre / 100)
      - heffing(beginSaldo)
    if (capital < 0) {
      opbouwTekort = opbouwTekort === null
        ? { leeftijd: age, bedrag: -capital }
        : { leeftijd: opbouwTekort.leeftijd, bedrag: Math.max(opbouwTekort.bedrag, -capital) }
    }
  }

  // Retirement phase
  let surplusAtEnd = 0
  let firstShortfallAge: number | null = null
  for (let yr = 0; yr <= yearsInRetirement; yr++) {
    const age = retirementAge + yr
    const calYear = retirementYear + yr
    const isLaatsteRij = yr === yearsInRetirement

    const { aow, employerPension: emp, lijfrenteUitkering: lijf, fromCapital } =
      getIncomeBreakdown(huishoudOp(huishoudOpParams, age, desiredMonthlyNetto))

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
    const betaaldPerMaand = Math.min(
      gewenstPerMaand,
      beschikbaarJaar / (12 * Math.sqrt(1 + realPost / 100))
    )
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
    // Mid-year-conventie voor de onttrekking, spiegelbeeld van de jaarinleg in
    // simulateAccumulation(). Een bedrag dat in twaalf maandtermijnen wordt
    // opgenomen kost aan het einde van het jaar meer dan hetzelfde bedrag ineens
    // op 31 december, want elke termijn mist het resterende rendement van dat
    // jaar. De inleg kreeg die correctie al wel, de onttrekking niet.
    //
    // Nagerekend op 7 september 2026 met € 1.000 per maand, dertig jaar, 4% reëel:
    // jaarultimo € 207.504, twaalf maandtermijnen € 211.282, met deze wortelfactor
    // € 211.614. De benadering neemt 91,2% van het verschil weg en houdt 0,16%
    // over. Een volledige maandmotor haalt die laatste 0,16% op en kost een
    // herbouw van beide rekenkernen; dat is bewust niet gedaan (audit 7 september
    // 2026, bevinding 14).
    const beginSaldoUitkering = capital + retEvent
    capital = beginSaldoUitkering * (1 + realPost / 100)
      - fromCapital * 12 * Math.sqrt(1 + realPost / 100)
      - heffing(beginSaldoUitkering)
  }

  // Knikpunten in het inkomen: elke ingangsdatum en elk einde van een uitkering
  // begint een nieuwe fase. Met een partner komen daar zijn ingangsdata bij.
  const knikpunten = [
    aowStartAge,
    employerPensionStartAge,
    lijfrenteStartAge,
    lijfrenteEinde,
    ...(partnerActief && partner
      ? [
          partner.aowStartAge - (partner.leeftijd - currentAge),
          partner.employerPensionStartAge - (partner.leeftijd - currentAge),
        ]
      : []),
  ]

  const incomePhases = buildIncomePhases(
    retirementAge, lifeExpectancy, knikpunten,
    (age: number) => huishoudOp(huishoudOpParams, age, desiredMonthlyNetto),
    yearData
  )

  return {
    projectedCapital,
    requiredCapital,
    requiredCapitalEindwaarde,
    effectiveRetirementAge: retirementAge,
    overbruggingsToeslag,
    laterGeldOverschot,
    box3Toeslag,
    opbouwTekort,
    overbruggingsJaren,
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

/**
 * De uitkeringsfase opgeknipt in stukken met een gelijk inkomensbeeld.
 *
 * Nam eerder tien losse parameters om het inkomen zelf te kunnen uitrekenen. Nu
 * krijgt hij `huishoudOp`, dezelfde functie die de jaartabel gebruikt, zodat de
 * fasenlijst per definitie niet kan afwijken van de rest van de berekening.
 */
function buildIncomePhases(
  retirementAge: number,
  lifeExpectancy: number,
  /** Leeftijden waarop het inkomen verandert. Buiten de looptijd of oneindig wordt genegeerd. */
  knikpunten: number[],
  huishoudOp: (age: number) => HuishoudInvoer,
  // Het saldoverloop uit dezelfde berekening. Zonder dit toonde de fasenlijst het
  // volledige gewenste bedrag uit eigen vermogen, ook voor jaren waarin de pot al
  // leeg was: het scherm sprak dan de grafiek ernaast tegen (audit 7 september
  // 2026, bevinding 5, "laat tabel, diagram, fasen en exports dezelfde uitkomst
  // gebruiken").
  yearData: YearData[] = []
): IncomePhase[] {
  const breakpoints = new Set([retirementAge, lifeExpectancy])
  for (const k of knikpunten) {
    if (Number.isFinite(k) && k > retirementAge && k < lifeExpectancy) breakpoints.add(k)
  }

  const sorted = [...breakpoints].sort((a, b) => a - b)
  const phases: IncomePhase[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const fromAge = sorted[i]
    const { aow, employerPension: emp, lijfrenteUitkering: lijf, fromCapital, partner } =
      getIncomeBreakdown(huishoudOp(fromAge))

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
      // getIncomeBreakdown() berekent dit al per persoon apart (box 1 is
      // individueel). Tot 15 september 2026 werd het hier weggegooid, waardoor
      // het scherm en de exports bij een meerekenende partner één opgeteld
      // AOW-bedrag toonden zonder te laten zien van wie het kwam.
      partner,
      shortfallFromAge: eersteTekort ? eersteTekort.age : null,
    })
  }

  return phases
}
