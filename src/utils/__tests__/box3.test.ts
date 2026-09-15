// Bevinding 10 uit de audit van 7 september 2026: de risicoprofielen werden in de
// UI aangeprezen als "netto na kosten en box 3", terwijl risicoprofielen.ts
// diezelfde getallen als nominaal documenteert en de rekenkern nergens iets
// aftrok. Het uitlegartikel sprak zichzelf binnen één alinea tegen.
import { describe, it, expect } from 'vitest'
import {
  box3HeffingPerJaar, geschatteBox3Druk, box3DrukAfgerond, nettoNominaalRendement,
  box3Forfait, werkelijkRendement, werkelijkRendementDirect, box3Vergelijking,
} from '../box3'
import { calculatePension } from '../pensionCalc'
import { runMonteCarlo } from '../monteCarlo'
import { BOX3_JAREN, BOX3_JAREN_IN_TOOL } from '../../config/fiscaleParameters'
import { PARAMETER_JAAR } from '../../config/modelVersie'
import { baseInputs } from './fixtures'

describe('box3HeffingPerJaar — nagerekend met de parameters van 2026', () => {
  // tarief 36%, forfait beleggingen 6%, heffingsvrij EUR 59.357 alleenstaand.
  // (vermogen − 59.357) × 6% × 36%
  const gevallen: [number, number][] = [
    [100000, 878],
    [250000, 4118],
    [600000, 11678],
    [1000000, 20318],
  ]
  for (const [vermogen, verwacht] of gevallen) {
    it(`EUR ${vermogen} geeft EUR ${verwacht}`, () => {
      expect(Math.round(box3HeffingPerJaar(vermogen, 'alleenstaand', 2026))).toBe(verwacht)
    })
  }

  it('heft niets onder het heffingsvrije vermogen', () => {
    expect(box3HeffingPerJaar(59357, 'alleenstaand', 2026)).toBe(0)
    expect(box3HeffingPerJaar(0, 'alleenstaand', 2026)).toBe(0)
  })

  it('gebruikt de hogere vrijstelling voor fiscaal partners', () => {
    expect(box3HeffingPerJaar(100000, 'samenwonend', 2026))
      .toBeLessThan(box3HeffingPerJaar(100000, 'alleenstaand', 2026))
  })
})

describe('box3HeffingPerJaar — het belastingjaar werkt echt door', () => {
  // WP9, fase 1: deze functie las het platte BOX3-object en kende dus maar één
  // jaar. Nu leest hij BOX3_JAREN[belastingjaar]. Zonder deze toets zou een
  // genegeerde parameter niet opvallen: alle andere tests draaien op 2026 en
  // blijven ook groen als het jaar nergens aankomt.
  it('rekent 2025 met de cijfers van 2025', () => {
    // Met de hand nagerekend: heffingsvrij EUR 57.684, forfait beleggingen 5,88%,
    // tarief 36%. (100.000 - 57.684) x 5,88% x 36% = 895,745088.
    expect(box3HeffingPerJaar(100_000, 'alleenstaand', 2025)).toBeCloseTo(895.745088, 6)
    // 2026 heeft een hoger heffingsvrij vermogen (59.357) maar ook een hoger
    // forfait (6,00%). Per saldo betaal je over hetzelfde vermogen iets minder.
    expect(box3HeffingPerJaar(100_000, 'alleenstaand', 2026)).toBeCloseTo(877.888800, 6)
  })

  it('valt zonder jaar terug op het parameterjaar', () => {
    expect(box3HeffingPerJaar(100_000, 'alleenstaand'))
      .toBe(box3HeffingPerJaar(100_000, 'alleenstaand', PARAMETER_JAAR))
  })

  it('geeft het jaar door vanuit de twee afgeleide functies', () => {
    expect(geschatteBox3Druk(100_000, 'alleenstaand', 2025)).toBeCloseTo(0.895745, 5)
    expect(geschatteBox3Druk(100_000, 'alleenstaand', 2026)).toBeCloseTo(0.877889, 5)
    // Op één decimaal vallen beide jaren toevallig op 0,9. Dat is geen fout maar
    // precies waarom de toets hierboven op de onafgeronde waarde kijkt.
    expect(box3DrukAfgerond(100_000, 'alleenstaand', 2025)).toBe(0.9)
    expect(box3DrukAfgerond(100_000, 'alleenstaand', 2026)).toBe(0.9)
  })
})

