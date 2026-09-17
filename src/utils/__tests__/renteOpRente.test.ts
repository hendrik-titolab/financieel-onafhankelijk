// Handnagerekende verwachtingen, geen golden master: de formules zijn nieuw en simpel genoeg om
// de uitkomst zelf uit te schrijven, en dan bewijst de test correctheid in plaats van alleen
// "er is niets veranderd". Zelfde aanpak als box3.test.ts.
import { describe, it, expect } from 'vitest'
import {
  maandrente,
  eindwaardePerEuroMaandinleg,
  eindwaardeMaandinleg,
  groeifactorEenmalig,
  eindwaardeEenmaligeInleg,
  verdubbeltijd,
  matrixMaandinleg,
  matrixEenmaligeInleg,
  MATRIX_RENDEMENTEN,
  MATRIX_LOOPTIJDEN,
  HEAT_STAPPEN,
} from '../renteOpRente'

describe('maandrente — het opgegeven percentage is een effectief jaarrendement', () => {
  // Dit is de toets die vastlegt dat 6% ook echt 6% per jaar is, en niet 6% nominaal met
  // maandelijkse bijschrijving (dat zou 6,168% effectief zijn). i = 1,06^(1/12) − 1 =
  // 0,004867550565, en (1 + 0,004867550565)^12 komt weer precies op 1,06 uit.
  for (const r of MATRIX_RENDEMENTEN) {
    it(`${(r * 100).toFixed(0)}% per jaar komt twaalf maanden later exact terug`, () => {
      expect(Math.pow(1 + maandrente(r), 12)).toBeCloseTo(1 + r, 12)
    })
  }

  it('bij 6% is de maandrente 0,4867550565%, niet 0,5%', () => {
    expect(maandrente(0.06)).toBeCloseTo(0.004867550565, 12)
  })
})

describe('eindwaardePerEuroMaandinleg — nagerekend', () => {
  // i      = 1,06^(1/12) − 1          = 0,004867550565
  // (1+i)^12 − 1                      = 0,06
  // 0,06 / 0,004867550565             = 12,3265283420
  // × (1 + i) = × 1,004867550565      = 12,3865283420
  //
  // Leescontrole: twaalf stortingen van € 1 leveren € 12,39 op, dus € 0,39 rente over een jaar.
  // Dat is ruwweg de helft van 6% over € 12, wat klopt voor geld dat gemiddeld een half jaar
  // heeft kunnen groeien.
  it('één jaar bij 6% geeft 12,3865283420 per euro maandinleg', () => {
    expect(eindwaardePerEuroMaandinleg(0.06, 1)).toBeCloseTo(12.386528342, 9)
  })

  it('nul jaar geeft nul', () => {
    expect(eindwaardePerEuroMaandinleg(0.06, 0)).toBe(0)
  })
})

describe('eindwaardeMaandinleg — nagerekend', () => {
  // € 250 per maand, 10 jaar, 6%:
  //   per euro     = 163,26429012
  //   eindwaarde   = 250 × 163,26429012 = 40.816,0725
  //   totaalInleg  = 250 × 12 × 10      = 30.000
  //   × de inleg   = 40.816,0725 / 30.000 = 1,36053575
  it('€ 250 per maand, 10 jaar, 6% geeft € 40.816,07', () => {
    const r = eindwaardeMaandinleg(250, 0.06, 10)
    expect(r.eindwaarde).toBeCloseTo(40816.0725, 4)
    expect(r.totaalInleg).toBe(30000)
    expect(r.rendement).toBeCloseTo(10816.0725, 4)
    expect(r.vermenigvuldiging).toBeCloseTo(1.36053575, 8)
  })

  // De hoekcel rechtsonder in de matrix, het getal dat de boodschap draagt:
  // 250 × perEuro(0,10; 50) = 3.678.107,0929 op € 150.000 eigen inleg, dus × 24,5.
  it('€ 250 per maand, 50 jaar, 10% geeft € 3.678.107,09 op € 150.000 inleg', () => {
    const r = eindwaardeMaandinleg(250, 0.1, 50)
    expect(r.eindwaarde).toBeCloseTo(3678107.0929, 4)
    expect(r.totaalInleg).toBe(150000)
    expect(r.vermenigvuldiging).toBeCloseTo(24.52071395, 7)
  })

  // Dit is de reparatie op het prototype. ((1 + i)^n − 1) / i is bij i = 0 een deling 0/0 en
  // gaf daar NaN. Het rendementveld van de rekentool accepteert 0, dus dit kwam als "€ NaN"
  // op het scherm.
  it('rendement 0 geeft exact de totale inleg, geen NaN', () => {
    const r = eindwaardeMaandinleg(250, 0, 10)
    expect(r.eindwaarde).toBe(30000)
    expect(r.rendement).toBe(0)
    expect(r.vermenigvuldiging).toBe(1)
  })

  it('inleg 0 geeft 0 en geen deling door nul in de vermenigvuldiging', () => {
    const r = eindwaardeMaandinleg(0, 0.06, 30)
    expect(r.eindwaarde).toBe(0)
    expect(r.vermenigvuldiging).toBe(0)
  })

  it('negatieve inleg en negatieve looptijd worden geklemd op nul', () => {
    expect(eindwaardeMaandinleg(-100, 0.06, 10).eindwaarde).toBe(0)
    expect(eindwaardeMaandinleg(250, 0.06, -5).eindwaarde).toBe(0)
  })
})

