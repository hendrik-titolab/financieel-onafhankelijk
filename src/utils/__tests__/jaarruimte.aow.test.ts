// Review 28 september 2026, bevindingen 4 en 5. Het belastingvoordeel rekende altijd
// met de tarieven van vóór de AOW-leeftijd, terwijl er tot vijf jaar erna nog
// jaarruimte is. En voor 2021 en 2022 ging de toevoeging aan de oudedagsreserve
// niet van de jaarruimte af.
import { describe, it, expect } from 'vitest'
import {
  calculateJaarruimte, aowDatum, aowFaseInJaar, jaarruimteLeeftijdToegestaan,
  controleerJaarruimteInvoer, berekenJaarruimteEenvoudig,
} from '../jaarruimte'
import type { JaarruimteInputs } from '../../types'

const basis = (extra: Partial<JaarruimteInputs> = {}): JaarruimteInputs => ({
  year: 2026, income: 60_000, pensioenType: 'geen', factorA: 0, pensioenpremie: 0,
  alIngelegd: 0, reserveringsruimteRijen: [], clientName: '', adviseurNaam: '', notities: '',
  ...extra,
})

describe('aowDatum volgt de AOW-leeftijd van het jaar waarin je hem bereikt', () => {
  it('67 jaar in 2026', () => {
    expect(aowDatum('1959-03-15')?.toDateString()).toBe(new Date(2026, 2, 15).toDateString())
  })
  it('66 jaar en 10 maanden in 2023', () => {
    // 1 december 1956 + 66 jaar en 10 maanden = 1 oktober 2023
    expect(aowDatum('1956-12-01')?.toDateString()).toBe(new Date(2023, 9, 1).toDateString())
  })
  it('op de overgang van 2023 naar 2024 telt de leeftijd van 2024', () => {
    // + 66 jaar en 10 maanden zou april 2024 zijn, dus niet in 2023; + 67 jaar valt in 2024.
    expect(aowDatum('1957-06-15')?.toDateString()).toBe(new Date(2024, 5, 15).toDateString())
  })
  it('geeft de fase in een jaar', () => {
    expect(aowFaseInJaar('1959-03-15', 2026)).toEqual({ soort: 'in', maand: 3 })
    expect(aowFaseInJaar('1958-01-15', 2026)).toEqual({ soort: 'na' })
    expect(aowFaseInJaar('1990-01-01', 2026)).toEqual({ soort: 'voor' })
    expect(aowFaseInJaar(undefined, 2026)).toBeNull()
  })
})

describe('leeftijdsgrens van de jaarruimte', () => {
  it('valt samen met de grens die de Belastingdienst voor 2026 noemt', () => {
    // "Bent u geboren vóór 1 september 1953? Dan kunt u niet gebruikmaken van de
    // jaarruimte 2026." (belastingdienst.nl, aftrekken lijfrentepremies)
    expect(jaarruimteLeeftijdToegestaan('1953-09-01', 2026)).toBe(true)
    expect(jaarruimteLeeftijdToegestaan('1953-08-31', 2026)).toBe(false)
    expect(jaarruimteLeeftijdToegestaan('1980-01-01', 2026)).toBe(true)
    expect(jaarruimteLeeftijdToegestaan(undefined, 2026)).toBeNull()
  })
  it('waarschuwt, maar blokkeert niet', () => {
    const c = controleerJaarruimteInvoer(basis({ geboortedatum: '1950-01-01' }))
    expect(c.errors).toEqual([])
    expect(c.waarschuwingen.some(w => w.includes('te oud voor jaarruimte'))).toBe(true)
  })
})

describe('belastingvoordeel met de tarieven die bij de AOW-status horen', () => {
  it('zonder geboortedatum verandert er niets', () => {
    const zonder = calculateJaarruimte(basis())
    const jong = calculateJaarruimte(basis({ geboortedatum: '1990-01-01' }))
    expect(jong.belastingVoordeel).toBeCloseTo(zonder.belastingVoordeel, 9)
  })

  it('na de AOW-leeftijd, handmatig nagerekend bij € 60.000 in 2026', () => {
    // Jaarruimte 30% × (60.000 − 19.172) = 12.248,40, dus inkomen na aftrek 47.751,60.
    // Belasting na AOW-leeftijd, vóór aftrek:
    //   38.883 × 17,85% + 21.117 × 37,56%          = 14.872,1607
    //   AHK 1.556 − 3,195% × 30.264                =    589,0652
    //   AK  2.840 − 3,25% × (60.000 − 45.592)      =  2.371,74
    //   OK  0 (boven 59.782)
    //   te betalen                                 = 11.911,3555
    // Na aftrek (arbeidsinkomen blijft 60.000):
    //   38.883 × 17,85% + 8.868,60 × 37,56%        = 10.271,6617
    //   AHK 1.556 − 3,195% × 18.015,60             =    980,4016
    //   OK  2.067 − 15% × 1.749,60                 =  1.804,56
    //   te betalen 10.271,6617 − 980,4016 − 2.371,74 − 1.804,56 = 5.114,9601
    // Voordeel 11.911,3555 − 5.114,9601 = 6.796,3954
    const r = calculateJaarruimte(basis({ geboortedatum: '1958-01-15' }))
    expect(r.jaarruimte).toBeCloseTo(12_248.4, 6)
    expect(r.belastingVoordeel).toBeCloseTo(6_796.3954, 2)
  })

  it('in het AOW-jaar ligt het tussen januari en december in', () => {
    const jan = calculateJaarruimte(basis({ geboortedatum: '1959-01-15' }))
    const na = calculateJaarruimte(basis({ geboortedatum: '1958-01-15' }))
    // Januari: geen enkele maand vóór de AOW-leeftijd, dus gelijk aan heel het jaar erna.
    expect(jan.belastingVoordeel).toBeCloseTo(na.belastingVoordeel, 6)
    const dec = calculateJaarruimte(basis({ geboortedatum: '1959-12-15' }))
    expect(dec.belastingVoordeel).not.toBeCloseTo(jan.belastingVoordeel, 0)
  })

  it('kan ook lager uitvallen: bij € 45.000 is het voordeel na de AOW-leeftijd kleiner', () => {
    const voor = calculateJaarruimte(basis({ income: 45_000 }))
    const na = calculateJaarruimte(basis({ income: 45_000, geboortedatum: '1958-01-15' }))
    expect(na.belastingVoordeel).toBeLessThan(voor.belastingVoordeel)
  })
})

