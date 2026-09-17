// De belastingmotor per jaar (WP9). FISCAAL bevat de tarieven en heffingskortingen
// van 2021 tot en met 2026, overgenomen uit de fiscale informatie van de
// Belastingdienst (fisin<jaar>). Dat zijn negentig losse fiscale getallen, en in
// Wft-gebied hoort daar een vangnet onder: een verkeerd overgetypt percentage is
// hier geen schoonheidsfout.
//
// De toets is niet "staat het getal er nog", want dat bewijst niets. De
// gepubliceerde arbeidskortingtabel noemt per knikpunt een bedrag, en dat bedrag
// moet volgen uit de percentages in de config. Klopt dat niet, dan is er iets
// verkeerd overgenomen of later verschoven.
import { describe, it, expect } from 'vitest'
import { FISCAAL, BOX1_PRE_AOW, HEFFINGSKORTING_PRE_AOW } from '../../config/fiscaleParameters'
import { PARAMETER_JAAR } from '../../config/modelVersie'
import { arbeidskortingVoor } from '../brutoNetto'

const JAREN = [2021, 2022, 2023, 2024, 2025, 2026]

describe('FISCAAL — vorm van de tariefschijven', () => {
  it.each(JAREN)('%d heeft oplopende schijven die eindigen zonder bovengrens', jaar => {
    const schijven = FISCAAL[jaar].preAow.schijven
    expect(schijven.length).toBeGreaterThanOrEqual(2)

    // Alleen de laatste schijf mag open zijn, anders is er een gat of overlap.
    expect(schijven[schijven.length - 1].tot).toBeNull()
    for (const s of schijven.slice(0, -1)) expect(s.tot).not.toBeNull()

    const grenzen = schijven.slice(0, -1).map(s => s.tot as number)
    for (let i = 1; i < grenzen.length; i++) expect(grenzen[i]).toBeGreaterThan(grenzen[i - 1])

    // Het toptarief is elk van deze jaren 49,5%, en elk tarief loopt op.
    const tarieven = schijven.map(s => s.tarief)
    for (let i = 1; i < tarieven.length; i++) expect(tarieven[i]).toBeGreaterThan(tarieven[i - 1])
    expect(tarieven[tarieven.length - 1]).toBe(0.495)
  })

  it('kent het echte verschil in aantal schijven tussen de jaren', () => {
    // Niet cosmetisch: 2021 tot en met 2024 hadden twee schijven, 2025 en 2026
    // drie. Een vaste schijf1/schijf2/schijf3-vorm zou dat niet kunnen uitdrukken,
    // en dat is de reden dat FISCAAL een lijst gebruikt.
    expect(FISCAAL[2021].preAow.schijven).toHaveLength(2)
    expect(FISCAAL[2024].preAow.schijven).toHaveLength(2)
    expect(FISCAAL[2025].preAow.schijven).toHaveLength(3)
    expect(FISCAAL[2026].preAow.schijven).toHaveLength(3)
  })
})

