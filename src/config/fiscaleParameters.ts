/**
 * FISCALE PARAMETERS — GEGENEREERD BESTAND
 *
 * !! NIET met de hand aanpassen !!
 *
 * Bron:      C:/Users/schak/Documents/Fiscale bron/fiscale-cijfers.json
 * Genereren: node genereer.mjs   (in die map)
 *
 * Versie 2026.1 · bijgewerkt 2026-08-13
 * Volgende controle: oktober/november 2026, zodra de Belastingdienst de cijfers voor 2027 publiceert
 *
 * Waarden met een ⚠️ wijken af van wat de bron zegt. Die staan bewust nog op de
 * waarde die vandaag in gebruik is, zodat genereren niets aan het gedrag verandert.
 * Los ze op in de bron, niet hier.
 */

// ─── Box 1 belastingtarieven ────────────────────────────────────────────────
export const BOX1_PRE_AOW = {
  schijf1Grens:  38_883,
  schijf2Grens:  78_426,
  schijf1Tarief: 0.3575,
  schijf2Tarief: 0.3756,
  schijf3Tarief: 0.495,
}

export const BOX1_POST_AOW = {
  schijf1Grens:  38_883,
  schijf2Grens:  78_426,
  schijf1Tarief: 0.1785,
  schijf2Tarief: 0.3756,
  schijf3Tarief: 0.495,
}

// ─── Heffingskortingen (box 1, jonger dan AOW-leeftijd) ─────────────────────
export const HEFFINGSKORTING_PRE_AOW = {
  algemeneHeffingskorting: {
    max:         3_115,
    afbouwVanaf: 29_736,
    afbouwPct:   0.06398,
    nihilBij:    78_426,
  },
  arbeidskorting: {
    knik1: 11_965, pct1: 0.08324,
    knik2: 25_845, pct2: 0.31009,
    knik3: 45_592, pct3: 0.0195,
    afbouwVanaf: 45_593, afbouwPct: 0.0651,
    max: 5_685,
  },
} as const

// ─── Heffingskortingen (box 1, AOW-leeftijd bereikt) ────────────────────────
// Nog niet in gebruik. Staat klaar voor E4.
export const HEFFINGSKORTING_POST_AOW = {
  algemeneHeffingskorting: {
    max:         1_556,
    afbouwVanaf: 29_736,
    afbouwPct:   0.03195,
    nihilBij:    78_426,
  },
  ouderenkorting: {
    max:         2_067,
    afbouwVanaf: 46_002,
    afbouwPct:   0.15,
    nihilBij:    59_782,
  },
  alleenstaandeouderenkorting: 540,
  arbeidskorting: {
    knik1: 11_965, pct1: 0.04156,
    knik2: 25_845, pct2: 0.15483,
    knik3: 45_592, pct3: 0.00974,
    afbouwVanaf: 45_593, afbouwPct: 0.0325,
    max: 2_840,
  },
} as const

// ─── Box 3 ──────────────────────────────────────────────────────────────────
// Nog niet in gebruik. Staat klaar voor E2.
export const BOX3 = {
  tarief: 0.36,
  heffingsvrijVermogen: {
    alleenstaand:         59_357,
    fiscaalPartnersSamen: 118_714,
  },
  forfaitairRendement: {
    spaargeld:   0.0128,
    beleggingen: 0.06,
    schulden:    0.027,
  },
} as const

// ─── AOW-bedragen ───────────────────────────────────────────────────────────
// Netto per maand, inclusief loonheffingskorting.
export const AOW_NETTO_MAAND = {
  alleenstaand:  1_558,
  samenwonend:   1_068,
}

export const AOW_LEEFTIJD = 67

// ─── Jaarruimte parameters ──────────────────────────────────────────────────
// premiegrondslag = min(inkomen, maxInkomen) - franchise, nooit negatief. Inkomen en factor A zijn die van het voorgaande kalenderjaar.

export interface JaarruimteJaar {
  franchise:              number
  maxInkomen:             number
  percentage:             number
  factorMultiplier:       number
  reserveringsruimteMax:  number
}

export const JAARRUIMTE_PARAMS: Record<number, JaarruimteJaar> = {
  2016: { franchise: 11_996, maxInkomen: 101_519, percentage: 0.138, factorMultiplier: 6.5, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7088/13997
  2017: { franchise: 12_032, maxInkomen: 103_317, percentage: 0.138, factorMultiplier: 6.5, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7110/14039
  2018: { franchise: 12_129, maxInkomen: 105_075, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7167/14152
  2019: { franchise: 12_275, maxInkomen: 107_593, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7254/14322
  2020: { franchise: 12_472, maxInkomen: 110_111, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7371/14552
  2021: { franchise: 12_672, maxInkomen: 112_189, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7489/14785
  2022: { franchise: 12_837, maxInkomen: 114_866, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=leeftijdsafhankelijk 7587/14978
  2023: { franchise: 13_646, maxInkomen: 128_810, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 32_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=38000
  2024: { franchise: 17_545, maxInkomen: 137_800, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 38_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=41608
  2025: { franchise: 18_475, maxInkomen: 137_800, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 38_000 },   // ⚠️ bron wijkt af: reserveringsruimteMax=42108
  2026: { franchise: 19_172, maxInkomen: 137_800, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 42_753 },
}

// Terugkijktermijn van de reserveringsruimte.
export const RESERVERINGSRUIMTE_TERUGKIJK = {
  vanaf2023: 10,
  voor2023:  7,
} as const
