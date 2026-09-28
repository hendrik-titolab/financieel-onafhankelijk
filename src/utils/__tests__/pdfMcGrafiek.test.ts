// De twee Monte Carlo-grafieken in de PDF (28 september 2026) delen één schaal, anders
// is een tegenvallend scenario niet te zien: elke grafiek zou zijn eigen hoogste punt
// tot bovenrand maken.
import { describe, it, expect } from 'vitest'
import { gezamenlijkeSchaal, asBedrag } from '../pdfMcGrafiek'

const punt = (age: number, p90: number) => ({ age, p10: 0, p25: 0, p50: p90 / 2, p75: p90 * 0.8, p90 })

describe('gezamenlijkeSchaal', () => {
  it('neemt de ruimste leeftijden en de hoogste P90 van beide reeksen', () => {
    const zonder = [punt(45, 100), punt(90, 500_000)]
    const met = [punt(45, 100), punt(95, 300_000)]
    expect(gezamenlijkeSchaal([zonder, met])).toEqual({ xMin: 45, xMax: 95, yMax: 500_000 })
  })

  it('valt bij alleen nullen niet om op een deling door nul', () => {
    expect(gezamenlijkeSchaal([[punt(40, 0)]]).yMax).toBe(1)
  })
})

describe('asBedrag', () => {
  it('schrijft bedragen kort en in Nederlandse notatie', () => {
    expect(asBedrag(538_123)).toBe('€ 538.000')
    expect(asBedrag(1_250_000)).toBe('€ 1,3 mln')
    expect(asBedrag(0)).toBe('€ 0')
  })
})
