// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
//
// "Beide reserveringsruimte-modi" is hier geïnterpreteerd op functieniveau: de UI
// heeft twee invoermodi ("ik weet de bedragen" / "bereken voor mij"), maar beide
// leveren calculateJaarruimte() uiteindelijk hetzelfde reserveringsruimteRijen-
// array. Getest is dus: (a) zonder reserveringsruimte-rijen, voor alle 18
// jaar×pensioentype-combinaties, en (b) mét reserveringsruimte-rijen (die de
// Math.min-afkapping op het jaarplafond raken), representatief per pensioentype
// voor 2026.
import { describe, it, expect } from 'vitest'
import { calculateJaarruimte, leeftijdInMaandenOp1Januari } from '../jaarruimte'
import type { PensioenType } from '../../types'
import { round } from './fixtures'
import fixture from './__golden__/jaarruimte.golden.json'

const JAREN = [2016, 2017, 2019, 2022, 2023, 2026]
const TYPES: PensioenType[] = ['geen', 'db', 'wtp']

function pick(r: ReturnType<typeof calculateJaarruimte>) {
  return {
    jaarruimte: round(r.jaarruimte),
    beschikbareReserveringsruimte: round(r.beschikbareReserveringsruimte),
    totaalBeschikbaar: round(r.totaalBeschikbaar),
    alIngelegd: round(r.alIngelegd),
    nogTeDoen: round(r.nogTeDoen),
    belastingVoordeel: round(r.belastingVoordeel),
    belastingTariefPct: round(r.belastingTarief * 100, 2),
  }
}

describe('calculateJaarruimte — golden master (zonder reserveringsruimte)', () => {
  for (const jaar of JAREN) {
    for (const type of TYPES) {
      const key = `${jaar}_${type}`
      it(key, () => {
        const result = calculateJaarruimte({
          year: jaar,
          income: 70000,
          pensioenType: type,
          factorA: type === 'db' ? 1500 : 0,
          werkgeverspremie: type === 'wtp' ? 1500 : 0,
          alIngelegd: 0,
          reserveringsruimteRijen: [],
          clientName: '', adviseurNaam: '', notities: '',
        })
        expect(pick(result)).toEqual((fixture as Record<string, any>)[key])
      })
    }
  }
})

// Met factor A € 1.500 valt de aftrek in de oudere jaren hoger uit dan de hele
// jaarruimte, waardoor de uitkomst op nul wordt geklemd en factorMultiplier dus
// niets meer aan het resultaat verandert. Een fout in die factor bleef daardoor
// onzichtbaar: de correctie van 2022 (7,44 naar 6,27, augustus 2026) veranderde
// geen enkele fixture. Met een lagere factor A blijft er wel iets over en telt de
// vermenigvuldiger wel mee.
describe('calculateJaarruimte — golden master (lage factor A, zodat de imputatiefactor meetelt)', () => {
  for (const jaar of JAREN) {
    const key = `${jaar}_db_factorA500`
    it(key, () => {
      const result = calculateJaarruimte({
        year: jaar,
        income: 70000,
        pensioenType: 'db',
        factorA: 500,
        werkgeverspremie: 0,
        alIngelegd: 0,
        reserveringsruimteRijen: [],
        clientName: '', adviseurNaam: '', notities: '',
      })
      expect(result.jaarruimte).toBeGreaterThan(0)
      expect(pick(result)).toEqual((fixture as Record<string, any>)[key])
    })
  }
})