describe('geschatteBox3Druk', () => {
  it('loopt op met de omvang van het vermogen', () => {
    // Precies waarom één vast percentage niet voor iedereen kan kloppen, wat de
    // kern van de auditbevinding was: hetzelfde profiel kan voor EUR 40.000
    // spaargeld en EUR 2 miljoen beleggingen niet dezelfde belastingdruk zijn.
    const klein = geschatteBox3Druk(100000, 'alleenstaand', 2026)
    const groot = geschatteBox3Druk(1000000, 'alleenstaand', 2026)
    expect(klein).toBeCloseTo(0.88, 1)
    expect(groot).toBeCloseTo(2.03, 1)
    expect(groot).toBeGreaterThan(klein)
  })

  it('geeft nul bij geen vermogen', () => {
    expect(geschatteBox3Druk(0, 'alleenstaand', 2026)).toBe(0)
    expect(geschatteBox3Druk(-100, 'alleenstaand', 2026)).toBe(0)
  })
})

describe('nettoNominaalRendement', () => {
  it('trekt kosten en belasting als procentpunten af', () => {
    expect(nettoNominaalRendement(6, 0.4, 1.9)).toBeCloseTo(3.7, 10)
  })

  it('laat het rendement met rust als beide nul zijn', () => {
    expect(nettoNominaalRendement(6, 0, 0)).toBe(6)
  })
})

describe('kosten en vermogensbelasting in de planner', () => {
  it('verandert niets zolang beide op nul staan', () => {
    // Dit is de begintoestand en de reden dat geen enkele golden-waarde is
    // verschoven door deze wijziging.
    const zonder = calculatePension(baseInputs(), { currentYear: 2026 })
    const nul = calculatePension(
      baseInputs({ kostenPct: 0, vermogensbelastingPct: 0 }), { currentYear: 2026 })
    expect(nul.projectedCapital).toBe(zonder.projectedCapital)
    expect(nul.requiredCapital).toBe(zonder.requiredCapital)
  })

  it('verlaagt het eindvermogen zodra ze worden ingevuld', () => {
    const zonder = calculatePension(baseInputs(), { currentYear: 2026 })
    const met = calculatePension(
      baseInputs({ kostenPct: 0.4, vermogensbelastingPct: 1.9 }), { currentYear: 2026 })
    expect(met.projectedCapital).toBeLessThan(zonder.projectedCapital)
    // En het doelbedrag gaat juist omhoog: een lager rendement na de pensioendatum
    // betekent dat er meer vermogen nodig is voor hetzelfde inkomen.
    expect(met.requiredCapital).toBeGreaterThan(zonder.requiredCapital)
  })

  it('rekent hetzelfde als een direct verlaagd rendement', () => {
    // 6% bruto met 0,4% kosten en 1,9% belasting moet exact hetzelfde geven als
    // 3,7% rechtstreeks invullen. Anders zit de aftrek op de verkeerde plek in de
    // keten, bijvoorbeeld ná de inflatiecorrectie.
    const viaVelden = calculatePension(
      baseInputs({ returnBeforeRetirement: 6, returnAfterRetirement: 4, kostenPct: 0.4, vermogensbelastingPct: 1.9 }),
      { currentYear: 2026 })
    const direct = calculatePension(
      baseInputs({ returnBeforeRetirement: 3.7, returnAfterRetirement: 1.7 }),
      { currentYear: 2026 })
    expect(viaVelden.projectedCapital).toBeCloseTo(direct.projectedCapital, 6)
    expect(viaVelden.requiredCapital).toBeCloseTo(direct.requiredCapital, 6)
  })
})

// Besluit Hendrik, 8 september 2026: het volledige box 3-model blijft een
// openstaand punt, maar het invoerveld krijgt een realistische startwaarde die uit
// de invoer wordt geschat in plaats van nul.
describe('box3DrukAfgerond — wat er in het invoerveld komt', () => {
  const gevallen: [number, number][] = [
    [100000, 0.9],
    [250000, 1.6],
    [600000, 1.9],
    [1000000, 2.0],
    [2000000, 2.1],
  ]
  for (const [vermogen, verwacht] of gevallen) {
    it(`EUR ${vermogen} geeft ${verwacht}%`, () => {
      expect(box3DrukAfgerond(vermogen, 'alleenstaand', 2026)).toBe(verwacht)
    })
  }

  it('geeft nul onder het heffingsvrije vermogen', () => {
    expect(box3DrukAfgerond(50000, 'alleenstaand', 2026)).toBe(0)
  })

  it('rondt af op één decimaal, gelijk aan wat het veld toont', () => {
    // Als deze twee uit elkaar lopen blijft de knop "terug naar de schatting"
    // staan terwijl het veld al de schatting toont.
    const v = box3DrukAfgerond(600000, 'alleenstaand', 2026)
    expect(v).toBe(Math.round(v * 10) / 10)
  })

  it('is lager voor fiscaal partners bij hetzelfde vermogen', () => {
    expect(box3DrukAfgerond(300000, 'samenwonend', 2026))
      .toBeLessThan(box3DrukAfgerond(300000, 'alleenstaand', 2026))
  })

  it('scheelt merkbaar tussen een ton en een miljoen', () => {
    // De kern van waarom een vast percentage hier niet kan: meer dan een
    // verdubbeling van de druk over dit bereik.
    expect(box3DrukAfgerond(1000000, 'alleenstaand', 2026))
      .toBeGreaterThan(box3DrukAfgerond(100000, 'alleenstaand', 2026) * 2)
  })
})


