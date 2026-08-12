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
import { calculateJaarruimte } from '../jaarruimte'
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
