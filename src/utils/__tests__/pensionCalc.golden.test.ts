// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
//
// Kanttekening bij scenario 2 en 6: requiredMonthlyContribution kan negatief zijn
// (zie AUDIT-fase0-1-feiten.md, bevinding E10) — dat is hier bewust vastgelegd
// zoals het nu is, niet gecorrigeerd.
import { describe, it, expect } from 'vitest'
import { calculatePension, getIncomeBreakdown } from '../pensionCalc'
import type { YearData } from '../../types'
import { SCENARIOS, baseInputs, round } from './fixtures'
import fixture from './__golden__/pensionCalc.golden.json'

function roundYearRow(yd: YearData) {
  return {
    age: yd.age,
    year: yd.year,
    phase: yd.phase,
    capital: round(yd.capital),
    incomeFromCapital: round(yd.incomeFromCapital),
    aowIncome: round(yd.aowIncome),
    employerIncome: round(yd.employerIncome),
    totalIncome: round(yd.totalIncome),
  }
}

// ── E4: belasting over het totale box 1-inkomen ───────────────────────────────
//
// De AOW wordt netto ingevuld en het werkgeverspensioen bruto. Heffingskortingen
// zijn inkomensafhankelijk over het totaal, dus per bron rekenen geeft een te
// hoge korting. Deze tests leggen vast dat het stapelt zoals het hoort.
describe('getIncomeBreakdown — AOW en pensioen stapelen', () => {
  const AOW_NETTO_MND = 1558      // alleenstaand, uit de fiscale bron
  const NA_AOW = 70               // leeftijd waarop zowel AOW als pensioen loopt

  const breakdown = (pensioenBrutoMnd: number, aowNetto = AOW_NETTO_MND,
                     woonsituatie: 'alleenstaand' | 'samenwonend' = 'alleenstaand') =>
    getIncomeBreakdown(NA_AOW, 5000, aowNetto, 67, pensioenBrutoMnd, 65, woonsituatie)

  // Zelfcontrole op de hele keten. De AOW wordt gebruteerd, belast en weer netto
  // gemaakt; er hoort precies weer uit te komen wat erin ging. Lukt dat niet, dan
  // klopt de brutering, het tarief, een korting of de Zvw-bijdrage niet.
  it('geeft zonder pensioen exact de ingevulde AOW terug', () => {
    const r = breakdown(0)
    expect(r.aow).toBe(AOW_NETTO_MND)
    expect(Math.abs(r.employerPension)).toBeLessThan(1)
  })

  // Dit is de kern van E4. Het pensioen komt bovenop de AOW, valt daardoor in een
  // hogere schijf en duwt zowel de algemene heffingskorting als de ouderenkorting
  // in de afbouw. Netto blijft er dus minder over dan het schijftarief suggereert.
  it('belast het pensioen marginaal, niet alsof het losstaat', () => {
    const naief = 2500 * (1 - 0.1785)          // wat de oude code deed: € 2.054
    const r = breakdown(2500)
    expect(r.employerPension).toBeLessThan(naief)
    // Alleenstaand met volledige AOW: € 1.712 in plaats van € 2.054. Samenwonend
    // komt € 45 lager uit, want dan vervalt de alleenstaandeouderenkorting.
    expect(Math.round(r.employerPension)).toBe(1712)
  })

  it('hoe hoger het pensioen, hoe groter het verschil met het schijftarief', () => {
    const verschil = (p: number) => p * (1 - 0.1785) - breakdown(p).employerPension
    expect(verschil(4000)).toBeGreaterThan(verschil(2500))
    expect(verschil(2500)).toBeGreaterThan(verschil(1000))
  })

  // Wie later naar Nederland is geïmmigreerd krijgt een gekorte AOW. De brutering
  // gebruikt daarom de verhouding en niet een vast verschil, zodat een lagere AOW
  // gewoon meeschaalt.
  it('werkt ook bij een gekorte AOW', () => {
    const vol = breakdown(0, 1558)
    const deels = breakdown(0, 1091)   // 70% AOW
    expect(Math.abs(vol.employerPension)).toBeLessThan(1)
    expect(Math.abs(deels.employerPension)).toBeLessThan(1)
    expect(deels.aow).toBe(1091)
  })

  it('past de alleenstaandeouderenkorting alleen toe bij alleenstaand', () => {
    const alleen = breakdown(2500, AOW_NETTO_MND, 'alleenstaand')
    const samen  = breakdown(2500, AOW_NETTO_MND, 'samenwonend')
    // €540 per jaar is €45 per maand.
    expect(Math.round(alleen.employerPension - samen.employerPension)).toBe(45)
  })

  it('rekent vóór de AOW-leeftijd met de tarieven van vóór de AOW-leeftijd', () => {
    // Leeftijd 65: pensioen loopt al, AOW nog niet.
    const voor = getIncomeBreakdown(65, 5000, AOW_NETTO_MND, 67, 2500, 65)
    const na   = getIncomeBreakdown(70, 5000, AOW_NETTO_MND, 67, 2500, 65)
    expect(voor.aow).toBe(0)
    // Zonder AOW-premievrijstelling is het tarief hoger, dus houdt hij minder over
    // dan hetzelfde pensioen ná de AOW-leeftijd zou opleveren als het alleen stond.
    expect(voor.employerPension).toBeLessThan(2500)
    expect(na.aow).toBe(AOW_NETTO_MND)
  })
})

