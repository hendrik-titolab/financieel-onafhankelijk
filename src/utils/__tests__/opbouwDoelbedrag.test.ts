// Review 22 september 2026, bevinding 3: de opbouw van het doelbedrag in de PDF en
// de Excel telde niet op. Deze toets rekent de regels van het rapport na.
import { describe, it, expect } from 'vitest'
import { calculatePension } from '../pensionCalc'
import { opbouwDoelbedrag } from '../opbouwDoelbedrag'
import { SCENARIOS, baseInputs } from './fixtures'

const som = (r: ReturnType<typeof calculatePension>) =>
  opbouwDoelbedrag(r).reduce((s, x) => s + x.bedrag, 0)

describe('opbouwDoelbedrag — de regels in het rapport tellen op', () => {
  it('stoppen op 68, erfenis op 73: met een regel overbrugging', () => {
    const r = calculatePension(baseInputs({
      currentAge: 45, retirementAge: 68, currentCapital: 0, monthlyContribution: 0,
      desiredRetirementIncome: 2500, lifeEvents: [{ name: 'erfenis', amount: 300000, year: 2054 }],
    }), { currentYear: 2026 })
    const regels = opbouwDoelbedrag(r)
    expect(regels.some(x => x.label.includes('overbrugging'))).toBe(true)
    expect(som(r)).toBeCloseTo(r.requiredCapital, 2)
  })

  it('box 3 per jaar, zonder eenmalige bedragen: met een regel box 3', () => {
    const r = calculatePension(baseInputs({ vermogensbelastingHandmatig: false }), { currentYear: 2026 })
    const regels = opbouwDoelbedrag(r)
    expect(regels.some(x => x.label.includes('box 3'))).toBe(true)
    expect(som(r)).toBeCloseTo(r.requiredCapital, 2)
  })

  it('niets uit te splitsen: geen regels', () => {
    const r = calculatePension(SCENARIOS['1_basis'], { currentYear: 2026 })
    expect(opbouwDoelbedrag(r)).toEqual([])
  })

  it('in alle standaardscenario\'s met box 3 aan', () => {
    for (const key of Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]) {
      const r = calculatePension({ ...SCENARIOS[key], vermogensbelastingHandmatig: false }, { currentYear: 2026 })
      const regels = opbouwDoelbedrag(r)
      if (regels.length > 0) expect(som(r)).toBeCloseTo(r.requiredCapital, 2)
    }
  })
})
