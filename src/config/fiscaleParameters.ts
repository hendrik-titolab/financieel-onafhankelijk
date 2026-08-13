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
  /** Vast jaarplafond voor de reserveringsruimte. Alleen vanaf 2023. */
  reserveringsruimteMax?: number
  /**
   * Het regime tot en met 2022, waarin de reserveringsruimte de LAAGSTE was van
   * drie grenzen: de onbenutte jaarruimte over zeven jaar, 17% van de
   * premiegrondslag, en een absoluut maximum dat afhing van de leeftijd op
   * 1 januari van het belastingjaar. Alleen ingevuld voor de jaren die de tool
   * aanbiedt, zie JAARRUIMTE_BELASTINGJAREN.
   */
  reserveringsruimteVoor2023?: {
    maxStandaard: number
    maxBinnenTienJaarVanAow: number
    /** AOW-leeftijd van dat jaar in maanden. Omslagpunt is deze waarde min 120. */
    aowLeeftijdMaanden: number
  }
}

export const JAARRUIMTE_PARAMS: Record<number, JaarruimteJaar> = {
  2016: { franchise: 11_996, maxInkomen: 101_519, percentage: 0.138, factorMultiplier: 6.5 },   // reserveringsruimte was leeftijdsafhankelijk: 7_088 / 13_997
  2017: { franchise: 12_032, maxInkomen: 103_317, percentage: 0.138, factorMultiplier: 6.5 },   // reserveringsruimte was leeftijdsafhankelijk: 7_110 / 14_039
  2018: { franchise: 12_129, maxInkomen: 105_075, percentage: 0.133, factorMultiplier: 6.27 },   // reserveringsruimte was leeftijdsafhankelijk: 7_167 / 14_152
  2019: { franchise: 12_275, maxInkomen: 107_593, percentage: 0.133, factorMultiplier: 6.27 },   // reserveringsruimte was leeftijdsafhankelijk: 7_254 / 14_322
  2020: { franchise: 12_472, maxInkomen: 110_111, percentage: 0.133, factorMultiplier: 6.27 },   // reserveringsruimte was leeftijdsafhankelijk: 7_371 / 14_552
  2021: { franchise: 12_672, maxInkomen: 112_189, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteVoor2023: { maxStandaard: 7_489, maxBinnenTienJaarVanAow: 14_785, aowLeeftijdMaanden: 796 } },
  2022: { franchise: 12_837, maxInkomen: 114_866, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteVoor2023: { maxStandaard: 7_587, maxBinnenTienJaarVanAow: 14_978, aowLeeftijdMaanden: 799 } },
  2023: { franchise: 13_646, maxInkomen: 128_810, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 38_000 },
  2024: { franchise: 17_545, maxInkomen: 137_800, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 41_608 },
  2025: { franchise: 18_475, maxInkomen: 137_800, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 42_108 },
  2026: { franchise: 19_172, maxInkomen: 137_800, percentage: 0.3, factorMultiplier: 6.27, reserveringsruimteMax: 42_753 },
}

// Jaren waarvoor de tool een berekening aanbiedt.
// Jaren waarvoor de tool een jaarruimte laat berekenen. Vanaf 2023 het Wtp-regime. Daarnaast 2021 en 2022, omdat een vergeten lijfrenteaftrek over die jaren via een ambtshalve vermindering nog te herstellen is. Verder terug is fiscaal niet meer te repareren en daarom bewust niet aangeboden: dat zou Wft-aansprakelijkheid opleveren zonder dat iemand er iets aan heeft. Besluit Hendrik, 13 augustus 2026.
export const JAARRUIMTE_BELASTINGJAREN: number[] = [2021, 2022, 2023, 2024, 2025, 2026]

// Reserveringsruimte: terugkijktermijn en, tot en met 2022, het percentage van de
// premiegrondslag dat daarnaast als bovengrens gold.
// Tot en met 2022 golden er DRIE begrenzingen tegelijk, en de reserveringsruimte was de laagste daarvan: (1) de som van de onbenutte jaarruimte over de voorgaande zeven jaar, (2) 17% van de premiegrondslag, (3) een absoluut maximum dat afhing van de leeftijd. Vanaf 2023 zijn (1) tien jaar geworden en zijn (2) en het leeftijdsonderscheid vervallen.
export const RESERVERINGSRUIMTE_TERUGKIJK = {
  vanaf2023: 10,
  voor2023:  7,
} as const

export const RESERVERINGSRUIMTE_PCT_VOOR_2023 = 0.17
