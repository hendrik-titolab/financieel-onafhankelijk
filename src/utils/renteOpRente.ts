/**
 * Rente op rente: de eindwaarde van een eenmalige inleg en van een vaste maandelijkse inleg.
 *
 * Twee tools delen deze formules (/tools/rente-op-rente en /tools/maandelijks-beleggen) en de
 * uitkomsten moeten toetsbaar zijn tegen de rekenvoorbeelden in de uitlegartikelen. Daarom staat
 * de logica hier en niet in het component, anders dan bij de Inflatie-tool.
 *
 * Alles is NOMINAAL: vóór inflatie, kosten en belasting. Dat wijkt bewust af van de FO-planner,
 * die in reële koopkracht rekent. Beide toolpagina's benoemen dat expliciet.
 *
 * Conventie bij maandinleg: storting aan het begin van elke maand (annuïteit vooraf), met een
 * maandrendement afgeleid uit het jaarrendement via (1 + r)^(1/12) − 1. Het opgegeven percentage
 * is dus een EFFECTIEF jaarrendement, geen nominaal jaarrendement met maandelijkse bijschrijving.
 *
 * BEWUSTE AFWIJKING VAN pensionCalc.ts. simulateAccumulation() rekent de jaarinleg met de
 * mid-year-benadering × sqrt(1 + r); hier wordt exact per maand gerekend. Het verschil zit
 * volledig in één factor per jaarinleg: bij 7% geeft deze module 12,45029716 / 12 = 1,03752476
 * en de planner sqrt(1,07) = 1,03440804, een verschil van 0,3013%. Bij € 1.000 per maand over
 * 30 jaar bij 7% is dat € 1.176.064,86 hier tegen € 1.172.531,97 in de planner. Ter vergelijking:
 * storting achteraf in plaats van vooraf geeft € 1.169.452,60, dus een gróter verschil. De
 * planner-benadering ligt netjes tussen vooraf en achteraf in. Dit is een conventieverschil, geen
 * rekenfout aan een van beide kanten, en het sluit aan op auditbevinding 14 (een maandmotor in de
 * planner is de duurste ingreep met de kleinste opbrengst). renteOpRente.test.ts pint die 0,3013%
 * vast, zodat het opvalt zodra iemand aan een van beide kanten draait.
 */

/** Rijen van de matrix: jaarrendement als fractie. Alleen de React-laag deelt door 100. */
export const MATRIX_RENDEMENTEN = [0.02, 0.04, 0.06, 0.08, 0.1] as const

/** Kolommen van de matrix: looptijd in jaren. */
export const MATRIX_LOOPTIJDEN = [5, 10, 15, 20, 25, 30, 40, 50] as const

/** Aantal tintstappen van de heatmap, zie heatIndex(). */
export const HEAT_STAPPEN = 5

export interface Eindwaarde {
  /** Wat er aan het eind staat. */
  eindwaarde: number
  /** Wat je er zelf in hebt gestopt. */
  totaalInleg: number
  /** Het deel dat uit rendement komt: eindwaarde − totaalInleg. */
  rendement: number
  /** Hoe vaak de inleg zich vermenigvuldigt. 0 als er niets is ingelegd. */
  vermenigvuldiging: number
}

export interface MatrixCel extends Eindwaarde {
  jaarrendement: number
  jaren: number
  /** Eindwaarde per euro inleg. Onafhankelijk van het ingevulde bedrag. */
  factor: number
  /** Tintstap 0 tot en met HEAT_STAPPEN. Beweegt niet mee met de inleg, zie heatIndex(). */
  heat: number
}

export interface Matrix {
  rendementen: readonly number[]
  looptijden: readonly number[]
  /** Rijen op rendement, kolommen op looptijd. */
  rijen: MatrixCel[][]
}

/** Jaren: heel getal, 0 tot en met 60. */
function klemJaren(jaren: number): number {
  if (!Number.isFinite(jaren)) return 0
  return Math.min(60, Math.max(0, Math.round(jaren)))
}

/** Inleg: nooit negatief. */
function klemInleg(inleg: number): number {
  if (!Number.isFinite(inleg)) return 0
  return Math.max(0, inleg)
}

/** Rendement: alles boven −100%. Geen bovengrens, wie 25% invult krijgt 25%. */
function klemRendement(jaarrendement: number): number {
  if (!Number.isFinite(jaarrendement)) return 0
  return Math.max(-0.9999, jaarrendement)
}

/**
 * Het maandrendement dat twaalf keer samengesteld precies op het jaarrendement uitkomt.
 * Bij 6% per jaar is dat 0,4867550565% per maand, niet 0,5%.
 */
export function maandrente(jaarrendement: number): number {
  return Math.pow(1 + klemRendement(jaarrendement), 1 / 12) - 1
}

