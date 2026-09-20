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

  it('noemt bij precies 50% 1 op de 2, de exacte ondergrens van de breukband', () => {
    expect(slagingskansOordeel(50)).toBe('haalt dit; 1 op de 2 niet')
  })

  it('noemt geen breuk onder 50%', () => {
    expect(slagingskansOordeel(49.9)).toBe('haalt dit; de meeste niet')
    expect(slagingskansOordeel(10)).toBe('haalt dit; de meeste niet')
  })
})

// Bevinding Hendrik, 20 september 2026: "de meeste niet" bij 1,7%.
describe('slagingskansOordeel — lage kansen', () => {
  it('zegt bij het gemelde geval (1,7%) dat de kans zeer klein is', () => {
    expect(slagingskansOordeel(1.7)).toBe('haalt dit; de kans is zeer klein')
  })

  it('zegt dat ook bij het basisscenario van 8,25% uit CLAUDE.md', () => {
    expect(slagingskansOordeel(8.25)).toBe('haalt dit; de kans is zeer klein')
  })

  it('schakelt om op 10%: daarboven "de meeste niet", daaronder "zeer klein"', () => {
    expect(slagingskansOordeel(10)).toBe('haalt dit; de meeste niet')
    expect(slagingskansOordeel(9.9)).toBe('haalt dit; de kans is zeer klein')
  })

  it('zegt bij 0% niet dat het net niet lukt', () => {
    expect(slagingskansOordeel(0)).toBe('haalt dit; de kans is zeer klein')
  })
})

// De tweede fout die bij deze wijziging aan het licht kwam: de oude band liep van
// 0 tot 60, dus bij 55% stond er "de meeste niet" terwijl de meerderheid het juist
// wél haalt. Deze tests leggen vast dat die bewering niet meer voorkomt.
describe('slagingskansOordeel — beweert nooit dat de meerderheid faalt terwijl die slaagt', () => {
  for (const v of [50, 52.5, 55, 57.3, 59.9]) {
    it(`zegt bij ${v.toLocaleString('nl-NL')}% niet "de meeste niet"`, () => {
      expect(slagingskansOordeel(v)).not.toBe('haalt dit; de meeste niet')
      expect(slagingskansOordeel(v)).toMatch(/^haalt dit; 1 op de \d+ niet$/)
    })
  }

  it('gebruikt "de meeste niet" alleen waar de meerderheid ook echt faalt', () => {
    // Elk heel procent van 0 tot 100: de tekst mag alleen "de meeste niet" zijn
    // als de faalkans daadwerkelijk boven de 50% ligt.
    for (let v = 0; v <= 100; v++) {
      if (slagingskansOordeel(v) === 'haalt dit; de meeste niet') {
        expect(100 - v).toBeGreaterThan(50)
      }
    }
  })
})
