// Rekenvoorbeelden uit de uitlegartikelen, nagerekend met de rekenkern (review deel 2, D1).
// Elk nieuw rekenvoorbeeld in een artikel krijgt hier een regel. Zo loopt een artikel niet meer
// stil achter als de fiscale cijfers of de rekenkern veranderen: dan wordt deze test rood.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { persoonNettoInkomen } from 'rekenkern/utils/pensionCalc'
import { AOW_NETTO_MAAND, BOX1_POST_AOW, ZVW } from 'rekenkern/config/fiscaleParameters'

function artikel(slug: string): string {
  return readFileSync(fileURLToPath(new URL(`../../content/uitleg/${slug}`, import.meta.url)), 'utf8')
    .replace(/\s+/g, ' ')
}

/** Zoals in de artikelen: hele euro's met een punt als duizendtal, "€ 1.639". */
function euro(bedrag: number): string {
  return `€ ${Math.round(bedrag).toLocaleString('nl-NL')}`
}

describe('welke-aannames-gebruikt-de-fo-planner.md: het pensioenvoorbeeld (deel 2, A1)', () => {
  const tekst = artikel('welke-aannames-gebruikt-de-fo-planner.md')
  // Alleenstaand, volledige AOW met vakantiegeld (de standaard van de planner), € 2.500 bruto
  // pensioen per maand. Netto pensioen = netto van AOW plus pensioen, min netto AOW.
  const persoon = {
    age: 70, aowStartAge: 67, aowNetto: AOW_NETTO_MAAND.alleenstaand,
    employerPensionBruto: 2_500, employerPensionStartAge: 67,
  }
  const netto = persoonNettoInkomen(persoon, 'alleenstaand', true).employerPension
  const alleenEersteSchijf = 2_500 * (1 - BOX1_POST_AOW.schijf1Tarief - ZVW.lageBijdrage)

  it('de rekenkern geeft de bedragen uit het artikel', () => {
    expect(netto).toBeCloseTo(1_639.20, 2)
    expect(alleenEersteSchijf).toBeCloseTo(1_932.50, 2)
    expect(alleenEersteSchijf - netto).toBeGreaterThan(290)
    expect(alleenEersteSchijf - netto).toBeLessThan(300)
  })

  it('het artikel noemt die bedragen', () => {
    expect(tekst).toContain(`ongeveer ${euro(netto)} netto per maand`)
    expect(tekst).toContain(`ongeveer ${euro(alleenEersteSchijf)} uitkomen`)
    expect(tekst).toContain('bijna € 300 per maand')
    expect(tekst).toContain('Het vakantiegeld over de AOW telt mee')
  })
})