// ── Het regime tot en met 2022 ────────────────────────────────────────────────
//
// Drie begrenzingen tegelijk, de laagste wint: de onbenutte ruimte zelf, 17% van
// de premiegrondslag, en een absoluut maximum dat hoger lag voor wie op 1 januari
// binnen tien jaar van zijn AOW-leeftijd zat (art. 3.127 lid 2 Wet IB 2001).
describe('calculateJaarruimte — reserveringsruimte 2021 en 2022', () => {
  const basis = (jaar: number, income: number, geboortedatum?: string) => ({
    year: jaar, income, pensioenType: 'geen' as const,
    factorA: 0, werkgeverspremie: 0, alIngelegd: 0,
    // Ruim boven elk plafond, zodat altijd het plafond wint en niet de som.
    reserveringsruimteRijen: [{ jaar: jaar - 1, onbenutBedrag: 50000 }],
    geboortedatum,
    clientName: '', adviseurNaam: '', notities: '',
  })

  it('past het lage maximum toe bij iemand die er nog lang niet is', () => {
    const r = calculateJaarruimte(basis(2021, 70000, '1975-01-01'))
    expect(r.beschikbareReserveringsruimte).toBe(7489)
    expect(r.reserveringsruimtePlafondReden).toBe('maximum 2021')
  })

  it('past het hoge maximum toe binnen tien jaar van de AOW-leeftijd', () => {
    const r = calculateJaarruimte(basis(2021, 110000, '1960-01-01'))
    expect(r.beschikbareReserveringsruimte).toBe(14785)
    expect(r.reserveringsruimtePlafondReden).toContain('binnen tien jaar')
  })

  it('gebruikt in 2022 de bedragen van 2022, niet die van 2021', () => {
    expect(calculateJaarruimte(basis(2022, 70000, '1975-01-01')).beschikbareReserveringsruimte).toBe(7587)
    expect(calculateJaarruimte(basis(2022, 110000, '1960-01-01')).beschikbareReserveringsruimte).toBe(14978)
  })

  it('laat 17% van de premiegrondslag winnen als dat lager is dan het maximum', () => {
    // Premiegrondslag 2021 bij €40.000: 40.000 − 12.672 = 27.328. 17% = 4.645,76,
    // en dat is minder dan het lage maximum van 7.489.
    const r = calculateJaarruimte(basis(2021, 40000, '1975-01-01'))
    expect(round(r.beschikbareReserveringsruimte)).toBe(round(0.17 * (40000 - 12672)))
    expect(r.reserveringsruimtePlafondReden).toBe('17% van de premiegrondslag')
  })

  it('houdt zonder geboortedatum het lage bedrag aan', () => {
    const r = calculateJaarruimte(basis(2021, 110000))
    expect(r.beschikbareReserveringsruimte).toBe(7489)
    expect(r.reserveringsruimtePlafondReden).toContain('zonder geboortedatum')
  })

  it('topt niet af als de onbenutte ruimte onder het plafond blijft', () => {
    const r = calculateJaarruimte({ ...basis(2021, 70000, '1975-01-01'),
      reserveringsruimteRijen: [{ jaar: 2020, onbenutBedrag: 3000 }] })
    expect(r.beschikbareReserveringsruimte).toBe(3000)
  })

  it('weigert te rekenen voor een jaar dat de tool niet aanbiedt', () => {
    expect(() => calculateJaarruimte(basis(2018, 70000, '1975-01-01'))).toThrow(/getAvailableYears/)
  })

  it('vanaf 2023 geldt één vast plafond, ongeacht leeftijd', () => {
    const jong = calculateJaarruimte(basis(2026, 70000, '1975-01-01'))
    const oud  = calculateJaarruimte(basis(2026, 70000, '1955-01-01'))
    expect(jong.beschikbareReserveringsruimte).toBe(oud.beschikbareReserveringsruimte)
    expect(jong.reserveringsruimtePlafondReden).toBe('vast jaarplafond 2026')
  })
})

describe('leeftijdInMaandenOp1Januari', () => {
  it('rekent tot 1 januari, niet tot de verjaardag', () => {
    // Geboren 1 september 1964: op 1 januari 2021 precies 56 jaar en 4 maanden.
    expect(leeftijdInMaandenOp1Januari('1964-09-01', 2021)).toBe(56 * 12 + 4)
    // Een dag later geboren betekent op 1 januari nog een maand minder vol.
    expect(leeftijdInMaandenOp1Januari('1964-09-02', 2021)).toBe(56 * 12 + 3)
  })

  it('geeft null bij een onbruikbare datum', () => {
    expect(leeftijdInMaandenOp1Januari('geen datum', 2021)).toBeNull()
    expect(leeftijdInMaandenOp1Januari('', 2021)).toBeNull()
  })

  // De wet zegt "ten hoogste tien jaar lager", dus precies op het omslagpunt telt
  // mee. De AOW-leeftijd van 2021 was 66 jaar en 4 maanden, dus het omslagpunt ligt
  // op 56 jaar en 4 maanden: geboren op 1 september 1964. Veel bronnen schrijven
  // "geboren vóór 1 september 1964", wat die ene dag anders uitpakt. Wij volgen de
  // wettekst. Deze test legt die lezing vast, zodat een correctie zichtbaar wordt.
  it('telt precies op het omslagpunt mee voor het hoge bedrag', () => {
    const r = calculateJaarruimte({
      year: 2021, income: 110000, pensioenType: 'geen',
      factorA: 0, werkgeverspremie: 0, alIngelegd: 0,
      reserveringsruimteRijen: [{ jaar: 2020, onbenutBedrag: 50000 }],
      geboortedatum: '1964-09-01',
      clientName: '', adviseurNaam: '', notities: '',
    })
    expect(r.beschikbareReserveringsruimte).toBe(14785)
  })
})

describe('calculateJaarruimte — golden master (met reserveringsruimte, 2026)', () => {
  for (const type of TYPES) {
    const key = `2026_${type}_met_reserveringsruimte`
    it(key, () => {
      const result = calculateJaarruimte({
        year: 2026,
        income: 70000,
        pensioenType: type,
        factorA: type === 'db' ? 1500 : 0,
        werkgeverspremie: type === 'wtp' ? 1500 : 0,
        alIngelegd: 5000,
        reserveringsruimteRijen: [
          { jaar: 2025, onbenutBedrag: 20000 },
          { jaar: 2024, onbenutBedrag: 20000 },
        ],
        clientName: '', adviseurNaam: '', notities: '',
      })
      expect(pick(result)).toEqual((fixture as Record<string, any>)[key])
    })
  }
})
