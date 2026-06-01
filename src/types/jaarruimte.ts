/**
 * Jaarruimte berekening 2025
 *
 * Berekent de jaarruimte (fiscale ruimte voor lijfrente-inleg) volgens de
 * Nederlandse belastingwetgeving voor 2025.
 *
 * Formule jaarruimte 2025:
 *   13,3% × premiegrondslag − 6,27 × factor A
 *
 * Premiegrondslag = bruto inkomen uit arbeid − franchise (€ 17.545 in 2025)
 * Maximum premiegrondslag: € 137.800 (2025)
 *
 * Belastingvoordeel: marginaal tarief over de aftrekbare inleg
 *   > € 75.518 → 49,5% (box 1 toptarief 2025)
 *   ≤ € 75.518 → 36,97% (box 1 basistarief 2025)
 *
 * Reserveringsruimte: onbenutte jaarruimte uit de voorgaande 10 jaar,
 * totaal maximaal € 80.650 (10 × € 8.065, het maximum per jaar in 2025).
 */

export interface JaarruimteInput {
  brutojaarinkomen: number;            // Bruto jaarinkomen uit arbeid (€)
  factorA: number;                     // Factor A (pensioenopbouw werkgever dit jaar)
  onbenutteRuimteVorigeJaren: number;  // Geschatte reserveringsruimte (€)
  jaar?: number;                       // Belastingjaar (default 2025)
}

export interface BerekeningStap {
  stap: number;
  omschrijving: string;
  berekening: string;
  resultaat: number;
}

export interface JaarruimteResultaat {
  // Invoer
  input: JaarruimteInput;

  // Tussenresultaten
  franchise: number;
  maxPremiegrondslag: number;
  premiegrondslag: number;
  jaarruimteBruto: number;
  aftrekFactorA: number;
  jaarruimteNetto: number;

  // Reserveringsruimte
  maxReserveringsruimtePerJaar: number;
  maxReserveringsruimteTotaal: number;
  reserveringsruimte: number;

  // Totaal inlegbaar
  totaalMaximaalInlegbaar: number;

  // Belastingvoordeel
  marginaalTarief: number;
  belastingVoordeelJaarruimte: number;
  belastingVoordeelTotaal: number;

  // Stap-voor-stap uitleg
  stappen: BerekeningStap[];
}

// Parameters belastingjaar 2025
const PARAMS_2025 = {
  jaar: 2025,
  franchise: 17545,                    // AOW-franchise (€)
  maxPremiegrondslag: 137800,          // Maximum premiegrondslag (€)
  jaarruimtePercentage: 0.133,         // 13,3%
  factorAMultiplier: 6.27,             // Factor A multiplier
  maxReserveringsruimtePerJaar: 8065,  // Max reserveringsruimte per jaar (€)
  aantalJarenReservering: 10,          // Maximaal aantal jaren terugkijken
  belastingTarief1: 0.3697,            // 36,97% — schijf 1
  belastingTarief2: 0.495,             // 49,5%  — schijf 2 (toptarief)
  belastingSchijfGrens: 75518,         // Schijfgrens box 1 (€)
};

/**
 * Berekent de jaarruimte, reserveringsruimte en het belastingvoordeel
 * voor lijfrente-inleg in het opgegeven belastingjaar.
 */