// ── E1-optie-B: lijfrente-/bankspaaruitkering stapelt als derde bron ──────────
//
// Zelfde mechanisme als hierboven (E4), nu met AOW + werkgeverspensioen +
// lijfrente-/bankspaaruitkering tegelijk. Verwachte waarden hieronder zijn met de
// hand met de 2026-tarieven nagerekend (schijf1 17,85%, AHK-afbouw 3,195% vanaf
// €29.736, ouderenkorting €2.067 vlak tot €46.002, aok €540, Zvw 4,85%) vóórdat
// deze test is toegevoegd — niet achteraf aangepast aan wat de code toevallig
// teruggaf.
describe('getIncomeBreakdown — lijfrente stapelt bovenop AOW en werkgeverspensioen', () => {
  const AOW_NETTO_MND = 1582  // alleenstaand, per 1 juli 2026
  const NA_AOW = 70

  it('drie bronnen tegelijk, alleenstaand: hand-nagerekend', () => {
    const r = getIncomeBreakdown(
      NA_AOW, 5000, AOW_NETTO_MND, 67, 800, 65, 'alleenstaand', 500, 65
    )
    expect(r.aow).toBe(AOW_NETTO_MND)
    expect(Math.round(r.employerPension)).toBe(669)
    expect(Math.round(r.lijfrenteUitkering)).toBe(371)
    expect(round(r.fromCapital)).toBe(round(5000 - AOW_NETTO_MND - r.employerPension - r.lijfrenteUitkering))
  })

  it('nul zolang de lijfrente-ingangsleeftijd nog niet bereikt is', () => {
    const nogNiet = getIncomeBreakdown(60, 5000, AOW_NETTO_MND, 67, 800, 65, 'alleenstaand', 500, 65)
    expect(nogNiet.lijfrenteUitkering).toBe(0)
  })

  it('bestaande aanroepen zonder de twee nieuwe argumenten blijven exact hetzelfde gedrag geven', () => {
    // Reden dat de nieuwe parameters achteraan zijn toegevoegd met een default in
    // plaats van tussen de bestaande argumenten: dit moet blijven werken zonder dat
    // een van de aanroepen elders in de codebase hoefde te wijzigen.
    const zonder = getIncomeBreakdown(NA_AOW, 5000, AOW_NETTO_MND, 67, 800, 65, 'alleenstaand')
    expect(zonder.lijfrenteUitkering).toBe(0)
    expect(round(zonder.employerPension)).toBe(round(
      getIncomeBreakdown(NA_AOW, 5000, AOW_NETTO_MND, 67, 800, 65, 'alleenstaand', 0, 67).employerPension
    ))
  })
})