describe('eindwaardeEenmaligeInleg — nagerekend', () => {
  // 1,06^10 = 1,7908476965, dus € 10.000 wordt € 17.908,48.
  it('€ 10.000, 10 jaar, 6% geeft € 17.908,48', () => {
    expect(groeifactorEenmalig(0.06, 10)).toBeCloseTo(1.7908476965, 9)
    const r = eindwaardeEenmaligeInleg(10000, 0.06, 10)
    expect(r.eindwaarde).toBeCloseTo(17908.477, 3)
    expect(r.totaalInleg).toBe(10000)
    expect(r.vermenigvuldiging).toBeCloseTo(1.7908476965, 9)
  })

  // 1,10^50 = 117,390853, de hoekcel rechtsonder.
  it('€ 10.000, 50 jaar, 10% geeft € 1.173.908,53', () => {
    expect(eindwaardeEenmaligeInleg(10000, 0.1, 50).eindwaarde).toBeCloseTo(1173908.53, 2)
  })

  it('rendement 0 laat het bedrag staan', () => {
    const r = eindwaardeEenmaligeInleg(10000, 0, 30)
    expect(r.eindwaarde).toBe(10000)
    expect(r.rendement).toBe(0)
  })
})

// Zoals box3.test.ts de rekenvoorbeelden uit het uitlegartikel vastpint: de tool en het artikel
// mogen niet uit elkaar lopen. Dit is de tabel in het Factor-blok "Verwacht rendement" van
// src/content/uitleg/wanneer-ben-je-financieel-onafhankelijk.mdx, een eenmalige inleg van
// € 100.000 zonder bijstortingen.
describe('sluit aan op de tabel in wanneer-ben-je-financieel-onafhankelijk.mdx', () => {
  const artikel: [number, number, number][] = [
    [0.02, 20, 148_595],
    [0.02, 30, 181_136],
    [0.02, 40, 220_804],
    [0.05, 20, 265_330],
    [0.05, 30, 432_194],
    [0.05, 40, 703_999],
    [0.08, 20, 466_096],
    [0.08, 30, 1_006_266],
    [0.08, 40, 2_172_452],
  ]
  for (const [r, jaren, verwacht] of artikel) {
    it(`${(r * 100).toFixed(0)}% over ${jaren} jaar geeft € ${verwacht.toLocaleString('nl-NL')}`, () => {
      expect(Math.round(eindwaardeEenmaligeInleg(100_000, r, jaren).eindwaarde)).toBe(verwacht)
    })
  }
})

describe('verdubbeltijd', () => {
  // ln(2) / ln(1 + r). Kruiscontrole met de vuistregel van 72: 72 / 6 = 12 tegen 11,896.
  const gevallen: [number, number][] = [
    [0.02, 35.002789],
    [0.04, 17.672988],
    [0.06, 11.895661],
    [0.08, 9.006468],
    [0.1, 7.272541],
  ]
  for (const [r, verwacht] of gevallen) {
    it(`${(r * 100).toFixed(0)}% verdubbelt in ${verwacht.toFixed(1)} jaar`, () => {
      expect(verdubbeltijd(r)).toBeCloseTo(verwacht, 6)
    })
  }

  it('de vuistregel van 72 komt in de buurt bij 6%', () => {
    expect(Math.abs(verdubbeltijd(0.06) - 72 / 6)).toBeLessThan(0.11)
  })

  it('zonder rendement verdubbelt er niets', () => {
    expect(verdubbeltijd(0)).toBe(Infinity)
    expect(verdubbeltijd(-0.02)).toBe(Infinity)
  })
})

