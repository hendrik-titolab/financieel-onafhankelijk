// De regel onder de slagingskansmeter is drie keer gesneuveld op hetzelfde punt: er
// stond een interpretatie in plaats van een feit. Eerst een vaste breuk "1 op de 3
// niet" die alleen bij 66,7% klopte (bevinding 16 september 2026). Daarna "de meeste
// niet" voor alles onder de 60%, wat bij 55% een onjuiste bewering was en bij 1,7%
// las alsof het net niet lukte (bevinding 20 september 2026). Sinds 20 september
// staat er één zin die simpelweg het cijfer noemt, zonder banden en zonder oordeel.
//
// Deze tests bewaken twee dingen: dat er nooit meer een omschrijving in die regel
// sluipt, en dat de Nederlandse notatie klopt.
import { describe, it, expect } from 'vitest'
import { slagingskansTekst, slagingskansPercentage } from '../slagingskansTekst'

describe('slagingskansPercentage — Nederlandse notatie', () => {
  // Het component gebruikte toFixed(1) en zette daarmee "14.0%" met een Engelse
  // punt op een Nederlandse site. Hendrik zag dat op 20 september op het scherm.
  it('gebruikt een komma en geen punt', () => {
    expect(slagingskansPercentage(14)).toBe('14,0%')
    expect(slagingskansPercentage(1.7)).toBe('1,7%')
  })

  it('toont altijd precies één decimaal', () => {
    expect(slagingskansPercentage(0)).toBe('0,0%')
    expect(slagingskansPercentage(100)).toBe('100,0%')
    expect(slagingskansPercentage(74.14)).toBe('74,1%')
    expect(slagingskansPercentage(74.15)).toBe('74,2%')
  })
})

describe('slagingskansTekst — noemt het cijfer en verder niets', () => {
  const gevallen = [0, 1.7, 8.25, 14, 30, 49.9, 50, 55, 60, 66.7, 74.1, 80, 95, 100]

  for (const v of gevallen) {
    it(`zegt bij ${v} precies wat de kans is`, () => {
      expect(slagingskansTekst(v)).toBe(`Kans op halen doel is ${slagingskansPercentage(v)}`)
    })
  }

  it('geeft over de hele schaal dezelfde zin, dus geen banden meer', () => {
    // Elk heel procent van 0 tot 100 moet hetzelfde sjabloon volgen. Zou iemand
    // opnieuw een band inbouwen ("de meeste niet", "1 op de N", "zeer klein"), dan
    // valt deze test om.
    for (let v = 0; v <= 100; v++) {
      expect(slagingskansTekst(v)).toMatch(/^Kans op halen doel is \d{1,3},\d%$/)
    }
  })

  it('bevat geen van de omschrijvingen die eerder fout bleken', () => {
    const verboden = ['de meeste niet', '1 op de', 'zeer klein', '50/50', 'scenario']
    for (let v = 0; v <= 100; v += 0.5) {
      const tekst = slagingskansTekst(v)
      for (const woord of verboden) {
        expect(tekst).not.toContain(woord)
      }
    }
  })
})
