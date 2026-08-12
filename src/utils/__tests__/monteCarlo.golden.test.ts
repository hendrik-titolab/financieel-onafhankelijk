// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
//
// Kanttekening: de scenario's '1_basis' en '4_negatief_bedrag_na_pensioendatum'
// geven hieronder BEIDE exact dezelfde successRate/successRate75/percentielen,
// ondanks dat scenario 4 een eenmalig bedrag van −€100.000 op leeftijd 75 bevat.
// Dat is bevinding E7 (monteCarlo.ts negeert eenmalige bedragen ná de
// pensioendatum) nu concreet met cijfers vastgelegd, niet gecorrigeerd.
import { describe, it, expect } from 'vitest'
import { runMonteCarlo } from '../monteCarlo'
import { makeRng } from '../rng'
import { SCENARIOS, round } from './fixtures'
import fixture from './__golden__/monteCarlo.golden.json'

const CASES = ['1_basis', '4_negatief_bedrag_na_pensioendatum'] as const

describe('runMonteCarlo — golden master', () => {
  for (const key of CASES) {
    it(key, () => {
      const mc = runMonteCarlo(SCENARIOS[key], { rng: makeRng(12345), currentYear: 2026 })
      const expected = (fixture as Record<string, any>)[key]
      const mid = Math.floor(mc.percentileData.length / 2)
      const pick = (p: (typeof mc.percentileData)[number]) => ({
        age: p.age, p10: round(p.p10), p25: round(p.p25), p50: round(p.p50), p75: round(p.p75), p90: round(p.p90),
      })

      expect(round(mc.successRate, 2)).toBe(expected.successRate)
      expect(round(mc.successRate75, 2)).toBe(expected.successRate75)
      expect(mc.percentileData.length).toBe(expected.percentileDataLength)
      expect(pick(mc.percentileData[0])).toEqual(expected.percentileFirst)
      expect(pick(mc.percentileData[mid])).toEqual(expected.percentileMiddle)
      expect(pick(mc.percentileData[mc.percentileData.length - 1])).toEqual(expected.percentileLast)
    })
  }

  it('determinisme: twee runs met dezelfde seed zijn identiek', () => {
    const a = runMonteCarlo(SCENARIOS['1_basis'], { rng: makeRng(12345), currentYear: 2026 })
    const b = runMonteCarlo(SCENARIOS['1_basis'], { rng: makeRng(12345), currentYear: 2026 })
    expect(a.successRate).toBe(b.successRate)
    expect(a.successRate75).toBe(b.successRate75)
    expect(a.percentileData).toEqual(b.percentileData)
  })

  it('bevestigt E7: een eenmalig bedrag na pensioendatum verandert de simulatie niet', () => {
    const withoutEvent = runMonteCarlo(SCENARIOS['1_basis'], { rng: makeRng(12345), currentYear: 2026 })
    const withEvent = runMonteCarlo(SCENARIOS['4_negatief_bedrag_na_pensioendatum'], { rng: makeRng(12345), currentYear: 2026 })
    // Golden master: dit IS het huidige (waarschijnlijk foute) gedrag — vandaar
    // toEqual, niet toBeGreaterThan. Verandert deze test ooit naar "niet gelijk",
    // dan is dat het bewijs dat E7 is opgelost.
    expect(withEvent.successRate).toEqual(withoutEvent.successRate)
    expect(withEvent.percentileData).toEqual(withoutEvent.percentileData)
  })
})