/* ══════════════════════════════════════════════════════════════════════════
 * De box 3-rekentool
 * ══════════════════════════════════════════════════════════════════════════
 *
 * De vijf gevallen hieronder zijn de rekenvoorbeelden die de Belastingdienst zelf
 * publiceert op "hoe is het box 3-inkomen op mijn voorlopige aanslag 2026
 * berekend", geraadpleegd 8 september 2026. Ze staan hier omdat ze meer vastleggen
 * dan mijn eigen formule: ze leggen vast dat de tool hetzelfde bedrag geeft als de
 * aanslag, inclusief de twee afrondingsregels die nergens met zoveel woorden
 * gepubliceerd zijn (aandeel afkappen op twee decimalen, en per stap afronden in
 * het voordeel van de belastingplichtige).
 *
 * Voorbeeld 5 gaat over groene beleggingen, en die vrijstelling zit bewust niet in
 * de tool. Het belastbare deel is daarom rechtstreeks ingevoerd (€ 150.000 min de
 * dubbele vrijstelling van € 26.715 = € 96.570), zodat de rest van het voorbeeld
 * wel getoetst wordt.
 */
describe('box3Forfait — de vijf rekenvoorbeelden van de Belastingdienst, 2026', () => {
  it('1. alleen spaargeld, geen fiscaal partner', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 150_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
    })
    expect(r.belastbaarRendement).toBe(1_920)
    expect(r.rendementsgrondslag).toBe(150_000)
    expect(r.grondslagSparenEnBeleggen).toBe(90_643)
    expect(r.perPersoon[0].aandeelPct).toBe(60.42) // afgerond zou 60,43 zijn
    expect(r.voordeel).toBe(1_160)
    expect(r.belasting).toBe(417)
  })

  it('2. alleen spaargeld, met fiscaal partner', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: true,
      banktegoeden: 150_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
    })
    expect(r.belastbaarRendement).toBe(1_920)
    expect(r.grondslagSparenEnBeleggen).toBe(31_286)
    expect(r.perPersoon[0].grondslag).toBe(15_643)
    expect(r.perPersoon[0].aandeelPct).toBe(10.42)
    expect(r.perPersoon[0].voordeel).toBe(200)
    expect(r.perPersoon[0].belasting).toBe(72)
    expect(r.belasting).toBe(144) // samen
  })

  it('3. gemengd vermogen met schuld, geen fiscaal partner', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 150_000, beleggingen: 75_000, overigeBezittingen: 200_000,
      schulden: 100_000,
    })
    expect(r.rendementBanktegoeden).toBe(1_920)
    expect(r.rendementOverig).toBe(16_500)
    expect(r.aftrekbareSchulden).toBe(96_200)
    // 96.200 × 2,70% = 2.597,40 en de Belastingdienst rekent met 2.598: het
    // schuldrendement gaat naar boven, want het gaat van het totaal af.
    expect(r.rendementSchulden).toBe(2_598)
    expect(r.belastbaarRendement).toBe(15_822)
    expect(r.rendementsgrondslag).toBe(328_800)
    expect(r.grondslagSparenEnBeleggen).toBe(269_443)
    expect(r.perPersoon[0].aandeelPct).toBe(81.94) // afgerond zou 81,95 zijn
    expect(r.voordeel).toBe(12_964)
    expect(r.belasting).toBe(4_667)
  })

  it('4. gemengd vermogen met schuld, met fiscaal partner', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: true,
      banktegoeden: 150_000, beleggingen: 75_000, overigeBezittingen: 200_000,
      schulden: 100_000,
    })
    expect(r.aftrekbareSchulden).toBe(92_400) // drempel telt dubbel
    expect(r.rendementSchulden).toBe(2_495)
    expect(r.belastbaarRendement).toBe(15_925)
    expect(r.rendementsgrondslag).toBe(332_600)
    expect(r.grondslagSparenEnBeleggen).toBe(213_886)
    expect(r.perPersoon[0].grondslag).toBe(106_943)
    expect(r.perPersoon[0].aandeelPct).toBe(32.15)
    expect(r.perPersoon[0].voordeel).toBe(5_119)
    expect(r.perPersoon[0].belasting).toBe(1_842)
    expect(r.belasting).toBe(3_684)
  })

  it('5. alles toegerekend aan één partner', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: true,
      banktegoeden: 5_000, beleggingen: 96_570, overigeBezittingen: 250_000,
      schulden: 0, verdelingPersoon1: 1,
    })
    // 346.570 × 6,00% = 20.794,20 wordt 20.794: bezittingen gaan naar beneden.
    expect(r.rendementOverig).toBe(20_794)
    expect(r.belastbaarRendement).toBe(20_858)
    expect(r.rendementsgrondslag).toBe(351_570)
    expect(r.grondslagSparenEnBeleggen).toBe(232_856)
    expect(r.perPersoon[0].aandeelPct).toBe(66.23)
    expect(r.perPersoon[0].voordeel).toBe(13_814)
    expect(r.perPersoon[0].belasting).toBe(4_973)
    expect(r.perPersoon[1].belasting).toBe(0)
    expect(r.belasting).toBe(4_973)
  })
})

