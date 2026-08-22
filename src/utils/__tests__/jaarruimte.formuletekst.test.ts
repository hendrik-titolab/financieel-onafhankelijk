// Sluit het faalpatroon van bevinding A7: op het scherm stond een formuletekst die
// niet overeenkwam met de daadwerkelijk berekende jaarruimte (voor 2020 zelfs twee
// tegenstrijdige teksten tegelijk, en geen van beide klopte met het getoonde
// resultaat). getFormuleTekst() en calculateJaarruimte() lezen nu dezelfde config,
// dus een toekomstige wijziging die de een aanpast zonder de ander kan hier stuk
// gaan, ook als geen enkele golden-master-fixture verandert (dat was precies hoe
// de oorspronkelijke bug onopgemerkt bleef).
import { describe, it, expect } from 'vitest'
import { calculateJaarruimte, getFormuleTekst, getAvailableYears } from '../jaarruimte'
import { JAARRUIMTE_PARAMS } from '../../config/fiscaleParameters'
import type { PensioenType } from '../../types'
import { round } from './fixtures'

const parseNl = (s: string) => parseFloat(s.replace(',', '.'))

// Ruim boven de franchise van elk jaar in de tool, zodat de grondslag en dus de
// jaarruimte nooit op nul geklemd wordt — anders zou de test ook slagen als de
// formule intern stuk is.
const INKOMEN = 90000
const FACTOR_A = 800
const WERKGEVERSPREMIE = 800

describe('getFormuleTekst() komt overeen met wat calculateJaarruimte() werkelijk rekent', () => {
  for (const jaar of getAvailableYears()) {
    for (const type of ['geen', 'db', 'wtp'] as PensioenType[]) {
      it(`${jaar} — ${type}`, () => {
        const p = JAARRUIMTE_PARAMS[jaar]
        const grondslag = Math.max(0, Math.min(INKOMEN, p.maxInkomen) - p.franchise)

        const tekst = getFormuleTekst(jaar, type)
        const pctMatch = tekst.match(/^([\d,]+)%/)
        expect(pctMatch, `geen percentage gevonden in "${tekst}"`).not.toBeNull()
        const pctUitTekst = parseNl(pctMatch![1]) / 100

        let verwacht: number
        if (type === 'db') {
          const factorMatch = tekst.match(/− ([\d,]+) × factor A/)
          expect(factorMatch, `geen factor A gevonden in "${tekst}"`).not.toBeNull()
          const factorUitTekst = parseNl(factorMatch![1])
          // De tekst moet letterlijk de configfactor tonen — dit is het exacte
          // punt waarop het vóór augustus 2026 fout stond (7,44 i.p.v. 6,27).
          expect(factorUitTekst).toBe(p.factorMultiplier)
          verwacht = Math.max(0, pctUitTekst * grondslag - factorUitTekst * FACTOR_A)
        } else if (type === 'wtp') {
          verwacht = Math.max(0, pctUitTekst * grondslag - WERKGEVERSPREMIE)
        } else {
          verwacht = Math.max(0, pctUitTekst * grondslag)
        }

        const werkelijk = calculateJaarruimte({
          year: jaar,
          income: INKOMEN,
          pensioenType: type,
          factorA: type === 'db' ? FACTOR_A : 0,
          werkgeverspremie: type === 'wtp' ? WERKGEVERSPREMIE : 0,
          alIngelegd: 0,
          reserveringsruimteRijen: [],
          clientName: '', adviseurNaam: '', notities: '',
        })

        // Positief bij elk jaar/type in de tool, anders bewijst een gelijkheid met
        // 0 aan beide kanten niets.
        expect(werkelijk.jaarruimte).toBeGreaterThan(0)
        expect(round(verwacht, 2)).toBe(round(werkelijk.jaarruimte, 2))
      })
    }
  }
})
