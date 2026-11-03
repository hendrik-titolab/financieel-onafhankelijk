// Een geboortedatum werd gelezen als middernacht UTC en daarna in lokale tijd
// uitgelezen. Ten westen van Greenwich gaf dat de dag ervoor: vijf toetsen in
// jaarruimte.aow en jaarruimte.golden faalden op een machine in UTC-6, terwijl de
// CI (UTC) en Nederland (UTC+1/+2) groen bleven. Deze toets draait dezelfde gevallen
// in een paar tijdzones, zodat zo'n fout niet meer alleen buitenlands opvalt.
//
// Node leest process.env.TZ opnieuw bij elke toewijzing, en Vitest draait elk
// toetsbestand in een eigen proces, dus dit lekt niet naar andere bestanden.
import { describe, it, expect, afterAll } from 'vitest'
import { aowDatum, aowFaseInJaar, jaarruimteLeeftijdToegestaan, leeftijdInMaandenOp1Januari } from '../jaarruimte'

const oorspronkelijk = process.env.TZ
afterAll(() => {
  process.env.TZ = oorspronkelijk
})

const kalenderdatum = (d: Date | null) =>
  d ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : null

describe.each(['America/Mexico_City', 'UTC', 'Europe/Amsterdam', 'Pacific/Kiritimati'])(
  'geboortedatum in tijdzone %s',
  (tz) => {
    it('AOW-datum op de juiste kalenderdag', () => {
      process.env.TZ = tz
      expect(kalenderdatum(aowDatum('1959-03-15'))).toEqual([2026, 3, 15])
      expect(kalenderdatum(aowDatum('1956-12-01'))).toEqual([2023, 10, 1])
      expect(kalenderdatum(aowDatum('1957-06-15'))).toEqual([2024, 6, 15])
    })
    it('AOW-fase en leeftijdsgrens', () => {
      process.env.TZ = tz
      expect(aowFaseInJaar('1959-03-15', 2026)).toEqual({ soort: 'in', maand: 3 })
      // Geboren op 1 september 1953 doet in 2026 nog mee, een dag eerder niet
      expect(jaarruimteLeeftijdToegestaan('1953-09-01', 2026)).toBe(true)
      expect(jaarruimteLeeftijdToegestaan('1953-08-31', 2026)).toBe(false)
    })
    it('leeftijd in maanden op 1 januari', () => {
      process.env.TZ = tz
      expect(leeftijdInMaandenOp1Januari('1970-01-01', 2026)).toBe(672)
      expect(leeftijdInMaandenOp1Januari('1970-01-02', 2026)).toBe(671)
    })
  },
)

describe('onbruikbare geboortedatum', () => {
  it('geeft null in plaats van een doorgerolde datum', () => {
    expect(aowDatum('1959-02-31')).toBeNull()
    expect(aowDatum('geen datum')).toBeNull()
    expect(aowFaseInJaar('', 2026)).toBeNull()
  })
})
