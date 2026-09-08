// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
//
// Bevinding E7 is inmiddels opgelost: de scenario's '1_basis' en
// '4_negatief_bedrag_na_pensioendatum' gaven eerst exact dezelfde
// successRate/successRate75/percentielen, ondanks het eenmalige bedrag van
// −€100.000 op leeftijd 75 in scenario 4. Sinds monteCarlo.ts eenmalige bedragen
// in de uitkeringsfase toepast, lopen die twee uiteen. De test onderaan bewaakt
// dat, en zou weer moeten falen als de filtering ooit terugkeert.
import { describe, it, expect } from 'vitest'
import { runMonteCarlo } from '../monteCarlo'
import { makeRng } from '../rng'
import { SCENARIOS, baseInputs, round } from './fixtures'
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

  it('E7 opgelost: een eenmalig bedrag na pensioendatum verandert de simulatie wél', () => {
    const withoutEvent = runMonteCarlo(SCENARIOS['1_basis'], { rng: makeRng(12345), currentYear: 2026 })
    const withEvent = runMonteCarlo(SCENARIOS['4_negatief_bedrag_na_pensioendatum'], { rng: makeRng(12345), currentYear: 2026 })
    // Scenario 4 is scenario 1 plus een uitgave van −€100.000 op leeftijd 75.
    // Een uitgave kan de slagingskans nooit verhogen en het vermogen vanaf dat
    // moment nooit doen stijgen.
    expect(withEvent.successRate).toBeLessThanOrEqual(withoutEvent.successRate)
    expect(withEvent.percentileData).not.toEqual(withoutEvent.percentileData)

    // Vóór leeftijd 75 zijn de paden identiek, vanaf leeftijd 75 lager.
    const p50 = (r: typeof withEvent, age: number) =>
      r.percentileData.find(p => p.age === age)!.p50
    expect(p50(withEvent, 74)).toBeCloseTo(p50(withoutEvent, 74), 6)
    expect(p50(withEvent, 76)).toBeLessThan(p50(withoutEvent, 76))
  })
})

// Bevinding 4 uit de audit van 7 september 2026: de controle op negatief vermogen
// stond binnen de uitkeringstak, dus alleen ná de pensioendatum. Een uitgave die
// de pot in de opbouwfase onder nul duwde telde niet als mislukking; de pot dook
// negatief, groeide daarna gewoon door en het pad heette geslaagd.
describe('runMonteCarlo — liquiditeit in de opbouwfase', () => {
  // Het geval uit de audit: geen vermogen, nu € 10.000 uitgeven, volgend jaar
  // € 20.000 ontvangen, geen rendement en geen inkomensdoel. Er is nergens
  // gemodelleerd waarmee die eerste uitgave betaald wordt.
  const ongedekteUitgave = baseInputs({
    currentCapital: 0, monthlyContribution: 0,
    returnBeforeRetirement: 0, returnAfterRetirement: 0, inflation: 0,
    volatilityPre: 0, volatilityPost: 0,
    desiredRetirementIncome: 0, desiredRetirementIncomeType: 'netto',
    aowMaandBedragNetto: 0, employerPension: 0, lijfrenteUitkering: 0,
    lifeEvents: [
      { name: 'uitgave', amount: -10000, year: 2026 },
      { name: 'ontvangst', amount: 20000, year: 2027 },
    ],
  })

  it('telt een ongedekte uitgave vóór de pensioendatum als mislukking', () => {
    const mc = runMonteCarlo(ongedekteUitgave, { rng: makeRng(12345), currentYear: 2026 })
    expect(mc.successRate).toBe(0)
    expect(mc.successRate75).toBe(0)
  })

  it('slaagt wel zodra de uitgave gedekt is', () => {
    // Zelfde scenario, maar het geld staat er al. Dit bewijst dat het bovenstaande
    // resultaat aan de dekking ligt en niet aan de uitgave zelf.
    const mc = runMonteCarlo(
      { ...ongedekteUitgave, currentCapital: 10000 },
      { rng: makeRng(12345), currentYear: 2026 }
    )
    expect(mc.successRate).toBe(100)
  })
})
