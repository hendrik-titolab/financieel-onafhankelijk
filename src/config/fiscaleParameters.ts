/**
 * FISCALE PARAMETERS — GEGENEREERD BESTAND
 *
 * !! NIET met de hand aanpassen !!
 *
 * Bron:      C:/Users/schak/Documents/Fiscale bron/fiscale-cijfers.json
 * Genereren: node genereer.mjs   (in die map)
 *
 * Versie 2026.1 · bijgewerkt 2026-09-08
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
// In gebruik sinds E4 (13 augustus 2026): belastingBox1() past dit toe op het
// totale box 1-inkomen. De losse Bruto-Netto-tool rekent nog steeds alleen met
// de tarieven van vóór de AOW-leeftijd.
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

// ─── Belastingmotor per jaar (WP9) ──────────────────────────────────────────
// De vier blokken hierboven (BOX1_*, HEFFINGSKORTING_*) beschrijven één jaar: het
// jaar dat in de bron als belastingjaar is aangewezen. FISCAAL beschrijft elk jaar
// waarvan de cijfers bekend zijn, zodat een berekening over een ander aftrekjaar
// niet stilzwijgend met de tarieven van nu wordt gedaan.
//
// preAow is voor elk jaar gevuld; postAow alleen voor het huidige jaar, omdat
// alleen de FO-planner daarmee rekent en die altijd op het huidige jaar rekent.
// Zie _dekking in fiscale-cijfers.json voor waarom historische postAow-cijfers
// bewust niet zijn opgezocht.

export interface Belastingschijf {
  /** Bovengrens van deze schijf. null bij de laatste schijf, die er geen heeft. */
  tot: number | null
  /** Gecombineerd tarief: inkomstenbelasting plus premie volksverzekeringen. */
  tarief: number
}

export interface Kortingschaal {
  max: number
  afbouwVanaf: number
  afbouwPct: number
  nihilBij: number
}

export interface Arbeidskortingschaal {
  knik1: number; pct1: number
  knik2: number; pct2: number
  knik3: number; pct3: number
  afbouwVanaf: number; afbouwPct: number
  max: number
}

/** De tarieven en kortingen van één fase: vóór of ná de AOW-leeftijd. */
export interface FiscaleFase {
  schijven: Belastingschijf[]
  algemeneHeffingskorting: Kortingschaal
  arbeidskorting: Arbeidskortingschaal
  /** Alleen ná de AOW-leeftijd. */
  ouderenkorting?: Kortingschaal
  /** Alleen ná de AOW-leeftijd. */
  alleenstaandeouderenkorting?: number
}

export interface FiscaalJaar {
  preAow: FiscaleFase
  /** Alleen gevuld voor jaren waarin een rekentool ná de AOW-leeftijd rekent. */
  postAow?: FiscaleFase
}

