// Bevinding 10 uit de audit van 7 september 2026: de risicoprofielen werden in de
// UI aangeprezen als "netto na kosten en box 3", terwijl risicoprofielen.ts
// diezelfde getallen als nominaal documenteert en de rekenkern nergens iets
// aftrok. Het uitlegartikel sprak zichzelf binnen één alinea tegen.
import { describe, it, expect } from 'vitest'
import { box3HeffingPerJaar, geschatteBox3Druk, nettoNominaalRendement } from '../box3'
import { calculatePension } from '../pensionCalc'
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
      expect(Math.round(box3HeffingPerJaar(vermogen, 'alleenstaand'))).toBe(verwacht)
    })
  }

  it('heft niets onder het heffingsvrije vermogen', () => {
    expect(box3HeffingPerJaar(59357, 'alleenstaand')).toBe(0)
    expect(box3HeffingPerJaar(0, 'alleenstaand')).toBe(0)
  })

  it('gebruikt de hogere vrijstelling voor fiscaal partners', () => {
    expect(box3HeffingPerJaar(100000, 'samenwonend'))
      .toBeLessThan(box3HeffingPerJaar(100000, 'alleenstaand'))
  })
})

describe('geschatteBox3Druk', () => {
  it('loopt op met de omvang van het vermogen', () => {
    // Precies waarom één vast percentage niet voor iedereen kan kloppen, wat de
    // kern van de auditbevinding was: hetzelfde profiel kan voor EUR 40.000
    // spaargeld en EUR 2 miljoen beleggingen niet dezelfde belastingdruk zijn.
    const klein = geschatteBox3Druk(100000, 'alleenstaand')
    const groot = geschatteBox3Druk(1000000, 'alleenstaand')
    expect(klein).toBeCloseTo(0.88, 1)
    expect(groot).toBeCloseTo(2.03, 1)
    expect(groot).toBeGreaterThan(klein)
  })

  it('geeft nul bij geen vermogen', () => {
    expect(geschatteBox3Druk(0, 'alleenstaand')).toBe(0)
    expect(geschatteBox3Druk(-100, 'alleenstaand')).toBe(0)
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
