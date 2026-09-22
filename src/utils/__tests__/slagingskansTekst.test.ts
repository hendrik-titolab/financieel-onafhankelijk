// De regel onder de slagingskansmeter is drie keer gesneuveld op hetzelfde punt: er
// stond een interpretatie in plaats van een feit. Eerst een vaste breuk "1 op de 3
// niet" die alleen bij 66,7% klopte (bevinding 16 september 2026). Daarna "de meeste
// niet" voor alles onder de 60%, wat bij 55% een onjuiste bewering was en bij 1,7%
// las alsof het net niet lukte (bevinding 20 september 2026). Sinds 20 september
// staat er alleen nog een label onder het percentage, zonder banden en zonder oordeel.
import { describe, it, expect } from 'vitest'
import { SLAGINGSKANS_LABEL, slagingskansPercentage } from '../slagingskansTekst'

describe('slagingskansPercentage — hele procenten', () => {
  // Eén decimaal suggereerde een precisie die 2.000 scenario's niet hebben: de
  // onzekerheid rond 50% is ongeveer 1,1 procentpunt (review 22 september 2026,
  // bevinding 7).
  it('rondt af op een heel percentage', () => {
    expect(slagingskansPercentage(14)).toBe('14%')
    expect(slagingskansPercentage(1.7)).toBe('2%')
    expect(slagingskansPercentage(74.4)).toBe('74%')
    expect(slagingskansPercentage(74.5)).toBe('75%')
    expect(slagingskansPercentage(0)).toBe('0%')
    expect(slagingskansPercentage(100)).toBe('100%')
  })

  // 99,6% is niet 100%: er faalt nog een scenario. En 0,4% is niet 0%.
  it('rondt aan de randen niet af naar een getal dat niet klopt', () => {
    expect(slagingskansPercentage(99.6)).toBe('> 99%')
    expect(slagingskansPercentage(0.4)).toBe('< 1%')
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