// ── Eenmalig bedrag rond de pensioendatum telt aan beide kanten mee ──────────
//
// Een bedrag dat één jaar ná de pensioendatum valt in plaats van één jaar ervóór
// hoort de uitkomst nauwelijks te veranderen: het is hetzelfde geld, het staat
// alleen een jaar korter te renderen. Vóór deze fix viel zo'n bedrag aan béide
// kanten van de vergelijking weg — het zat niet in projectedCapital (dat stopt op
// de pensioendatum) en evenmin in requiredCapital (dat alleen onttrekkingen
// contant maakte). Eén jaar schuiven sloeg daardoor een overschot van € 122.039
// om in een tekort van € 301.262, terwijl het restkapitaal op leeftijd 90 met
// € 396.016 tegen € 320.404 nauwelijks verschilde. De invoer hieronder is exact
// het geval dat Hendrik op 30 augustus 2026 meldde.
describe('calculatePension — eenmalig bedrag rond de pensioendatum', () => {
  const scenario = (year: number) => baseInputs({
    currentAge: 48, retirementAge: 49, lifeExpectancy: 90,
    currentCapital: 700000, monthlyContribution: 0,
    returnBeforeRetirement: 9, returnAfterRetirement: 6, inflation: 3,
    desiredRetirementIncome: 5000, desiredRetirementIncomeType: 'bruto',
    woonsituatie: 'samenwonend', aowMaandBedragNetto: 1084,
    lifeEvents: [{ name: 'geld', amount: 400000, year }],
  })

  const uitkomst = (year: number) => {
    const r = calculatePension(scenario(year), { currentYear: 2026 })
    return { surplus: r.projectedCapital - r.requiredCapital, restkapitaal: r.surplusAtEnd }
  }

  it('een jaar opschuiven kost één jaar rendement, niet het hele bedrag', () => {
    const voor = uitkomst(2026)  // laatste jaar vóór de pensioendatum: opbouwfase
    const na = uitkomst(2027)    // pensioenjaar zelf: eerste uitkeringsjaar

    // 400.000 × (1,09/1,03 − 1) = € 23.301 aan gemist reëel rendement.
    expect(Math.round(voor.surplus - na.surplus)).toBe(23301)
    expect(Math.round(voor.surplus)).toBe(122039)
    expect(Math.round(na.surplus)).toBe(98738)
  })

  it('blijft in beide gevallen een overschot, net als het restkapitaal', () => {
    // De kern van de melding: dit sloeg om naar een tekort van € 301.262 terwijl
    // het restkapitaal op de einddatum in beide gevallen ruim positief bleef.
    for (const year of [2026, 2027]) {
      const r = uitkomst(year)
      expect(r.surplus).toBeGreaterThan(0)
      expect(r.restkapitaal).toBeGreaterThan(0)
    }
  })

  // Tegenhanger: een uitgave ná de pensioendatum hoort het doelbedrag juist te
  // verhógen met de contante waarde ervan, niet stilzwijgend te verdwijnen.
  it('een uitgave ná de pensioendatum verhoogt het benodigd eindvermogen', () => {
    const zonder = calculatePension(baseInputs(), { currentYear: 2026 })
    const met = calculatePension(SCENARIOS['4_negatief_bedrag_na_pensioendatum'], { currentYear: 2026 })
    // −100.000 in 2056, acht jaar na de pensioendatum 2048, contant tegen het
    // reële rendement ná pensioendatum (1,04/1,025 − 1 = 1,46341% per jaar).
    // Uitgeschreven als formule en niet als afgerond bedrag: de uitkomst
    // (€ 89.027,51) ligt te dicht op een halve euro om op een rond getal te
    // toetsen zonder de toets zelf broos te maken.
    const contanteWaarde = 100000 / Math.pow(1.04 / 1.025, 8)
    expect(met.requiredCapital - zonder.requiredCapital).toBeCloseTo(contanteWaarde, 6)
  })
})

