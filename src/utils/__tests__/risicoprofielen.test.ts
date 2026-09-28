// De risicoprofielen worden sinds 28 september 2026 afgeleid uit twee bouwstenen in
// plaats van zelf gekozen (review 22 september 2026, punt 9). Deze toets rekent de
// afleiding na, zodat een handmatige wijziging in fiscale-cijfers.json die niet meer
// bij de bouwstenen past direct opvalt.
//
// Bronnen:
// - aandelen 8,0%: Deutsches Aktieninstitut, MSCI World-rendementsdriehoek stand
//   31 december 2025, gemiddeld 8,0% over 25 en 7,9% over 30 jaar spaarduur;
// - obligaties 3,5%: ECB-rentecurve eurozone, 10-jaars AAA, 21 september 2026;
// - volatiliteit 20% en 8%, correlatie 0: advies Commissie Parameters 2022,
//   tabel 2.8 en 2.9;
// - rekenkundig = meetkundig + ½σ²: art. 23a lid 6 Besluit financieel
//   toetsingskader pensioenfondsen.
import { describe, it, expect } from 'vitest'
import { RISICOPROFIELEN, PROFIEL_VOLGORDE } from '../../config/risicoprofielen'

const AANDELEN = { meetkundig: 8.0, volatiliteit: 20 }
const OBLIGATIES = { meetkundig: 3.5, volatiliteit: 8 }

/** Meetkundig rendement en volatiliteit van een mix, in procenten. */
function mix(aandelenDeel: number) {
  const halveVariantie = (s: number) => (s * s) / 200
  const rekenkundig =
    aandelenDeel * (AANDELEN.meetkundig + halveVariantie(AANDELEN.volatiliteit)) +
    (1 - aandelenDeel) * (OBLIGATIES.meetkundig + halveVariantie(OBLIGATIES.volatiliteit))
  // Correlatie 0, dus geen kruisterm.
  const volatiliteit = Math.sqrt(
    (aandelenDeel * AANDELEN.volatiliteit) ** 2 + ((1 - aandelenDeel) * OBLIGATIES.volatiliteit) ** 2
  )
  return { meetkundig: rekenkundig - halveVariantie(volatiliteit), volatiliteit }
}

const round1 = (x: number) => Math.round(x * 10) / 10

// Vóór de pensioendatum 10/30/50/70/90% aandelen, erna telkens een stap defensiever.
const VOOR = [0.1, 0.3, 0.5, 0.7, 0.9]
const NA = [0.0, 0.1, 0.3, 0.5, 0.7]

describe('risicoprofielen — afgeleid uit de bouwstenen', () => {
  PROFIEL_VOLGORDE.forEach((naam, i) => {
    it(naam, () => {
      const p = RISICOPROFIELEN[naam]
      const voor = mix(VOOR[i])
      const na = mix(NA[i])
      expect(p.rendementVoor).toBe(round1(voor.meetkundig))
      expect(p.volatiliteitVoor).toBe(round1(voor.volatiliteit))
      expect(p.rendementNa).toBe(round1(na.meetkundig))
      expect(p.volatiliteitNa).toBe(round1(na.volatiliteit))
    })
  })

  it('zeer offensief blijft onder het gemiddelde voor 100% aandelen', () => {
    expect(RISICOPROFIELEN.zeer_offensief.rendementVoor).toBeLessThanOrEqual(AANDELEN.meetkundig)
  })
})