/**
 * Eindwaarde van € 1 maandinleg, gestort aan het begin van elke maand.
 *
 * Bij een rendement van 0 is ((1 + i)^n − 1) / i een deling 0/0. Het prototype gaf daar
 * letterlijk NaN, en het rendementveld van de rekentool accepteert 0. Zonder deze guard komt er
 * "€ NaN" op het scherm te staan.
 */
export function eindwaardePerEuroMaandinleg(jaarrendement: number, jaren: number): number {
  const n = klemJaren(jaren) * 12
  if (n === 0) return 0
  const i = maandrente(jaarrendement)
  if (i === 0) return n
  return ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
}

/** Groeifactor van een eenmalige inleg: (1 + r)^n. */
export function groeifactorEenmalig(jaarrendement: number, jaren: number): number {
  return Math.pow(1 + klemRendement(jaarrendement), klemJaren(jaren))
}

function maakEindwaarde(eindwaarde: number, totaalInleg: number): Eindwaarde {
  return {
    eindwaarde,
    totaalInleg,
    rendement: eindwaarde - totaalInleg,
    vermenigvuldiging: totaalInleg > 0 ? eindwaarde / totaalInleg : 0,
  }
}

/** Wat een vaste maandelijkse inleg wordt. */
export function eindwaardeMaandinleg(
  maandinleg: number,
  jaarrendement: number,
  jaren: number
): Eindwaarde {
  const inleg = klemInleg(maandinleg)
  const j = klemJaren(jaren)
  return maakEindwaarde(inleg * eindwaardePerEuroMaandinleg(jaarrendement, j), inleg * 12 * j)
}

/** Wat een eenmalige inleg wordt die je laat staan. */
export function eindwaardeEenmaligeInleg(
  inleg: number,
  jaarrendement: number,
  jaren: number
): Eindwaarde {
  const bedrag = klemInleg(inleg)
  return maakEindwaarde(bedrag * groeifactorEenmalig(jaarrendement, jaren), bedrag)
}

/**
 * Hoelang tot een bedrag zich verdubbelt: ln(2) / ln(1 + r). Bij 6% is dat 11,9 jaar, wat de
 * vuistregel van 72 (72 / 6 = 12) dicht benadert. Bij 0% of lager verdubbelt er niets.
 */
export function verdubbeltijd(jaarrendement: number): number {
  const r = klemRendement(jaarrendement)
  if (r <= 0) return Infinity
  return Math.LN2 / Math.log(1 + r)
}

/**
 * Tintstap voor een cel in de heatmap: logaritmisch genormaliseerd tussen de kleinste en de
 * grootste factor van de matrix, afgerond op HEAT_STAPPEN stappen.
 *
 * Het is belangrijk dat dit over de FACTOR gaat en niet over het bedrag: de inleg valt daarmee
 * structureel uit de berekening weg, dus de tint staat stil terwijl je een bedrag typt. Het
 * prototype gebruikte log(waarde) / log(maxwaarde), en dat gaf twee problemen tegelijk. Alle
 * veertig cellen kwamen tussen 0,64 en 1,00 uit, dus geen verloop maar een overal even donker
 * vlak. En omdat log(max) meebewoog met de invoer, verschoot de hele tabel van kleur tijdens het
 * typen.
 */
export function heatIndex(factor: number, min: number, max: number): number {
  if (!(max > min) || factor <= 0 || min <= 0) return 0
  const genormaliseerd = (Math.log(factor) - Math.log(min)) / (Math.log(max) - Math.log(min))
  return Math.round(Math.min(1, Math.max(0, genormaliseerd)) * HEAT_STAPPEN)
}

function bouwMatrix(
  inleg: number,
  factorVan: (jaarrendement: number, jaren: number) => number,
  eindwaardeVan: (inleg: number, jaarrendement: number, jaren: number) => Eindwaarde
): Matrix {
  const factoren = MATRIX_RENDEMENTEN.map((r) => MATRIX_LOOPTIJDEN.map((j) => factorVan(r, j)))
  const plat = factoren.flat()
  const min = Math.min(...plat)
  const max = Math.max(...plat)

  const rijen = MATRIX_RENDEMENTEN.map((r, ri) =>
    MATRIX_LOOPTIJDEN.map((j, ki) => {
      const factor = factoren[ri][ki]
      return {
        ...eindwaardeVan(inleg, r, j),
        jaarrendement: r,
        jaren: j,
        factor,
        heat: heatIndex(factor, min, max),
      }
    })
  )

  return { rendementen: MATRIX_RENDEMENTEN, looptijden: MATRIX_LOOPTIJDEN, rijen }
}

/** De volledige matrix voor een vaste maandelijkse inleg. */
export function matrixMaandinleg(maandinleg: number): Matrix {
  return bouwMatrix(maandinleg, eindwaardePerEuroMaandinleg, eindwaardeMaandinleg)
}

/** De volledige matrix voor een eenmalige inleg. */
export function matrixEenmaligeInleg(inleg: number): Matrix {
  return bouwMatrix(inleg, groeifactorEenmalig, eindwaardeEenmaligeInleg)
}
