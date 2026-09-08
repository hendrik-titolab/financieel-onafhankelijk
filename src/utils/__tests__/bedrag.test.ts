// Bevinding 8 uit de audit van 7 september 2026: de bedragvelden waren
// <input type="number"> met daarachter een parser die Nederlandse notatie
// verwachtte. In de testbrowser werd "50.000" correct 50000, maar "1.234,56" werd
// 1.23456 en bleef dat ook na het verlaten van het veld.
//
// De testgevallen hieronder zijn precies de reeks die de audit voorschrijft:
// 1234,56 | 1.234,56 | 50.000 | plakken | leeg | negatief | exponentnotatie |
// ongeldig formaat.
import { describe, it, expect } from 'vitest'
import { parseBedrag, parseBedragBegrensd, formatBedrag } from '../bedrag'

describe('parseBedrag — wat er gelezen moet worden', () => {
  const goed: [string, number][] = [
    ['1234', 1234],
    ['1234,56', 1234.56],
    ['1.234,56', 1234.56],
    ['50.000', 50000],
    ['1.234.567', 1234567],
    ['1.234.567,89', 1234567.89],
    ['0', 0],
    ['-250', -250],
    ['-1.500,50', -1500.5],
    // Een punt met één of twee cijfers erachter is in het Nederlands geen
    // duizendtalscheiding: iemand die bij een percentage 3.5 typt bedoelt 3,5.
    ['3.5', 3.5],
    ['12.50', 12.5],
  ]

  for (const [invoer, verwacht] of goed) {
    it(`leest "${invoer}" als ${verwacht}`, () => {
      const r = parseBedrag(invoer)
      expect(r.fout).toBeNull()
      expect(r.waarde).toBe(verwacht)
    })
  }

  it('accepteert een geplakt bedrag met euroteken en spaties', () => {
    // Zoals het uit een spreadsheet of bankafschrift komt, inclusief de harde
    // spatie die veel bronnen als duizendtalscheiding gebruiken.
    expect(parseBedrag('€ 1.234,56').waarde).toBe(1234.56)
    expect(parseBedrag('  50.000  ').waarde).toBe(50000)
    expect(parseBedrag('€50000').waarde).toBe(50000)
    expect(parseBedrag('+1234').waarde).toBe(1234)
  })
})

describe('parseBedrag — wat geweigerd moet worden', () => {
  it('geeft geen waarde en geen fout bij een leeg veld', () => {
    for (const leeg of ['', '   ', '-', '€']) {
      const r = parseBedrag(leeg)
      expect(r.waarde).toBeNull()
      expect(r.fout).toBeNull()
    }
  })

  const fout = [
    '1,2,3',      // twee komma's
    '1e5',        // exponentnotatie
    '1E5',
    '12,5%',      // teken achteraan
    'abc',
    '1.23',       // hmm: dit is juist geldig, staat hieronder apart
  ].filter(x => x !== '1.23')

  for (const invoer of fout) {
    it(`weigert "${invoer}" met een uitleg`, () => {
      const r = parseBedrag(invoer)
      expect(r.waarde).toBeNull()
      expect(r.fout).not.toBeNull()
    })
  }

  it('weigert exponentnotatie in plaats van er 100000 van te maken', () => {
    // parseFloat("1e5") geeft 100000. Dat is bijna nooit wat iemand in een
    // bedragveld bedoelt, en stilzwijgend accepteren is hier het gevaar.
    expect(parseBedrag('1e5').waarde).toBeNull()
  })

  it('weigert een tweede komma in plaats van hem af te kappen', () => {
    // parseFloat("1.2,3") geeft 1.2: een stille halvering van wat iemand typte.
    expect(parseBedrag('1,2,3').waarde).toBeNull()
  })

  it('weigert losse punten die geen duizendtalgroep vormen', () => {
    expect(parseBedrag('1.2345').waarde).toBeNull()
    expect(parseBedrag('12.3456').waarde).toBeNull()
  })
})

describe('parseBedragBegrensd', () => {
  it('trekt een te lage waarde bij en meldt dat', () => {
    const r = parseBedragBegrensd('-5', 0, 100)
    expect(r.waarde).toBe(0)
    expect(r.fout).toContain('Laagste')
  })

  it('trekt een te hoge waarde bij en meldt dat', () => {
    // Het geval uit bevinding A5: 99% rendement gaf een eindvermogen van
    // biljoenen zonder enige melding.
    const r = parseBedragBegrensd('99', 0, 15)
    expect(r.waarde).toBe(15)
    expect(r.fout).toContain('Hoogste')
  })

  it('laat een waarde binnen de grenzen met rust', () => {
    const r = parseBedragBegrensd('7,5', 0, 15)
    expect(r.waarde).toBe(7.5)
    expect(r.fout).toBeNull()
  })

  it('geeft de leesfout door in plaats van te begrenzen', () => {
    const r = parseBedragBegrensd('abc', 0, 15)
    expect(r.waarde).toBeNull()
    expect(r.fout).not.toBeNull()
  })
})

describe('formatBedrag', () => {
  it('schrijft terug in Nederlandse notatie', () => {
    expect(formatBedrag(1234.56)).toBe('1.234,56')
    expect(formatBedrag(50000)).toBe('50.000')
    expect(formatBedrag(-1500.5)).toBe('-1.500,5')
  })

  it('kan heen en weer zonder waardeverlies', () => {
    for (const v of [0, 1234.56, 50000, -250, 1234567.89, 3.5]) {
      expect(parseBedrag(formatBedrag(v)).waarde).toBe(v)
    }
  })
})