export function berekenJaarruimte(input: JaarruimteInput): JaarruimteResultaat {
  const params = PARAMS_2025;
  const stappen: BerekeningStap[] = [];
  let stapNummer = 1;

  const fmt = (n: number) => `€ ${n.toLocaleString("nl-NL")}`;

  // Stap 1: Franchise
  const franchise = params.franchise;
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Franchise bepalen (AOW-drempel 2025)",
    berekening: `Franchise = ${fmt(franchise)} (wettelijk vastgesteld)`,
    resultaat: franchise,
  });

  // Stap 2: Premiegrondslag
  const premiegrondslag = Math.min(
    Math.max(input.brutojaarinkomen - franchise, 0),
    params.maxPremiegrondslag
  );
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Premiegrondslag berekenen",
    berekening:
      `min( max( bruto inkomen − franchise, 0 ), max. premiegrondslag )\n` +
      `= min( max( ${fmt(input.brutojaarinkomen)} − ${fmt(franchise)}, 0 ), ${fmt(params.maxPremiegrondslag)} )\n` +
      `= ${fmt(premiegrondslag)}`,
    resultaat: premiegrondslag,
  });

  // Stap 3: Bruto jaarruimte
  const jaarruimteBruto = Math.round(params.jaarruimtePercentage * premiegrondslag);
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Bruto jaarruimte (13,3% van de premiegrondslag)",
    berekening: `13,3% × ${fmt(premiegrondslag)} = ${fmt(jaarruimteBruto)}`,
    resultaat: jaarruimteBruto,
  });

  // Stap 4: Aftrek factor A
  const aftrekFactorA = Math.round(params.factorAMultiplier * input.factorA);
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Aftrek werkgeverspensioen (6,27 × factor A)",
    berekening: `6,27 × ${fmt(input.factorA)} = ${fmt(aftrekFactorA)}`,
    resultaat: aftrekFactorA,
  });

  // Stap 5: Netto jaarruimte
  const jaarruimteNetto = Math.max(jaarruimteBruto - aftrekFactorA, 0);
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Netto jaarruimte",
    berekening:
      `Bruto jaarruimte − aftrek factor A\n` +
      `= ${fmt(jaarruimteBruto)} − ${fmt(aftrekFactorA)}\n` +
      `= ${fmt(jaarruimteNetto)}`,
    resultaat: jaarruimteNetto,
  });

  // Stap 6: Reserveringsruimte
  const maxReserveringsruimteTotaal =
    params.maxReserveringsruimtePerJaar * params.aantalJarenReservering;
  const reserveringsruimte = Math.min(
    input.onbenutteRuimteVorigeJaren,
    maxReserveringsruimteTotaal
  );
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Reserveringsruimte (onbenutte ruimte voorgaande jaren)",
    berekening:
      `Maximaal per jaar: ${fmt(params.maxReserveringsruimtePerJaar)}\n` +
      `Maximaal totaal (10 jaar): ${fmt(maxReserveringsruimteTotaal)}\n` +
      `Opgegeven onbenutte ruimte: ${fmt(input.onbenutteRuimteVorigeJaren)}\n` +
      `Toe te passen: min( ${fmt(input.onbenutteRuimteVorigeJaren)}, ${fmt(maxReserveringsruimteTotaal)} ) = ${fmt(reserveringsruimte)}`,
    resultaat: reserveringsruimte,
  });

  // Stap 7: Totaal maximaal inlegbaar
  const totaalMaximaalInlegbaar = jaarruimteNetto + reserveringsruimte;
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Totaal maximaal inlegbaar in lijfrente dit jaar",
    berekening:
      `Jaarruimte + Reserveringsruimte\n` +
      `= ${fmt(jaarruimteNetto)} + ${fmt(reserveringsruimte)}\n` +
      `= ${fmt(totaalMaximaalInlegbaar)}`,
    resultaat: totaalMaximaalInlegbaar,
  });

  // Stap 8: Belastingvoordeel
  const marginaalTarief =
    input.brutojaarinkomen > params.belastingSchijfGrens
      ? params.belastingTarief2
      : params.belastingTarief1;
  const belastingVoordeelJaarruimte = Math.round(jaarruimteNetto * marginaalTarief);
  const belastingVoordeelTotaal = Math.round(totaalMaximaalInlegbaar * marginaalTarief);
  const tarifPerc = `${(marginaalTarief * 100).toFixed(2)}%`;
  stappen.push({
    stap: stapNummer++,
    omschrijving: "Belastingvoordeel",
    berekening:
      `Inkomen ${fmt(input.brutojaarinkomen)} > schijfgrens ${fmt(params.belastingSchijfGrens)}\n` +
      `→ marginaal tarief: ${tarifPerc} (toptarief box 1)\n\n` +
      `Voordeel op jaarruimte : ${tarifPerc} × ${fmt(jaarruimteNetto)} = ${fmt(belastingVoordeelJaarruimte)}\n` +
      `Voordeel op totale inleg: ${tarifPerc} × ${fmt(totaalMaximaalInlegbaar)} = ${fmt(belastingVoordeelTotaal)}`,
    resultaat: belastingVoordeelTotaal,
  });

  return {
    input,
    franchise,
    maxPremiegrondslag: params.maxPremiegrondslag,
    premiegrondslag,
    jaarruimteBruto,
    aftrekFactorA,
    jaarruimteNetto,
    maxReserveringsruimtePerJaar: params.maxReserveringsruimtePerJaar,
    maxReserveringsruimteTotaal,
    reserveringsruimte,
    totaalMaximaalInlegbaar,
    marginaalTarief,
    belastingVoordeelJaarruimte,
    belastingVoordeelTotaal,
    stappen,
  };
}

// ─── Voorbeeld: mevrouw De Vries ────────────────────────────────────────────

const inputDeVries: JaarruimteInput = {
  brutojaarinkomen: 95_000,
  factorA: 2_800,
  onbenutteRuimteVorigeJaren: 6_500,
  jaar: 2025,
};

export const resultaatDeVries = berekenJaarruimte(inputDeVries);