describe('matrix', () => {
  it('heeft de vorm 5 rendementen × 8 looptijden', () => {
    const m = matrixMaandinleg(250)
    expect(m.rijen).toHaveLength(MATRIX_RENDEMENTEN.length)
    expect(m.rijen[0]).toHaveLength(MATRIX_LOOPTIJDEN.length)
  })

  // Dit is waarom heatIndex over de factor gaat en niet over het bedrag. Het prototype rekende
  // log(waarde) / log(maxwaarde), waardoor de tint meebewoog met de invoer: de hele tabel
  // verschoot van kleur terwijl je typte.
  it('de tint beweegt niet mee met het ingevulde bedrag', () => {
    const heats = (m: ReturnType<typeof matrixMaandinleg>) => m.rijen.map((rij) => rij.map((c) => c.heat))
    expect(heats(matrixMaandinleg(1000))).toEqual(heats(matrixMaandinleg(250)))
    expect(heats(matrixEenmaligeInleg(500_000))).toEqual(heats(matrixEenmaligeInleg(1000)))
  })

  // En dit is waarom de normalisatie tussen min en max loopt: de prototypeformule gaf over de
  // hele matrix alphawaarden tussen 0,64 en 1,00, dus geen verloop maar een overal even donker
  // vlak. Linksboven hoort 0 te zijn en rechtsonder de hoogste stap.
  it('loopt van de laagste tot de hoogste tintstap', () => {
    for (const m of [matrixMaandinleg(250), matrixEenmaligeInleg(10_000)]) {
      expect(m.rijen[0][0].heat).toBe(0)
      expect(m.rijen[m.rijen.length - 1][MATRIX_LOOPTIJDEN.length - 1].heat).toBe(HEAT_STAPPEN)
      const alle = m.rijen.flat().map((c) => c.heat)
      expect(Math.min(...alle)).toBe(0)
      expect(Math.max(...alle)).toBe(HEAT_STAPPEN)
      expect(new Set(alle).size).toBeGreaterThan(2)
    }
  })

  it('cellen dragen hun eigen rendement en looptijd', () => {
    const cel = matrixEenmaligeInleg(10_000).rijen[2][5]
    expect(cel.jaarrendement).toBe(0.06)
    expect(cel.jaren).toBe(30)
    expect(cel.eindwaarde).toBeCloseTo(10_000 * Math.pow(1.06, 30), 6)
  })
})

// Bewaakt de bewust geaccepteerde afwijking van pensionCalc.ts, zie het blokcommentaar bovenin
// renteOpRente.ts. Deze test bootst de wortelbenadering van simulateAccumulation()
// (pensionCalc.ts, regel 433) na in plaats van hem te importeren: die functie is niet
// geëxporteerd, en hem alleen voor een test exporteren raakt de rekenkern van de planner voor
// een feit dat hier gedocumenteerd hoort te staan. Valt deze test om, dan heeft iemand aan een
// van beide kanten gedraaid en moet die keuze opnieuw besproken worden.
describe('afwijking van de mid-year-benadering in pensionCalc.ts', () => {
  it('scheelt 0,3013% per jaarinleg bij 7%', () => {
    const exact = eindwaardePerEuroMaandinleg(0.07, 1) / 12 // 1,03752476
    const planner = Math.sqrt(1.07) // 1,03440804
    expect(exact).toBeCloseTo(1.03752476, 8)
    expect(planner).toBeCloseTo(1.03440804, 8)
    const afwijkingPct = (exact / planner - 1) * 100
    expect(afwijkingPct).toBeGreaterThan(0.29)
    expect(afwijkingPct).toBeLessThan(0.31)
  })

  // € 1.000 per maand, 30 jaar, 7%:
  //   deze module (exact maandelijks, storting vooraf) € 1.176.064,86
  //   pensionCalc.ts (jaarinleg × sqrt(1,07))          € 1.172.531,97
  //   exact maandelijks maar storting achteraf         € 1.169.452,60
  // De planner ligt dus tussen vooraf en achteraf in. De keuze wanneer in de maand je stort
  // weegt zwaarder dan het verschil met de planner, en daarmee is dit een conventieverschil.
  it('geeft over 30 jaar € 3.533 verschil op € 1,18 miljoen', () => {
    const hier = eindwaardeMaandinleg(1000, 0.07, 30).eindwaarde
    let planner = 0
    for (let jaar = 0; jaar < 30; jaar++) planner = planner * 1.07 + 1000 * 12 * Math.sqrt(1.07)
    expect(hier).toBeCloseTo(1176064.86, 2)
    expect(planner).toBeCloseTo(1172531.97, 2)
    expect(hier - planner).toBeCloseTo(3532.89, 2)
  })
})
