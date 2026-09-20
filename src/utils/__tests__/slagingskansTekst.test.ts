// De regel onder de slagingskansmeter is drie keer gesneuveld op hetzelfde punt: er
// stond een interpretatie in plaats van een feit. Eerst een vaste breuk "1 op de 3
// niet" die alleen bij 66,7% klopte (bevinding 16 september 2026). Daarna "de meeste
// niet" voor alles onder de 60%, wat bij 55% een onjuiste bewering was en bij 1,7%
// las alsof het net niet lukte (bevinding 20 september 2026). Sinds 20 september
// staat er alleen nog een label onder het percentage, zonder banden en zonder oordeel.
import { describe, it, expect } from 'vitest'
import { SLAGINGSKANS_LABEL, slagingskansPercentage } from '../slagingskansTekst'

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

  it('bevat nergens een punt als decimaalteken', () => {
    for (let v = 0; v <= 100; v += 0.1) {
      expect(slagingskansPercentage(v)).not.toContain('.')
    }
  })
})

describe('SLAGINGSKANS_LABEL — benoemt het getal, omschrijft de kans niet', () => {
  it('is het label dat onder het percentage staat', () => {
    expect(SLAGINGSKANS_LABEL).toBe('Kans op halen doel')
  })

  // Het percentage staat er als groot getal al boven. Zou het hier ook nog staan,
  // dan toont de kaart hetzelfde cijfer twee keer.
  it('herhaalt het percentage niet', () => {
    expect(SLAGINGSKANS_LABEL).not.toMatch(/\d/)
    expect(SLAGINGSKANS_LABEL).not.toContain('%')
  })

  // Deze valt om zodra iemand opnieuw een omschrijving van de kans invoert.
  it('bevat geen van de omschrijvingen die eerder fout bleken', () => {
    for (const woord of ['de meeste niet', '1 op de', 'zeer klein', '50/50', 'scenario']) {
      expect(SLAGINGSKANS_LABEL).not.toContain(woord)
    }
  })
})
