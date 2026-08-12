// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
//
// Kanttekening bij scenario 2 en 6: requiredMonthlyContribution kan negatief zijn
// (zie AUDIT-fase0-1-feiten.md, bevinding E10) — dat is hier bewust vastgelegd
// zoals het nu is, niet gecorrigeerd.
import { describe, it, expect } from 'vitest'
import { calculatePension } from '../pensionCalc'
import type { YearData } from '../../types'
import { SCENARIOS, round } from './fixtures'
import fixture from './__golden__/pensionCalc.golden.json'

function roundYearRow(yd: YearData) {
  return {
    age: yd.age,
    year: yd.year,
    phase: yd.phase,
    capital: round(yd.capital),
    incomeFromCapital: round(yd.incomeFromCapital),
    aowIncome: round(yd.aowIncome),
    employerIncome: round(yd.employerIncome),
    totalIncome: round(yd.totalIncome),
  }
}

describe('calculatePension — golden master', () => {
  for (const [key, inputs] of Object.entries(SCENARIOS)) {
    it(key, () => {
      const r = calculatePension(inputs, { currentYear: 2026 })
      const expected = (fixture as Record<string, any>)[key]

      expect(round(r.projectedCapital)).toBe(expected.projectedCapital)
      expect(round(r.requiredCapital)).toBe(expected.requiredCapital)
      expect(round(r.desiredMonthlyNetto)).toBe(expected.desiredMonthlyNetto)
      expect(round(r.requiredMonthlyContribution)).toBe(expected.requiredMonthlyContribution)
      expect(round(r.surplusAtEnd)).toBe(expected.surplusAtEnd)
      expect(r.yearData.length).toBe(expected.yearDataLength)
      expect(roundYearRow(r.yearData[0])).toEqual(expected.yearDataFirst)
      expect(roundYearRow(r.yearData[r.yearData.length - 1])).toEqual(expected.yearDataLast)
    })
  }
})
