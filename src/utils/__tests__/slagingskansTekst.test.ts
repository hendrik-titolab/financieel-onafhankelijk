// Bevinding Hendrik, 16 september 2026: op de live site stond bij 74,1% de tekst
// "1 op de 3 niet", terwijl 100% - 74,1% = 25,9% faalkans overeenkomt met 1 op de
// 4. Het getal 3 stond vast voor de hele band 60-80% en klopte alleen precies bij
// 66,7%. Deze tests leggen vast dat de breuk nu meebeweegt met het percentage.
import { describe, it, expect } from 'vitest'
import { slagingskansOordeel } from '../slagingskansTekst'

describe('slagingskansOordeel — "1 op de N" volgt de daadwerkelijke faalkans', () => {
  it('geeft bij 74,1% (het gemelde geval) 1 op de 4, niet 1 op de 3', () => {
    // Faalkans 25,9%: 100 / 25,9 = 3,86..., afgerond 4.
    expect(slagingskansOordeel(74.1)).toBe('haalt dit; 1 op de 4 niet')
  })

  it('geeft bij precies 66,7% (faalkans 1/3) nog steeds 1 op de 3', () => {
    // Dit is het enige punt in de band waar de oude vaste tekst toevallig klopte.
    expect(slagingskansOordeel(66.7)).toBe('haalt dit; 1 op de 3 niet')
  })

  it('geeft bij 75% 1 op de 4 (faalkans exact 25%)', () => {
    expect(slagingskansOordeel(75)).toBe('haalt dit; 1 op de 4 niet')
  })

  it('geeft bij 79,9% 1 op de 5, niet nog steeds 1 op de 3', () => {
    // Faalkans 20,1%: 100 / 20,1 = 4,98..., afgerond 5. Bewijst dat de breuk
    // varieert binnen de band en niet ergens anders alsnog vastligt op 3.
    expect(slagingskansOordeel(79.9)).toBe('haalt dit; 1 op de 5 niet')
  })

  it('geeft bij de ondergrens van de band (60%) 1 op de 3', () => {
    // Faalkans 40%: 100 / 40 = 2,5, afgerond (half naar boven) 3.
    expect(slagingskansOordeel(60)).toBe('haalt dit; 1 op de 3 niet')
  })

  it('noemt geen breuk vanaf 80%', () => {
    expect(slagingskansOordeel(80)).toBe('van de 2.000 scenario’s haalt dit')
    expect(slagingskansOordeel(95)).toBe('van de 2.000 scenario’s haalt dit')
  })

  it('noemt geen breuk onder 60%', () => {
    expect(slagingskansOordeel(59.9)).toBe('haalt dit; de meeste niet')
    expect(slagingskansOordeel(10)).toBe('haalt dit; de meeste niet')
  })
})