export const FISCAAL: Record<number, FiscaalJaar> = {
  2021: {
    preAow: {
      schijven: [
        { tot: 68_507, tarief: 0.371 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 2_837, afbouwVanaf: 21_043, afbouwPct: 0.05977, nihilBij: 68_507 },
      arbeidskorting: {
        knik1: 10_108, pct1: 0.04581,
        knik2: 21_835, pct2: 0.28771,
        knik3: 35_652, pct3: 0.02663,
        afbouwVanaf: 35_652, afbouwPct: 0.06, max: 4_205,
      },
    },
  },
  2022: {
    preAow: {
      schijven: [
        { tot: 69_398, tarief: 0.3707 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 2_888, afbouwVanaf: 21_317, afbouwPct: 0.06007, nihilBij: 69_398 },
      arbeidskorting: {
        knik1: 10_350, pct1: 0.04541,
        knik2: 22_356, pct2: 0.28461,
        knik3: 36_649, pct3: 0.0261,
        afbouwVanaf: 36_649, afbouwPct: 0.0586, max: 4_260,
      },
    },
  },
  2023: {
    preAow: {
      schijven: [
        { tot: 73_031, tarief: 0.3693 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 3_070, afbouwVanaf: 22_660, afbouwPct: 0.06095, nihilBij: 73_031 },
      arbeidskorting: {
        knik1: 10_740, pct1: 0.08231,
        knik2: 23_201, pct2: 0.29861,
        knik3: 37_691, pct3: 0.03085,
        afbouwVanaf: 37_691, afbouwPct: 0.0651, max: 5_052,
      },
    },
  },
  2024: {
    preAow: {
      schijven: [
        { tot: 75_518, tarief: 0.3697 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 3_362, afbouwVanaf: 24_812, afbouwPct: 0.0663, nihilBij: 75_518 },
      arbeidskorting: {
        knik1: 11_490, pct1: 0.08425,
        knik2: 24_820, pct2: 0.31433,
        knik3: 39_957, pct3: 0.02471,
        afbouwVanaf: 39_957, afbouwPct: 0.0651, max: 5_532,
      },
    },
  },
  2025: {
    preAow: {
      schijven: [
        { tot: 38_441, tarief: 0.3582 },
        { tot: 76_817, tarief: 0.3748 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 3_068, afbouwVanaf: 28_406, afbouwPct: 0.06337, nihilBij: 76_817 },
      arbeidskorting: {
        knik1: 12_169, pct1: 0.08053,
        knik2: 26_288, pct2: 0.3003,
        knik3: 43_071, pct3: 0.02258,
        afbouwVanaf: 43_071, afbouwPct: 0.0651, max: 5_599,
      },
    },
  },
  2026: {
    preAow: {
      schijven: [
        { tot: 38_883, tarief: 0.3575 },
        { tot: 78_426, tarief: 0.3756 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 3_115, afbouwVanaf: 29_736, afbouwPct: 0.06398, nihilBij: 78_426 },
      arbeidskorting: {
        knik1: 11_965, pct1: 0.08324,
        knik2: 25_845, pct2: 0.31009,
        knik3: 45_592, pct3: 0.0195,
        afbouwVanaf: 45_593, afbouwPct: 0.0651, max: 5_685,
      },
    },
    postAow: {
      schijven: [
        { tot: 38_883, tarief: 0.1785 },
        { tot: 78_426, tarief: 0.3756 },
        { tot: null, tarief: 0.495 },
      ],
      algemeneHeffingskorting: { max: 1_556, afbouwVanaf: 29_736, afbouwPct: 0.03195, nihilBij: 78_426 },
      arbeidskorting: {
        knik1: 11_965, pct1: 0.04156,
        knik2: 25_845, pct2: 0.15483,
        knik3: 45_592, pct3: 0.00974,
        afbouwVanaf: 45_593, afbouwPct: 0.0325, max: 2_840,
      },
      ouderenkorting: { max: 2_067, afbouwVanaf: 46_002, afbouwPct: 0.15, nihilBij: 59_782 },
      alleenstaandeouderenkorting: 540,
    },
  },
}

// ─── Bijdrage Zorgverzekeringswet ───────────────────────────────────────────
// De lage bijdrage is de eigen bijdrage die wordt ingehouden op loon, uitkering of pensioen, dus ook op AOW en aanvullend pensioen. De hoge bijdrage is de werkgeversheffing en speelt bij een gepensioneerde niet. Kruiscontrole met de AOW-bedragen: 79,42 / 1637,57 = 4,850% en 54,42 / 1122,12 = 4,850%, allebei exact de lage bijdrage.
export const ZVW = {
  lageBijdrage:           0.0485,
  hogeBijdrage:           0.061,
  maximumBijdrageInkomen: 79_409,
} as const

// ─── Box 3 ──────────────────────────────────────────────────────────────────
// In gebruik sinds september 2026, zie src/utils/box3.ts. BOX3 hieronder bevat de
// waarden van 2026 en voedt de schatting van de belastingdruk in de
// FO-planner. De box 3-rekentool gebruikt BOX3_JAREN, want die biedt meerdere
// belastingjaren aan.
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

// Box 3 per belastingjaar. 'voorlopig' betekent: het percentage is nog niet
// definitief vastgesteld en kan achteraf wijzigen. Voor 2025 gebeurde die
// vaststelling op 12 februari 2026 (Stcrt. 2026, 3708).
export const BOX3_JAREN = {
  2025: {
    tarief: 0.36,
    heffingsvrijVermogen: { alleenstaand: 57_684, fiscaalPartnersSamen: 115_368 },
    schuldendrempel:      { alleenstaand: 3_800, fiscaalPartnersSamen: 7_600 },
    forfaitairRendement:  { spaargeld: 0.0137, beleggingen: 0.0588, schulden: 0.027 },
    forfaitStatus:        { spaargeld: 'definitief', beleggingen: 'definitief', schulden: 'definitief' },
  },
  2026: {
    tarief: 0.36,
    heffingsvrijVermogen: { alleenstaand: 59_357, fiscaalPartnersSamen: 118_714 },
    schuldendrempel:      { alleenstaand: 3_800, fiscaalPartnersSamen: 7_600 },
    forfaitairRendement:  { spaargeld: 0.0128, beleggingen: 0.06, schulden: 0.027 },
    forfaitStatus:        { spaargeld: 'voorlopig', beleggingen: 'definitief', schulden: 'voorlopig' },
  },
} as const

/** De belastingjaren die de box 3-rekentool aanbiedt. */
export const BOX3_JAREN_IN_TOOL = [2025, 2026] as const

// Toerekening van het forfaitaire rendement naar het belastbare voordeel. Het
// aandeel bij stap 4 wordt afgekapt op twee decimalen en niet afgerond. Dat is
// afgeleid uit de rekenvoorbeelden van de Belastingdienst en het scheelt in de
// uitkomst: 60,4287% wordt 60,42% en niet 60,43%.
export const BOX3_TOEREKENING = {
  aandeelDecimalen: 2,
  aandeelAfronding: 'afkappen',
} as const

// ─── Lijfrente-/bankspaaruitkering ──────────────────────────────────────────
// Tijdelijke oudedagslijfrente: art. 3.125 lid 1 onderdeel c Wet IB 2001. Afkoopgrens kleine pensioenen: art. 66 PW.
// In gebruik sinds E1-optie-B: zachte waarschuwing tegen een onrealistisch hoog
// ingevuld uitkeringsbedrag, geen harde blokkade.
export const LIJFRENTE = {
  maxJaaruitkeringTijdelijkeOudedagslijfrente: 27_192,
  maxJaaruitkeringOverbruggingslijfrente:      63_288,
} as const

// ─── AOW-bedragen ───────────────────────────────────────────────────────────
// Netto per maand, inclusief loonheffingskorting.
// nettoMaand is netto INCLUSIEF loonheffingskorting. Wie dat bedrag gebruikt en daarnaast de heffingskortingen nog eens expliciet toepast, telt de korting dubbel. Gebruik voor een belastingberekening brutoMaand.
export const AOW_NETTO_MAAND = {
  alleenstaand:  1_582,
  samenwonend:   1_084,
}

// Bruto per maand, exclusief vakantiegeld. Nodig zodra het totale box 1-inkomen
// belast wordt in plaats van alleen het aanvullend pensioen.
// Bruto min loonheffing min Zvw-bijdrage geeft netto. Met loonheffingskorting is de loonheffing over alleen de AOW nul, omdat de algemene heffingskorting en de ouderenkorting samen hoger zijn dan de verschuldigde belasting. Zodra er aanvullend pensioen bij komt, is dat niet meer zo: dan bouwen die kortingen af en loopt het marginale tarief op tot boven de 55%. De brutobedragen staan hier zodat de FO-planner het totale box 1-inkomen kan belasten in plaats van alleen het aanvullend pensioen (E4).
export const AOW_BRUTO_MAAND = {
  alleenstaand: 1662.64,
  samenwonend:  1139.25,
} as const

export const AOW_VAKANTIEGELD_BRUTO_MAAND = {
  alleenstaand: 106.55,
  samenwonend:  76.1,
} as const

// Bijdrage Zvw over de AOW, per maand. Geen box 1-belasting maar wel een inhouding
// die het nettobedrag bepaalt.
export const AOW_ZVW_BIJDRAGE_MAAND = {
  alleenstaand: 80.64,
  samenwonend:  55.25,
} as const

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
