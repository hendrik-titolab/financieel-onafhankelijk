// Scenario's (28 september 2026): stresstests die alleen de invoer aanpassen. Deze
// toetsen leggen per scenario vast wat er verandert en wat niet, en dat beide
// rekenkernen het effect in dezelfde richting zien.
import { describe, it, expect } from 'vitest'
import { GEEN_SCENARIO, pasScenarioToe, heeftScenario, scenarioOmschrijving } from '../scenarios'
import type { Scenarios } from '../scenarios'
import { calculatePension } from '../pensionCalc'
import { runMonteCarlo } from '../monteCarlo'
import { makeRng } from '../rng'
import { baseInputs } from './fixtures'

const basis = baseInputs({
  employerPension: 1000, lijfrenteUitkering: 500,
  partner: {
    actief: true, leeftijd: 45, aowMaandBedragNetto: 1084, aowStartAge: 67,
    employerPension: 800, employerPensionStartAge: 67,
  },
  woonsituatie: 'samenwonend', aowMaandBedragNetto: 1084,
})
const met = (deel: Partial<Scenarios>) => pasScenarioToe(basis, { ...GEEN_SCENARIO, ...deel })
const Y = { currentYear: 2026 }

describe('pasScenarioToe — alleen de bedoelde invoer verandert', () => {
  it('zonder scenario is de invoer exact dezelfde', () => {
    expect(pasScenarioToe(basis, GEEN_SCENARIO)).toBe(basis)
    expect(heeftScenario(GEEN_SCENARIO)).toBe(false)
  })

  it('AOW gehalveerd en verdwenen, voor beide partners', () => {
    expect(met({ aow: 'gehalveerd' }).aowMaandBedragNetto).toBe(542)
    expect(met({ aow: 'gehalveerd' }).partner.aowMaandBedragNetto).toBe(542)
    expect(met({ aow: 'verdwenen' }).aowMaandBedragNetto).toBe(0)
    expect(met({ aow: 'verdwenen' }).partner.aowMaandBedragNetto).toBe(0)
  })

  it('rendement 2 procentpunt lager of hoger, voor en na de pensioendatum', () => {
    expect(met({ rendement: 'lager' }).returnBeforeRetirement).toBe(basis.returnBeforeRetirement - 2)
    expect(met({ rendement: 'lager' }).returnAfterRetirement).toBe(basis.returnAfterRetirement - 2)
    expect(met({ rendement: 'hoger' }).returnBeforeRetirement).toBe(basis.returnBeforeRetirement + 2)
  })

  it('inflatie 1 procentpunt lager of hoger, rendement ongewijzigd', () => {
    expect(met({ inflatie: 'hoger' }).inflation).toBeCloseTo(basis.inflation + 1, 10)
    expect(met({ inflatie: 'lager' }).inflation).toBeCloseTo(basis.inflation - 1, 10)
    expect(met({ inflatie: 'hoger' }).returnBeforeRetirement).toBe(basis.returnBeforeRetirement)
  })

  it('langer leven: 5 jaar langer plannen', () => {
    expect(met({ langerLeven: true }).lifeExpectancy).toBe(basis.lifeExpectancy + 5)
  })

  it('geen indexatie: alle aanvullende pensioenen vast, de AOW niet aangeraakt', () => {
    const s = met({ geenIndexatie: true })
    expect(s.employerPensionIndexatie).toBe('vast')
    expect(s.lijfrenteIndexatie).toBe('vast')
    expect(s.partner.employerPensionIndexatie).toBe('vast')
    expect(s.aowMaandBedragNetto).toBe(basis.aowMaandBedragNetto)
  })

  it('verandert de oorspronkelijke invoer niet', () => {
    const kopie = JSON.stringify(basis)
    met({ aow: 'verdwenen', rendement: 'lager', inflatie: 'hoger', langerLeven: true, geenIndexatie: true })
    expect(JSON.stringify(basis)).toBe(kopie)
  })

  it('omschrijft de actieve scenario\'s', () => {
    expect(scenarioOmschrijving({ ...GEEN_SCENARIO, aow: 'gehalveerd', rendement: 'lager' }))
      .toEqual(['AOW gehalveerd', 'rendement 2 procentpunt lager'])
  })
})

describe('scenario\'s — het effect gaat de goede kant op, in beide rekenkernen', () => {
  const doel = (deel: Partial<Scenarios>) => calculatePension(met(deel), Y).requiredCapital
  const kans = (deel: Partial<Scenarios>) =>
    runMonteCarlo(met(deel), { rng: makeRng(12345), currentYear: 2026 }).successRate
  const zonder = calculatePension(basis, Y).requiredCapital

  it('elk tegenvallend scenario verhoogt het benodigd vermogen', () => {
    expect(doel({ aow: 'gehalveerd' })).toBeGreaterThan(zonder)
    expect(doel({ aow: 'verdwenen' })).toBeGreaterThan(doel({ aow: 'gehalveerd' }))
    expect(doel({ rendement: 'lager' })).toBeGreaterThan(zonder)
    expect(doel({ inflatie: 'hoger' })).toBeGreaterThan(zonder)
    expect(doel({ langerLeven: true })).toBeGreaterThan(zonder)
    expect(doel({ geenIndexatie: true })).toBeGreaterThan(zonder)
  })

  it('meevallend rendement of lagere inflatie verlaagt het', () => {
    expect(doel({ rendement: 'hoger' })).toBeLessThan(zonder)
    expect(doel({ inflatie: 'lager' })).toBeLessThan(zonder)
  })

  it('de slagingskans daalt bij een tegenvaller', () => {
    const basisKans = runMonteCarlo(basis, { rng: makeRng(12345), currentYear: 2026 }).successRate
    expect(kans({ aow: 'verdwenen' })).toBeLessThan(basisKans)
    expect(kans({ rendement: 'lager' })).toBeLessThan(basisKans)
  })
})
