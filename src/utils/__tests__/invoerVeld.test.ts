import { describe, it, expect } from 'vitest'
import { verwerkInvoer, terugvalVoor } from '../invoerVeld'

// Deel 2, C1: een leeg veld viel terug op de ondergrens. In de box 3-tool is die voor drie
// velden -100.000.000, dus een leeg veld werd min 100 miljoen en de belasting € 0.
describe('verwerkInvoer: wat een veld wordt als je het verlaat', () => {
  const box3Tegenbewijs = { min: -100_000_000, max: 100_000_000 }

  it('leeg veld met een negatieve ondergrens wordt 0, niet de ondergrens', () => {
    expect(verwerkInvoer('', box3Tegenbewijs).waarde).toBe(0)
    expect(verwerkInvoer('   ', box3Tegenbewijs).waarde).toBe(0)
  })

  it('onleesbare invoer wordt ook 0, met een melding', () => {
    const r = verwerkInvoer('abc', box3Tegenbewijs)
    expect(r.waarde).toBe(0)
    expect(r.fout).not.toBeNull()
  })

  it('een negatief bedrag mag gewoon in zo een veld', () => {
    expect(verwerkInvoer('-5.000', box3Tegenbewijs).waarde).toBe(-5_000)
  })

  it('bestaande velden gedragen zich gelijk: ondergrens 0 of geen ondergrens geeft 0', () => {
    expect(verwerkInvoer('', { min: 0, max: 100_000_000 }).waarde).toBe(0)
    expect(verwerkInvoer('', {}).waarde).toBe(0)
  })

  it('een ondergrens boven 0 blijft de terugval', () => {
    expect(verwerkInvoer('', { min: 18, max: 100 }).waarde).toBe(18)
  })

  it('een expliciete terugval gaat voor', () => {
    expect(verwerkInvoer('', { min: -10, terugval: 7 }).waarde).toBe(7)
  })

  it('leesbare invoer wordt begrensd zoals voorheen', () => {
    expect(verwerkInvoer('1.234', {}).waarde).toBe(1_234)
    expect(verwerkInvoer('200.000.000', box3Tegenbewijs).waarde).toBe(100_000_000)
  })

  it('terugvalVoor', () => {
    expect(terugvalVoor(-100_000_000)).toBe(0)
    expect(terugvalVoor(undefined)).toBe(0)
    expect(terugvalVoor(5)).toBe(5)
    expect(terugvalVoor(-5, -1)).toBe(-1)
  })
})
