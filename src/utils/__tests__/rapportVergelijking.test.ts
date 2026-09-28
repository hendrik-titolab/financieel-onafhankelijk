// De export zet bij een scenario beide uitkomsten naast elkaar (28 september 2026).
// Deze toets legt vast dat elke kolom uit de eigen berekening komt en niet uit de
// andere.
import { describe, it, expect } from 'vitest'
import { vergelijkingsRegels } from '../rapportVergelijking'
import { calculatePension } from '../pensionCalc'
import { runMonteCarlo } from '../monteCarlo'
import { pasScenarioToe, GEEN_SCENARIO } from '../scenarios'
import { makeRng } from '../rng'
import { baseInputs } from './fixtures'

const doorreken = (inputs: ReturnType<typeof baseInputs>) => ({
  inputs,
  result: calculatePension(inputs, { currentYear: 2026 }),
  mc: runMonteCarlo(inputs, { rng: makeRng(1), currentYear: 2026 }),
})

describe('vergelijkingsRegels', () => {
  const eigen = baseInputs()
  const zonder = doorreken(eigen)
  const met = doorreken(pasScenarioToe(eigen, { ...GEEN_SCENARIO, aow: 'verdwenen', langerLeven: true }))
  const regels = vergelijkingsRegels(zonder, met)
  const regel = (label: string) => regels.find(r => r.label === label)!

  it('neemt elke kolom uit de eigen berekening', () => {
    expect(regel('Benodigd eindvermogen').zonder).toEqual({ soort: 'eur', bedrag: zonder.result.requiredCapital })
    expect(regel('Benodigd eindvermogen').met).toEqual({ soort: 'eur', bedrag: met.result.requiredCapital })
    expect(regel('Kans op volledig inkomensdoel').zonder).toEqual({ soort: 'kans', pct: zonder.mc.successRate })
    expect(regel('Kans op volledig inkomensdoel').met).toEqual({ soort: 'kans', pct: met.mc.successRate })
  })

  it('toont het verschoven einde van de planning bij langer leven', () => {
    expect(regel('Einde planning (leeftijd)').zonder).toEqual({ soort: 'tekst', tekst: '90' })
    expect(regel('Einde planning (leeftijd)').met).toEqual({ soort: 'tekst', tekst: '95' })
  })

  it('zonder AOW is het benodigd vermogen hoger dan met', () => {
    const b = regel('Benodigd eindvermogen')
    if (b.zonder.soort === 'eur' && b.met.soort === 'eur') expect(b.met.bedrag).toBeGreaterThan(b.zonder.bedrag)
  })
})
