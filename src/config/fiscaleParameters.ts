/**
 * FISCALE PARAMETERS — centrale configuratie
 *
 * Dit is de enige plek waar fiscale getallen staan.
 * Alle andere bestanden importeren hieruit.
 *
 * Bron:     Lindenhaege advieskaart (jaarlijks)
 *           https://lindenhaeghe.nl/kompas/financieel-dienstverleners/
 * Laatste update: juni 2026 (advieskaart 2026)
 * Volgende check:  oktober 2026
 *
 * !! NIET handmatig aanpassen — laat de kwartaalagent dit bijwerken !!
 */

// ─── Box 1 belastingtarieven ────────────────────────────────────────────────
// Bron: advieskaart pagina "Belasting", tabel Box 1

export const BOX1_PRE_AOW = {
  schijf1Grens:  38_883,   // bovengrens schijf 1 (€)
  schijf2Grens:  78_426,   // bovengrens schijf 2 / ondergrens schijf 3 (€)
  schijf1Tarief: 0.3575,   // 35,75% — belasting + volksverzekeringen schijf 1
  schijf2Tarief: 0.3756,   // 37,56% — belasting schijf 2
  schijf3Tarief: 0.4950,   // 49,50% — belasting schijf 3
}

export const BOX1_POST_AOW = {
  schijf1Grens:  38_883,   // bovengrens schijf 1 (€)
  schijf2Grens:  78_426,   // bovengrens schijf 2 (€)
  schijf1Tarief: 0.1785,   // 17,85% — geen AOW-premie meer na AOW-leeftijd
  schijf2Tarief: 0.3756,   // 37,56%
  schijf3Tarief: 0.4950,   // 49,50%
}

// ─── AOW-bedragen ───────────────────────────────────────────────────────────
// Bron: advieskaart pagina "Inkomen", tabel AOW-bedragen (met heffingskorting)

export const AOW_NETTO_MAAND = {
  alleenstaand:  1_558,    // €1.558/mnd netto (met heffingskorting, 2026)
  samenwonend:   1_068,    // €1.068/mnd netto per persoon (met heffingskorting, 2026)
}

// ─── Jaarruimte parameters ──────────────────────────────────────────────────
// Bron: advieskaart pagina "Pensioen", tabel historische jaarruimtegegevens
// Formule: jaarruimte = (percentage × premiegrondslag) − (factorMultiplier × factor A)
// waarbij: premiegrondslag = min(inkomen, maxInkomen) − franchise

export interface JaarruimteJaar {
  franchise:              number   // AOW-franchise (€)
  maxInkomen:             number   // maximaal toetsingsinkomen (€)
  percentage:             number   // jaarruimtepercentage (bijv. 0.30)
  factorMultiplier:       number   // pensioenimputatiefactor (bijv. 6.27)
  reserveringsruimteMax:  number   // maximale reserveringsruimte totaal dit jaar (€)
}

export const JAARRUIMTE_PARAMS: Record<number, JaarruimteJaar> = {
  // ── Pre-Wtp (oud regime: 13,3%, factor 7,44) ──
  2016: { franchise: 11_996, maxInkomen: 101_519, percentage: 0.133, factorMultiplier: 6.50, reserveringsruimteMax: 28_000 },
  2017: { franchise: 12_032, maxInkomen: 103_317, percentage: 0.138, factorMultiplier: 6.50, reserveringsruimteMax: 28_000 },
  2018: { franchise: 12_129, maxInkomen: 105_075, percentage: 0.133, factorMultiplier: 6.50, reserveringsruimteMax: 28_000 },
  2019: { franchise: 12_275, maxInkomen: 107_593, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },
  2020: { franchise: 12_472, maxInkomen: 110_111, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },
  2021: { franchise: 12_672, maxInkomen: 112_189, percentage: 0.133, factorMultiplier: 6.27, reserveringsruimteMax: 28_000 },
  2022: { franchise: 12_837, maxInkomen: 114_866, percentage: 0.133, factorMultiplier: 7.44, reserveringsruimteMax: 28_000 },
  // ── Wtp (nieuw regime: 30%, factor 6,27) ──
  2023: { franchise: 13_646, maxInkomen: 128_810, percentage: 0.30,  factorMultiplier: 6.27, reserveringsruimteMax: 32_000 },
  2024: { franchise: 17_545, maxInkomen: 137_800, percentage: 0.30,  factorMultiplier: 6.27, reserveringsruimteMax: 38_000 },
  2025: { franchise: 18_475, maxInkomen: 137_800, percentage: 0.30,  factorMultiplier: 6.27, reserveringsruimteMax: 38_000 },
  // 2026: Lindenhaege advieskaart januari 2026 — bevestigd
  2026: { franchise: 19_172, maxInkomen: 137_800, percentage: 0.30,  factorMultiplier: 6.27, reserveringsruimteMax: 42_753 },
}