describe('oudedagsreserve in 2021 en 2022', () => {
  it('gaat van de jaarruimte af in 2022', () => {
    const zonder = calculateJaarruimte(basis({ year: 2022, income: 50_000 }))
    const met = calculateJaarruimte(basis({ year: 2022, income: 50_000, forVermindering: 1_000 }))
    // 13,3% × (50.000 − 12.837) = 4.942,68; min 1.000
    expect(zonder.jaarruimte).toBeCloseTo(4_942.679, 3)
    expect(met.jaarruimte).toBeCloseTo(3_942.679, 3)
  })
  it('doet niets vanaf 2023', () => {
    const zonder = calculateJaarruimte(basis({ year: 2023, income: 50_000 }))
    const met = calculateJaarruimte(basis({ year: 2023, income: 50_000, forVermindering: 1_000 }))
    expect(met.jaarruimte).toBe(zonder.jaarruimte)
  })
  it('geeft nooit een negatieve jaarruimte', () => {
    expect(calculateJaarruimte(basis({ year: 2021, income: 30_000, forVermindering: 99_999 })).jaarruimte).toBe(0)
  })
})

// Review 28 september 2026, de twee beperkingen die na PR #23 overbleven.
describe('arbeidsinkomen in het aftrekjaar', () => {
  it('telt alleen mee waar de kortingen de belasting opsouperen', () => {
    // € 30.000, AOW sinds 2025, geen arbeidsinkomen (alleen AOW en pensioen).
    // Jaarruimte 30% × (30.000 − 19.172) = 3.248,40; na aftrek 26.751,60.
    // Vóór aftrek: 30.000 × 17,85% = 5.355; AHK 1.556 − 3,195% × 264 = 1.547,5652;
    //   ouderenkorting 2.067; geen arbeidskorting; te betalen 1.740,4348.
    // Na aftrek: 26.751,60 × 17,85% = 4.775,1606; AHK 1.556; OK 2.067; te betalen 1.152,1606.
    // Voordeel 588,2742. Met het hele inkomen als arbeidsinkomen was het 0: de
    // arbeidskorting maakte de belasting al nul.
    const zonderArbeid = calculateJaarruimte(basis({
      income: 30_000, geboortedatum: '1958-01-15', aftrekjaarArbeidsinkomen: 0,
    }))
    expect(zonderArbeid.belastingVoordeel).toBeCloseTo(588.2742, 3)
    const heleInkomen = calculateJaarruimte(basis({ income: 30_000, geboortedatum: '1958-01-15' }))
    expect(heleInkomen.belastingVoordeel).toBe(0)
  })

  it('verandert niets bij een inkomen waar de belasting niet op nul komt', () => {
    const a = calculateJaarruimte(basis({ geboortedatum: '1958-01-15' }))
    const b = calculateJaarruimte(basis({ geboortedatum: '1958-01-15', aftrekjaarArbeidsinkomen: 0 }))
    expect(b.belastingVoordeel).toBeCloseTo(a.belastingVoordeel, 6)
  })
})

describe('de wizard voor eerdere jaren kent de oudedagsreserve', () => {
  it('trekt hem af tot en met 2022, daarna niet', () => {
    // 13,3% × (50.000 − 12.837) = 4.942,679
    expect(berekenJaarruimteEenvoudig(2022, 50_000, 'geen', 0, 0, 1_000)).toBeCloseTo(3_942.679, 3)
    expect(berekenJaarruimteEenvoudig(2022, 50_000, 'geen', 0, 0)).toBeCloseTo(4_942.679, 3)
    expect(berekenJaarruimteEenvoudig(2023, 50_000, 'geen', 0, 0, 1_000))
      .toBe(berekenJaarruimteEenvoudig(2023, 50_000, 'geen', 0, 0))
  })
  it('rekent hetzelfde als de hoofdberekening', () => {
    const hoofd = calculateJaarruimte(basis({ year: 2021, income: 55_000, forVermindering: 750 }))
    expect(berekenJaarruimteEenvoudig(2021, 55_000, 'geen', 0, 0, 750)).toBeCloseTo(hoofd.jaarruimte, 9)
  })
})
