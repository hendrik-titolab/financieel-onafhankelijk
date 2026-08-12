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
import { brutoNaarNetto, nettoNaarBruto } from '../brutoNetto'
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