describe('FISCAAL — arbeidskorting reproduceert de gepubliceerde tabel', () => {
  // Per jaar het bedrag dat de tabel van de Belastingdienst noemt aan het eind van
  // elk opbouwtraject. De Belastingdienst rondt die bedragen af op hele euro's, dus
  // een marge van een halve euro is afrondingsruis en geen fout.
  const tabel: Record<number, [number, number, number]> = {
    2021: [463, 3_837, 4_205],
    2022: [470, 3_887, 4_260],
    2023: [884, 4_605, 5_052],
    2024: [968, 5_158, 5_532],
    2025: [980, 5_220, 5_599],
    2026: [996, 5_300, 5_685],
  }

  it.each(JAREN)('%d klopt op alle drie de knikpunten', jaar => {
    const a = FISCAAL[jaar].preAow.arbeidskorting
    const [b1, b2, b3] = tabel[jaar]
    expect(arbeidskortingVoor(a.knik1, a)).toBeCloseTo(b1, 0)
    expect(arbeidskortingVoor(a.knik2, a)).toBeCloseTo(b2, 0)
    expect(arbeidskortingVoor(a.knik3, a)).toBeCloseTo(b3, 0)
  })

  it.each(JAREN)('%d bereikt het maximum aan het eind van de opbouw', jaar => {
    const a = FISCAAL[jaar].preAow.arbeidskorting
    // Het maximum hoort precies op knik3 te liggen: daarna begint de afbouw. Loopt
    // dat uiteen, dan sluiten de opbouw en het gepubliceerde maximum niet op elkaar aan.
    expect(arbeidskortingVoor(a.knik3, a)).toBeCloseTo(a.max, 0)
    expect(arbeidskortingVoor(0, a)).toBe(0)
  })

  it.each(JAREN)('%d bouwt volledig af tot nul', jaar => {
    const a = FISCAAL[jaar].preAow.arbeidskorting
    const nihil = a.afbouwVanaf + a.max / a.afbouwPct
    expect(arbeidskortingVoor(nihil, a)).toBeCloseTo(0, 6)
    expect(arbeidskortingVoor(nihil * 2, a)).toBe(0)
  })
})

describe('FISCAAL — algemene heffingskorting', () => {
  it.each(JAREN)('%d is op het nihilpunt afgebouwd tot ongeveer nul', jaar => {
    const a = FISCAAL[jaar].preAow.algemeneHeffingskorting
    // max, afbouwVanaf, afbouwPct en nihilBij komen alle vier uit dezelfde
    // gepubliceerde formule en moeten dus op elkaar aansluiten. De Belastingdienst
    // publiceert ze los en afgerond, vandaar de marge van een euro.
    const rest = a.max - a.afbouwPct * (a.nihilBij - a.afbouwVanaf)
    expect(Math.abs(rest)).toBeLessThan(1)
    expect(a.afbouwVanaf).toBeLessThan(a.nihilBij)
  })
})

describe('FISCAAL — sluit aan op de platte exports van het huidige jaar', () => {
  // Zolang de platte exports naast FISCAAL bestaan (tot de opruimfase van WP9)
  // beschrijven ze hetzelfde jaar. Lopen ze uiteen, dan geeft de ene rekenroute
  // andere cijfers dan de andere. genereer.mjs bewaakt dit aan de bronkant; dit is
  // dezelfde toets aan de kant waar de site het leest.
  const huidig = FISCAAL[PARAMETER_JAAR]

  it('heeft cijfers voor het parameterjaar', () => {
    expect(huidig).toBeDefined()
    expect(huidig.postAow).toBeDefined()
  })

  it('geeft dezelfde tariefschijven', () => {
    expect(huidig.preAow.schijven).toEqual([
      { tot: BOX1_PRE_AOW.schijf1Grens, tarief: BOX1_PRE_AOW.schijf1Tarief },
      { tot: BOX1_PRE_AOW.schijf2Grens, tarief: BOX1_PRE_AOW.schijf2Tarief },
      { tot: null, tarief: BOX1_PRE_AOW.schijf3Tarief },
    ])
  })

  it('geeft dezelfde heffingskortingen', () => {
    const a = HEFFINGSKORTING_PRE_AOW.algemeneHeffingskorting
    expect(huidig.preAow.algemeneHeffingskorting).toEqual({
      max: a.max, afbouwVanaf: a.afbouwVanaf, afbouwPct: a.afbouwPct, nihilBij: a.nihilBij,
    })
    const k = HEFFINGSKORTING_PRE_AOW.arbeidskorting
    expect(huidig.preAow.arbeidskorting).toEqual({
      knik1: k.knik1, pct1: k.pct1,
      knik2: k.knik2, pct2: k.pct2,
      knik3: k.knik3, pct3: k.pct3,
      afbouwVanaf: k.afbouwVanaf, afbouwPct: k.afbouwPct, max: k.max,
    })
  })
})