// Het scherm en de PDF-/Excel-export tonen naast het doelbedrag ook waar het
// vandaan komt: "benodigd voor je inkomen" min de eenmalige bedragen ná de
// pensioendatum. Dat brutobedrag wordt niet apart teruggegeven maar afgeleid als
// requiredCapital + pvEventsAfterRetirement. Deze tests leggen die identiteit
// vast: gaat pvEventsAfterRetirement ooit iets anders bevatten dan precies het
// bedrag dat van requiredCapital is afgetrokken, dan liegt de toelichting op het
// scherm over de rekenkern, en dat is precies het soort stille afwijking dat de
// melding van 30 augustus 2026 veroorzaakte.
describe('calculatePension — pvEventsAfterRetirement onderbouwt het doelbedrag', () => {
  const metJaar = (year: number) => baseInputs({
    currentAge: 48, retirementAge: 49, lifeExpectancy: 90,
    currentCapital: 700000, monthlyContribution: 0,
    returnBeforeRetirement: 9, returnAfterRetirement: 6, inflation: 3,
    desiredRetirementIncome: 5000, desiredRetirementIncomeType: 'bruto',
    woonsituatie: 'samenwonend', aowMaandBedragNetto: 1084,
    lifeEvents: [{ name: 'geld', amount: 400000, year }],
  })

  it('is nul zonder eenmalige bedragen ná de pensioendatum', () => {
    // 2026 valt nog in de opbouwfase: telt mee in projectedCapital, niet hier.
    expect(calculatePension(metJaar(2026), { currentYear: 2026 }).pvEventsAfterRetirement).toBe(0)
    expect(calculatePension(baseInputs(), { currentYear: 2026 }).pvEventsAfterRetirement).toBe(0)
  })

  it('is in het pensioenjaar zelf het onverdisconteerde bedrag', () => {
    // 2027 is het eerste uitkeringsjaar (yr = 0), dus contant maken deelt door
    // r^0 = 1 en de contante waarde is het bedrag zelf.
    const r = calculatePension(metJaar(2027), { currentYear: 2026 })
    expect(r.pvEventsAfterRetirement).toBeCloseTo(400000, 6)
  })

  it('is precies wat van het doelbedrag is afgetrokken', () => {
    const met = calculatePension(metJaar(2027), { currentYear: 2026 })
    const zonder = calculatePension(metJaar(2026), { currentYear: 2026 })
    // Beide scenario's hebben hetzelfde inkomensdoel, dus hetzelfde brutobedrag.
    // Dat is wat het scherm als "benodigd voor je inkomen" toont.
    expect(met.requiredCapital + met.pvEventsAfterRetirement).toBeCloseTo(zonder.requiredCapital, 6)
  })

  it('is negatief bij een uitgave ná de pensioendatum', () => {
    const r = calculatePension(SCENARIOS['4_negatief_bedrag_na_pensioendatum'], { currentYear: 2026 })
    const zonder = calculatePension(baseInputs(), { currentYear: 2026 })
    expect(r.pvEventsAfterRetirement).toBeLessThan(0)
    expect(r.requiredCapital + r.pvEventsAfterRetirement).toBeCloseTo(zonder.requiredCapital, 6)
  })
})

describe('calculatePension — golden master', () => {
  for (const [key, inputs] of Object.entries(SCENARIOS)) {
    it(key, () => {
      const r = calculatePension(inputs, { currentYear: 2026 })
      const expected = (fixture as Record<string, any>)[key]

      expect(round(r.projectedCapital)).toBe(expected.projectedCapital)
      expect(round(r.requiredCapital)).toBe(expected.requiredCapital)
      expect(round(r.desiredMonthlyNetto)).toBe(expected.desiredMonthlyNetto)
      expect(round(r.requiredMonthlyContribution)).toBe(expected.requiredMonthlyContribution)
      expect(round(r.surplusAtEnd)).toBe(expected.surplusAtEnd)
      expect(r.yearData.length).toBe(expected.yearDataLength)
      expect(roundYearRow(r.yearData[0])).toEqual(expected.yearDataFirst)
      expect(roundYearRow(r.yearData[r.yearData.length - 1])).toEqual(expected.yearDataLast)
    })
  }
})
