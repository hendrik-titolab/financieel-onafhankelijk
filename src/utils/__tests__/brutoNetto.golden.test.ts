// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
//
// Waarom deze inkomens: naast drie ronde bedragen (25.000 / 50.000 / 140.000, dezelfde
// die in de live tests van fase 3 zijn gebruikt) staan hier alle knikpunten waar de
// formule van tak verandert. Een fout in een schijfgrens of een afbouwpercentage
// verschuift juist daar het eerst zichtbaar:
//   11.965 / 25.845 / 45.592 / 45.593  knikken van de arbeidskorting
//   29.736                             begin afbouw algemene heffingskorting
//   38.883 / 78.426                    schijfgrenzen box 1
//   132.920                            arbeidskorting nihil (zie A10)
//   0                                  randgeval, geen inkomen
//
// Let op bij E4: dit rekent uitsluitend met de tarieven en kortingen van vóór de
// AOW-leeftijd. Zodra er een post-AOW-variant komt, hoort daar een eigen set bij.
import { describe, it, expect } from 'vitest'
import { brutoNaarNetto, nettoNaarBruto, belastingBox1 } from '../brutoNetto'
import { BOX1_POST_AOW, HEFFINGSKORTING_POST_AOW } from '../../config/fiscaleParameters'
import { round } from './fixtures'
import fixture from './__golden__/brutoNetto.golden.json'

const BRUTO = [0, 11965, 25000, 25845, 29736, 38883, 45592, 45593, 50000, 78426, 132920, 140000]
const NETTO = [20000, 35000, 60000]

function pick(r: ReturnType<typeof brutoNaarNetto>) {
  return {
    brutoJaar: round(r.brutoJaar, 2),
    belastingBruto: round(r.belastingBruto, 2),
    ahk: round(r.ahk, 2),
    ak: round(r.ak, 2),
    kortingenBenut: round(r.kortingenBenut, 2),
    teBetalen: round(r.teBetalen, 2),
    nettoJaar: round(r.nettoJaar, 2),
    drukPct: round(r.druk * 100, 3),
    aantalSchijven: r.schijfDetail.length,
  }
}

describe('brutoNaarNetto — golden master', () => {
  for (const b of BRUTO) {
    const key = `bruto_${b}`
    it(key, () => {
      expect(pick(brutoNaarNetto(b))).toEqual((fixture as Record<string, any>)[key])
    })
  }
})

describe('nettoNaarBruto — golden master', () => {
  for (const n of NETTO) {
    const key = `netto_${n}`
    it(key, () => {
      expect(pick(nettoNaarBruto(n))).toEqual((fixture as Record<string, any>)[key])
    })
  }
})

// Geen golden master maar een eigenschap die altijd moet gelden, ongeacht welke
// tarieven er in de config staan. Deze test blijft dus ook na een fix zinvol.
describe('brutoNaarNetto — eigenschappen', () => {
  it('nettoNaarBruto is de inverse van brutoNaarNetto', () => {
    for (const netto of NETTO) {
      const bruto = nettoNaarBruto(netto).brutoJaar
      expect(round(brutoNaarNetto(bruto).nettoJaar, 0)).toBe(netto)
    }
  })

  it('netto stijgt niet sneller dan bruto', () => {
    for (let b = 1000; b <= 150000; b += 1000) {
      const hier = brutoNaarNetto(b).nettoJaar
      const straks = brutoNaarNetto(b + 1000).nettoJaar
      expect(straks).toBeGreaterThan(hier)
      expect(straks - hier).toBeLessThanOrEqual(1000)
    }
  })
})

// ── Fase-bewuste variant (E4), nog niet in gebruik in de tools ────────────────

const POST_AOW_INKOMENS = [0, 15000, 25000, 38883, 46002, 50000, 59783, 78426, 100000]

function pickPost(r: ReturnType<typeof belastingBox1>) {
  return {
    brutoJaar: round(r.brutoJaar, 2),
    belastingBruto: round(r.belastingBruto, 2),
    ahk: round(r.ahk, 2),
    ak: round(r.ak, 2),
    ouderenkorting: round(r.ouderenkorting, 2),
    alleenstaandeouderenkorting: round(r.alleenstaandeouderenkorting, 2),
    kortingenBenut: round(r.kortingenBenut, 2),
    teBetalen: round(r.teBetalen, 2),
    nettoJaar: round(r.nettoJaar, 2),
    drukPct: round(r.druk * 100, 3),
  }
}