describe('box3Forfait — een onbruikbare verdeling maakt de uitkomst niet stuk', () => {
  const basis = {
    jaar: 2026 as const, fiscaalPartner: true,
    banktegoeden: 100_000, beleggingen: 200_000, overigeBezittingen: 0, schulden: 0,
  }

  it('behandelt NaN als een weggelaten verdeling', () => {
    // ?? vangt alleen null en undefined. NaN glipte erdoor en werd via
    // Math.max(0, NaN) doorgegeven aan grondslag, aandeelPct, voordeel en de
    // belasting: het scherm toonde dan "EUR NaN" zonder foutmelding.
    const metNaN = box3Forfait({ ...basis, verdelingPersoon1: Number.NaN })
    const zonder = box3Forfait(basis)

    expect(Number.isNaN(metNaN.belasting)).toBe(false)
    expect(metNaN.belasting).toBe(zonder.belasting)
    expect(metNaN.perPersoon[0].grondslag).toBe(zonder.perPersoon[0].grondslag)
  })

  it('laat een geldige verdeling ongemoeid', () => {
    // De reparatie hierboven mag geen enkele bestaande uitkomst verschuiven.
    for (const deel of [0, 0.25, 0.5, 1]) {
      const r = box3Forfait({ ...basis, verdelingPersoon1: deel })
      expect(Number.isNaN(r.belasting)).toBe(false)
      expect(r.perPersoon[0].grondslag).toBeCloseTo(r.grondslagSparenEnBeleggen * deel, 6)
    }
  })

  it('klemt een verdeling buiten 0 tot 1 net als voorheen', () => {
    expect(box3Forfait({ ...basis, verdelingPersoon1: 5 }).perPersoon[0].grondslag)
      .toBe(box3Forfait({ ...basis, verdelingPersoon1: 1 }).perPersoon[0].grondslag)
    expect(box3Forfait({ ...basis, verdelingPersoon1: -5 }).perPersoon[0].grondslag)
      .toBe(box3Forfait({ ...basis, verdelingPersoon1: 0 }).perPersoon[0].grondslag)
  })
})

describe('BOX3_JAREN_IN_TOOL — de twee jarenlijsten in de config lopen niet uiteen', () => {
  it('heeft voor elk aangeboden jaar ook werkelijk cijfers', () => {
    // fiscale-cijfers.json houdt twee losse velden bij: de jaren met cijfers en de
    // jaren die de tool aanbiedt. Raken die uit de pas, dan is BOX3_JAREN[jaar]
    // undefined en klapt de box 3-tool op een wit scherm. De select filtert daar
    // sinds 15 september 2026 op, maar dat is de verdediging; dit is de melding
    // bij de bron, zodat een jaarwisseling die de twee uit elkaar trekt hier al
    // opvalt en niet pas in het scherm.
    for (const jaar of BOX3_JAREN_IN_TOOL) {
      expect(BOX3_JAREN, `jaar ${jaar} wordt aangeboden maar heeft geen cijfers`)
        .toHaveProperty(String(jaar))
    }
  })
})

describe('box3Forfait — belastingjaar 2025, met de hand nagerekend', () => {
  // € 100.000 spaargeld en € 200.000 beleggingen, alleenstaand, geen schulden.
  // Stap 1: 100.000 × 1,37% = 1.370 en 200.000 × 5,88% = 11.760, samen 13.130.
  // Stap 2: 300.000. Stap 3: 300.000 − 57.684 = 242.316.
  // Stap 4: 242.316 / 300.000 × 100 = 80,772% wordt 80,77%.
  // Stap 5: 13.130 × 80,77% = 10.605,101 wordt 10.605.
  // Stap 6: 36% × 10.605 = 3.817,80 wordt 3.817.
  const r = box3Forfait({
    jaar: 2025, fiscaalPartner: false,
    banktegoeden: 100_000, beleggingen: 200_000, overigeBezittingen: 0, schulden: 0,
  })

  it('gebruikt de forfaits en het heffingsvrij vermogen van 2025', () => {
    expect(r.rendementBanktegoeden).toBe(1_370)
    expect(r.rendementOverig).toBe(11_760)
    expect(r.heffingsvrijVermogen).toBe(57_684)
    expect(r.grondslagSparenEnBeleggen).toBe(242_316)
  })

  it('komt uit op € 3.817', () => {
    expect(r.perPersoon[0].aandeelPct).toBe(80.77)
    expect(r.voordeel).toBe(10_605)
    expect(r.belasting).toBe(3_817)
  })

  it('geeft een ander bedrag dan hetzelfde vermogen in 2026', () => {
    // Anders zou een verkeerd gekozen jaar ongemerkt goed gaan.
    const in2026 = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 100_000, beleggingen: 200_000, overigeBezittingen: 0, schulden: 0,
    })
    expect(in2026.belasting).not.toBe(r.belasting)
  })
})

describe('box3Forfait — randgevallen', () => {
  it('heft niets onder het heffingsvrije vermogen', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 50_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
    })
    expect(r.grondslagSparenEnBeleggen).toBe(0)
    expect(r.belasting).toBe(0)
  })

  it('trekt de schuldendrempel af voordat de schuld meetelt', () => {
    const zonder = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 200_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
    })
    const kleineSchuld = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 200_000, beleggingen: 0, overigeBezittingen: 0, schulden: 3_800,
    })
    // Een schuld tot en met de drempel doet niets.
    expect(kleineSchuld.aftrekbareSchulden).toBe(0)
    expect(kleineSchuld.belasting).toBe(zonder.belasting)
  })

  it('laat een vermogen dat volledig uit schuld bestaat niet negatief worden', () => {
    const r = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 10_000, beleggingen: 0, overigeBezittingen: 0, schulden: 200_000,
    })
    expect(r.belastbaarRendement).toBeLessThan(0)
    expect(r.voordeel).toBe(0)
    expect(r.belasting).toBe(0)
  })
})

describe('werkelijkRendement', () => {
  it('telt ongerealiseerde waardestijging mee', () => {
    const r = werkelijkRendement({
      reguliereVoordelen: 0,
      waardeBegin: 100_000, waardeEind: 112_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.waardeontwikkeling).toBe(12_000)
    expect(r.rendement).toBe(12_000)
  })

  it('rekent een storting halverwege het jaar niet als rendement', () => {
    // Het vermogen groeit met 10.000, maar er is 10.000 bijgestort: rendement nul.
    const r = werkelijkRendement({
      reguliereVoordelen: 0,
      waardeBegin: 100_000, waardeEind: 110_000,
      aankopen: 10_000, verkopen: 0, renteSchulden: 0,
    })
    expect(r.rendement).toBe(0)
  })

  it('telt een opname niet als verlies', () => {
    const r = werkelijkRendement({
      reguliereVoordelen: 0,
      waardeBegin: 100_000, waardeEind: 90_000,
      aankopen: 0, verkopen: 10_000, renteSchulden: 0,
    })
    expect(r.rendement).toBe(0)
  })

  it('trekt rente op een box 3-schuld af', () => {
    const r = werkelijkRendement({
      reguliereVoordelen: 5_000,
      waardeBegin: 100_000, waardeEind: 100_000,
      aankopen: 0, verkopen: 0, renteSchulden: 2_000,
    })
    expect(r.rendement).toBe(3_000)
  })

  it('zet een negatief jaar op nul en meldt dat', () => {
    // Verliezen zijn niet verrekenbaar met een ander jaar. Wie dat niet weet,
    // verwacht een teruggaaf die er niet is.
    const r = werkelijkRendement({
      reguliereVoordelen: 1_000,
      waardeBegin: 300_000, waardeEind: 260_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.bruto).toBe(-39_000)
    expect(r.rendement).toBe(0)
    expect(r.opNulGezet).toBe(true)
  })
})

describe('box3Vergelijking — forfait tegen tegenbewijs', () => {
  const invoer2025 = {
    jaar: 2025 as const, fiscaalPartner: false,
    banktegoeden: 100_000, beleggingen: 200_000, overigeBezittingen: 0, schulden: 0,
  }

  it('kiest het werkelijke rendement als dat lager is', () => {
    const r = box3Vergelijking(invoer2025, {
      reguliereVoordelen: 1_500,
      waardeBegin: 300_000, waardeEind: 295_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.werkelijk.rendement).toBe(0) // negatief jaar, op nul gezet
    expect(r.geldt).toBe('werkelijk')
    expect(r.belasting).toBe(0)
    expect(r.voordeelTegenbewijs).toBe(3_817)
  })

  it('houdt het forfait aan als het werkelijke rendement hoger is', () => {
    const r = box3Vergelijking(invoer2025, {
      reguliereVoordelen: 2_000,
      waardeBegin: 300_000, waardeEind: 310_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.werkelijk.rendement).toBe(12_000)
    expect(r.geldt).toBe('forfait')
    expect(r.belasting).toBe(3_817)
    expect(r.voordeelTegenbewijs).toBe(0)
  })

  it('helpt niet bij een klein vermogen, ook niet bij een laag rendement', () => {
    // Dit is de vergelijking die mensen fout maken. Het werkelijke rendement is
    // 1,00% en dus lager dan het forfait van 1,28%, maar bij het werkelijke
    // rendement geldt geen heffingsvrij vermogen. Het forfait blijft gunstiger.
    const r = box3Vergelijking(
      {
        jaar: 2026, fiscaalPartner: false,
        banktegoeden: 100_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
      },
      {
        reguliereVoordelen: 1_000,
        waardeBegin: 100_000, waardeEind: 100_000,
        aankopen: 0, verkopen: 0, renteSchulden: 0,
      },
    )
    expect(r.forfait.voordeel).toBe(520)
    expect(r.werkelijk.rendement).toBe(1_000)
    expect(r.geldt).toBe('forfait')
    expect(r.voordeelTegenbewijs).toBe(0)
  })

  it('valt terug op het forfait als er geen tegenbewijs is ingevuld', () => {
    const r = box3Vergelijking(invoer2025, null)
    expect(r.geldt).toBe('forfait')
    expect(r.belasting).toBe(3_817)
  })
})

/**
 * De rekenvoorbeelden uit het uitlegartikel.
 *
 * Ze staan hier zodat het artikel en de tool niet uit elkaar kunnen lopen. Als
 * een van deze bedragen verandert, bijvoorbeeld omdat een voorlopig forfait
 * definitief wordt vastgesteld, valt deze toets om en moet het artikel mee.
 * Artikel: src/content/uitleg/hoeveel-belasting-betaal-ik-over-mijn-vermogen.md
 */
describe('rekenvoorbeelden uit het uitlegartikel', () => {
  const spaarderEnBelegger = {
    jaar: 2026 as const, fiscaalPartner: false,
    banktegoeden: 100_000, beleggingen: 200_000, overigeBezittingen: 0, schulden: 0,
  }

  it('€ 100.000 spaargeld en € 200.000 beleggingen kost € 3.834 in 2026', () => {
    const r = box3Forfait(spaarderEnBelegger)
    expect(r.rendementBanktegoeden).toBe(1_280)
    expect(r.rendementOverig).toBe(12_000)
    expect(r.belastbaarRendement).toBe(13_280)
    expect(r.grondslagSparenEnBeleggen).toBe(240_643)
    expect(r.perPersoon[0].aandeelPct).toBe(80.21)
    expect(r.voordeel).toBe(10_651)
    expect(r.belasting).toBe(3_834)
  })

  it('een slecht beursjaar maakt dat nul via het tegenbewijs', () => {
    const r = box3Vergelijking(spaarderEnBelegger, {
      reguliereVoordelen: 1_500,
      waardeBegin: 300_000, waardeEind: 290_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.werkelijk.bruto).toBe(-8_500)
    expect(r.geldt).toBe('werkelijk')
    expect(r.belasting).toBe(0)
    expect(r.voordeelTegenbewijs).toBe(3_834)
  })

  it('de spaarder met € 100.000 betaalt € 187 en heeft niets aan tegenbewijs', () => {
    const alleenSpaargeld = {
      jaar: 2026 as const, fiscaalPartner: false,
      banktegoeden: 100_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
    }
    const f = box3Forfait(alleenSpaargeld)
    expect(f.belasting).toBe(187)

    // 1,0% rente is minder dan het forfait van 1,28%, en tóch blijft het forfait
    // gunstiger. Dat komt door het heffingsvrije vermogen, dat bij het werkelijke
    // rendement niet meetelt. Dit is de kern van het artikel.
    const r = box3Vergelijking(alleenSpaargeld, {
      reguliereVoordelen: 1_000,
      waardeBegin: 100_000, waardeEind: 100_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.geldt).toBe('forfait')
    expect(r.belasting).toBe(187)
  })
})

describe('afronding op hele euro\u0027s, in het voordeel van de belastingplichtige', () => {
  // Bij de aangifte mag elk veld op een hele euro worden afgerond, en je mag zelf
  // de gunstige kant kiezen. Aan de kant van het werkelijke rendement is dat naar
  // beneden: hoe lager dat bedrag, hoe lager de aanslag.
  it('rondt een werkelijk rendement met centen naar beneden af', () => {
    const r = werkelijkRendement({
      reguliereVoordelen: 1_000.90,
      waardeBegin: 100_000, waardeEind: 102_000.40,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    expect(r.bruto).toBeCloseTo(3_001.3, 6)
    expect(r.rendement).toBe(3_001)
  })

  it('doet dat ook bij een rechtstreeks ingevuld bedrag', () => {
    expect(werkelijkRendementDirect(2_500.99).rendement).toBe(2_500)
  })
})

describe('werkelijk rendement dat de gebruiker zelf al weet', () => {
  const invoer = {
    jaar: 2026 as const, fiscaalPartner: false,
    banktegoeden: 80_000, beleggingen: 120_000, overigeBezittingen: 0, schulden: 0,
  }

  it('geeft dezelfde uitkomst als de uitgerekende route bij hetzelfde bedrag', () => {
    const viaVelden = box3Vergelijking(invoer, {
      reguliereVoordelen: 3_000,
      waardeBegin: 200_000, waardeEind: 200_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    const direct = box3Vergelijking(invoer, { bedrag: 3_000 })
    expect(direct.werkelijk.rendement).toBe(viaVelden.werkelijk.rendement)
    expect(direct.belasting).toBe(viaVelden.belasting)
    expect(direct.geldt).toBe(viaVelden.geldt)
  })

  it('toont geen waardeontwikkeling, want die is niet ingevuld', () => {
    const direct = box3Vergelijking(invoer, { bedrag: 3_000 })
    expect(direct.werkelijk.waardeontwikkeling).toBeNull()
  })

  it('zet een zelf ingevuld verlies op nul', () => {
    const r = box3Vergelijking(invoer, { bedrag: -12_000 })
    expect(r.werkelijk.rendement).toBe(0)
    expect(r.werkelijk.opNulGezet).toBe(true)
    expect(r.belasting).toBe(0)
    expect(r.geldt).toBe('werkelijk')
  })
})

describe('artikel 5.26, derde lid: de schuldendrempel geldt niet bij het tegenbewijs', () => {
  // Wettekst: "Bij het bepalen van het werkelijke rendement van bezittingen en
  // schulden zijn de artikelen 5.3, derde lid, onderdeel f, 5.10, onderdelen a en
  // d, en 5.13 niet van toepassing." Onderdeel f is de schuldendrempel.
  // Aangewezen door Hendrik op 8 september 2026 en nagelezen in het gewijzigd
  // voorstel van wet (Kamerstukken I 2024/25, 36 706, A).
  it('trekt de volledige betaalde rente af, ook onder de drempel van € 3.800', () => {
    const zonderRente = werkelijkRendement({
      reguliereVoordelen: 10_000,
      waardeBegin: 300_000, waardeEind: 300_000,
      aankopen: 0, verkopen: 0, renteSchulden: 0,
    })
    const metRente = werkelijkRendement({
      reguliereVoordelen: 10_000,
      waardeBegin: 300_000, waardeEind: 300_000,
      aankopen: 0, verkopen: 0, renteSchulden: 3_800,
    })
    // Precies € 3.800 lager. Zou de drempel hier gelden, dan was het verschil nul.
    expect(zonderRente.rendement - metRente.rendement).toBe(3_800)
  })

  it('past de drempel aan de forfaitkant juist wél toe', () => {
    // Dezelfde € 3.800 doet aan die kant niets, want daar geldt onderdeel f wel.
    const zonder = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 300_000, beleggingen: 0, overigeBezittingen: 0, schulden: 0,
    })
    const met = box3Forfait({
      jaar: 2026, fiscaalPartner: false,
      banktegoeden: 300_000, beleggingen: 0, overigeBezittingen: 0, schulden: 3_800,
    })
    expect(met.aftrekbareSchulden).toBe(0)
    expect(met.belasting).toBe(zonder.belasting)
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * Box 3 per jaar in de FO-planner
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Openstaand punt 2 uit de audit van 7 september 2026: de planner trok een vast
 * percentage van het rendement af over de hele looptijd. Dat kan niet kloppen,
 * want door het heffingsvrije vermogen loopt de druk op met de omvang van het
 * vermogen. Sinds september 2026 schakelt vermogensbelastingHandmatig tussen
 * "reken het per jaar uit" (false) en "ik vul zelf een percentage in" (true).
 *
 * De fixtures staan op true met 0%, zodat alle golden values van vóór deze
 * wijziging onveranderd blijven. Dat is geen toeval maar de reden dat die twee
 * velden daar expliciet staan.
 */
describe('box 3 per jaar in de planner', () => {
  it('haalt de heffing van het vermogen af zodra hij aanstaat', () => {
    const zonder = calculatePension(baseInputs(), { currentYear: 2026 })
    const met = calculatePension(
      baseInputs({ vermogensbelastingHandmatig: false }), { currentYear: 2026 })
    expect(met.projectedCapital).toBeLessThan(zonder.projectedCapital)
  })

  it('heft niets zolang het vermogen onder de vrijstelling blijft', () => {
    // Reëel rendement nul en geen inleg, dus het vermogen blijft op € 40.000
    // staan. Dat is minder dan de vrijstelling van € 59.357, dus de uitkomst
    // moet gelijk zijn aan die zonder heffing. Zo niet, dan wordt er ergens over
    // de volle grondslag geheven in plaats van over het deel erboven.
    const invoer = {
      currentCapital: 40_000, monthlyContribution: 0,
      returnBeforeRetirement: 2.5, returnAfterRetirement: 2.5, inflation: 2.5,
    }
    const zonder = calculatePension(baseInputs(invoer), { currentYear: 2026 })
    const met = calculatePension(
      baseInputs({ ...invoer, vermogensbelastingHandmatig: false }), { currentYear: 2026 })
    expect(met.projectedCapital).toBeCloseTo(zonder.projectedCapital, 6)

    // Het benodigde vermogen verandert wél, en dat hoort zo: dat is het bedrag
    // dat het gewenste inkomen moet dragen, en dat ligt hier rond een miljoen.
    // Daar heft box 3 gewoon. Alleen het opgebouwde vermogen blijft onder de
    // vrijstelling.
    expect(met.requiredCapital).toBeGreaterThan(zonder.requiredCapital)
  })

  it('drukt zwaarder dan het vaste percentage dat bij het STARTvermogen hoort', () => {
    // Dit is de kern van de auditbevinding. Bij € 100.000 is de geschatte druk
    // 0,9 procentpunt, en met dat percentage rekende de planner de hele looptijd
    // door. Het vermogen groeit in dit scenario naar het meervoudige daarvan, en
    // dan is de werkelijke druk hoger. Wie met het startpercentage rekent komt
    // dus te gunstig uit.
    const vastPercentage = calculatePension(
      baseInputs({
        vermogensbelastingHandmatig: true,
        vermogensbelastingPct: box3DrukAfgerond(100_000, 'alleenstaand', 2026),
      }), { currentYear: 2026 })
    const perJaar = calculatePension(
      baseInputs({ vermogensbelastingHandmatig: false }), { currentYear: 2026 })
    expect(perJaar.projectedCapital).toBeLessThan(vastPercentage.projectedCapital)
  })

  it('verhoogt het benodigde vermogen, want de heffing loopt in de uitkeringsfase door', () => {
    const zonder = calculatePension(baseInputs(), { currentYear: 2026 })
    const met = calculatePension(
      baseInputs({ vermogensbelastingHandmatig: false }), { currentYear: 2026 })
    expect(met.requiredCapital).toBeGreaterThan(zonder.requiredCapital)
  })

  it('telt niet dubbel: het ingevulde percentage doet niets zodra de heffing aanstaat', () => {
    // Anders zou iemand die eerst zelf 1,9% invulde en daarna overschakelt naar
    // "reken het uit" allebei betalen.
    const a = calculatePension(
      baseInputs({ vermogensbelastingHandmatig: false, vermogensbelastingPct: 0 }),
      { currentYear: 2026 })
    const b = calculatePension(
      baseInputs({ vermogensbelastingHandmatig: false, vermogensbelastingPct: 1.9 }),
      { currentYear: 2026 })
    expect(b.projectedCapital).toBe(a.projectedCapital)
  })

  it('werkt ook in Monte Carlo, en verlaagt daar de slagingskans', () => {
    const rng = () => 0.5 // vaste trekking, dan is het verschil alleen de heffing
    const zonder = runMonteCarlo(baseInputs(), { rng, currentYear: 2026 })
    const met = runMonteCarlo(
      baseInputs({ vermogensbelastingHandmatig: false }), { rng, currentYear: 2026 })
    expect(met.successRate).toBeLessThanOrEqual(zonder.successRate)
  })
})

describe('planner en rekentool rekenen met dezelfde fiscale logica', () => {
  // box3HeffingPerJaar() rondt bewust niet af op hele euro's: een projectie van
  // veertig jaar is geen aanslag, en per jaar afronden zou er een systematische
  // afwijking in leggen. De rekentool op /tools/box3 rondt wél af, want die moet
  // hetzelfde bedrag geven als de Belastingdienst. Deze toets bewaakt dat het
  // verschil daartoe beperkt blijft en dat de twee niet echt uiteenlopen.
  // De afwijking komt van het afkappen van het aandeel op twee decimalen en
  // schaalt dus mee met het vermogen. Een vaste marge in euro's zou bij een
  // groot vermogen ten onrechte omvallen; vandaar een relatieve grens.
  const gevallen = [100_000, 250_000, 600_000, 1_000_000, 2_500_000]
  for (const vermogen of gevallen) {
    it(`wijkt alleen door afronding af bij EUR ${vermogen}`, () => {
      const planner = box3HeffingPerJaar(vermogen, 'alleenstaand', 2026)
      const tool = box3Forfait({
        jaar: 2026, fiscaalPartner: false,
        banktegoeden: 0, beleggingen: vermogen, overigeBezittingen: 0, schulden: 0,
      }).belasting
      // Twee bronnen van verschil, en geen andere: het afronden naar hele euro's
      // (hooguit een euro) en het afkappen van het aandeel op twee decimalen
      // (hooguit een promille van het bedrag). Wordt dit ooit groter, dan rekenen
      // de planner en de rekentool niet meer met dezelfde fiscale logica.
      expect(Math.abs(planner - tool)).toBeLessThan(1 + tool * 0.001)
    })
  }
})