describe('belastingBox1 na de AOW-leeftijd — golden master', () => {
  for (const i of POST_AOW_INKOMENS) {
    it(`postAow_${i}`, () => {
      expect(pickPost(belastingBox1(i, { pastAow: true, arbeidsinkomen: 0 })))
        .toEqual((fixture as Record<string, any>)[`postAow_${i}`])
    })
    it(`postAow_alleenstaand_${i}`, () => {
      expect(pickPost(belastingBox1(i, { pastAow: true, arbeidsinkomen: 0, alleenstaand: true })))
        .toEqual((fixture as Record<string, any>)[`postAow_alleenstaand_${i}`])
    })
  }
})

describe('belastingBox1 — eigenschappen', () => {
  it('is identiek aan brutoNaarNetto voor iemand onder de AOW-leeftijd', () => {
    for (const b of [0, 25000, 50000, 140000]) {
      expect(belastingBox1(b, { pastAow: false })).toEqual(brutoNaarNetto(b))
    }
  })

  it('geen arbeidsinkomen betekent geen arbeidskorting', () => {
    expect(belastingBox1(50000, { pastAow: true, arbeidsinkomen: 0 }).ak).toBe(0)
    expect(belastingBox1(50000, { pastAow: true }).ak).toBeGreaterThan(0)
  })

  it('de alleenstaandeouderenkorting scheelt precies haar eigen bedrag', () => {
    const zonder = belastingBox1(50000, { pastAow: true, arbeidsinkomen: 0 })
    const met = belastingBox1(50000, { pastAow: true, arbeidsinkomen: 0, alleenstaand: true })
    expect(round(met.nettoJaar - zonder.nettoJaar, 2))
      .toBe(HEFFINGSKORTING_POST_AOW.alleenstaandeouderenkorting)
  })

  it('geldt alleen na de AOW-leeftijd', () => {
    const r = belastingBox1(50000, { pastAow: false, alleenstaand: true })
    expect(r.ouderenkorting).toBe(0)
    expect(r.alleenstaandeouderenkorting).toBe(0)
  })

  // Dit is het cijfer dat in FISCALE-BRONNEN.md en het bronbestand genoemd wordt.
  // Onafhankelijk narekenen is hier belangrijker dan elders: het is de reden dat
  // de FO-planner de belastingdruk van een gepensioneerde nu onderschat.
  it('het marginale tarief piekt op 55,8% tussen de twee afbouwgrenzen', () => {
    const verwacht = BOX1_POST_AOW.schijf2Tarief
      + HEFFINGSKORTING_POST_AOW.ouderenkorting.afbouwPct
      + HEFFINGSKORTING_POST_AOW.algemeneHeffingskorting.afbouwPct
    expect(round(verwacht * 100, 3)).toBe(55.755)

    const opties = { pastAow: true, arbeidsinkomen: 0 }
    const hier = belastingBox1(50000, opties).nettoJaar
    const straks = belastingBox1(51000, opties).nettoJaar
    const marginaal = 1 - (straks - hier) / 1000
    expect(round(marginaal * 100, 1)).toBe(round(verwacht * 100, 1))
    expect(round(marginaal * 100, 1)).toBe(55.8)
  })

  // Let op bij het kiezen van een meetinterval: onder ongeveer € 20.300 zijn de
  // kortingen hoger dan de berekende belasting en wordt er dus niets betaald. Het
  // gemeten marginale tarief is daar de overgang uit dat gebied, niet het
  // schijftarief. Vandaar 25.000 en niet 20.000.
  it('onder de eerste afbouwgrens is het marginale tarief gewoon het schijftarief', () => {
    const opties = { pastAow: true, arbeidsinkomen: 0 }
    const hier = belastingBox1(25000, opties).nettoJaar
    const straks = belastingBox1(26000, opties).nettoJaar
    const marginaal = 1 - (straks - hier) / 1000
    expect(round(marginaal * 100, 2)).toBe(round(BOX1_POST_AOW.schijf1Tarief * 100, 2))
  })

  it('bij een laag pensioen wordt er per saldo geen belasting betaald', () => {
    const r = belastingBox1(18000, { pastAow: true, arbeidsinkomen: 0 })
    expect(r.teBetalen).toBe(0)
    expect(r.nettoJaar).toBe(18000)
  })
})
