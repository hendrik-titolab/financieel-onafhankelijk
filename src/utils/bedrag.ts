/**
 * Eén parser voor Nederlandse bedrag- en getalnotatie.
 *
 * Achtergrond. De invoervelden waren `<input type="number">` met daarachter een
 * eigen parser die punt-als-duizendtal en komma-als-decimaal verwachtte. Die twee
 * bijten elkaar: bij `type="number"` bepaalt de browser zelf wat een geldige
 * waarde is en wat hij doorgeeft, en dat verschilt per browser en per
 * toetsenbordindeling. In de audit van 7 september 2026 werd "50.000" correct
 * 50000, maar "1.234,56" werd 1.23456 en bleef dat ook na het verlaten van het
 * veld (bevinding 8).
 *
 * De velden zijn daarom tekstvelden geworden met `inputMode="decimal"`, zodat de
 * browser niets meer herschrijft en deze functie de enige plek is waar tekst een
 * getal wordt. Mobiel levert `inputMode="decimal"` bovendien een numeriek
 * toetsenbord op, dus dat gaat er niet op achteruit.
 *
 * De prijs: de spinner-pijltjes van `type="number"` vervallen. Dat is bewust.
 * Een pijltje dat een bedrag met 100 ophoogt weegt niet op tegen een veld dat
 * stilzwijgend een verkeerd getal doorgeeft.
 */

export interface BedragParse {
  /** Het getal, of null als de tekst niet te lezen was. */
  waarde: number | null
  /** Uitleg voor de gebruiker, of null als er niets mis is. */
  fout: string | null
}

/** Een leeg veld. Geen fout, maar ook geen waarde. */
const LEEG: BedragParse = { waarde: null, fout: null }

// Losse vormen die we accepteren. Bewust strikt: alles wat hier niet in past
// krijgt een melding in plaats van een stilzwijgende gok.
const HEEL_GETAL = /^-?\d+$/
const MET_DUIZENDTALLEN = /^-?\d{1,3}(\.\d{3})+$/
const MET_KOMMA = /^-?(\d{1,3}(\.\d{3})+|\d+),\d+$/
// "3.5" of "12.50": een punt gevolgd door één of twee cijfers is in het Nederlands
// geen duizendtalscheiding. Iemand die bij een percentage een punt typt bedoelt
// een decimaalteken, en dat laten we staan.
const PUNT_ALS_DECIMAAL = /^-?\d+\.\d{1,2}$/

/**
 * Leest een bedrag of getal in Nederlandse notatie.
 *
 * Geaccepteerd: 1234, 1234,56, 1.234, 1.234,56, 50.000, -250, 3.5, "€ 1.234,56".
 * Geweigerd: 1,2,3 (twee komma's), 1e5 (exponent), 12,5% (teken achteraan),
 * abc, en alles waar letters in staan.
 */
export function parseBedrag(raw: string): BedragParse {
  // Euroteken, spaties (ook de harde spatie die uit een geplakt bedrag komt) en
  // een expliciete plus mogen weg. Dat maakt plakken uit een spreadsheet of een
  // bankafschrift mogelijk zonder eerst te moeten opschonen.
  const s = raw
    .replace(/[€\s  ]/g, '')
    .replace(/^\+/, '')
    .trim()

  if (s === '' || s === '-') return LEEG

  const nietTeLezen: BedragParse = {
    waarde: null,
    fout: 'Gebruik een punt voor duizendtallen en een komma voor decimalen, bijvoorbeeld 1.234,56',
  }

  if (HEEL_GETAL.test(s)) return { waarde: Number(s), fout: null }

  if (MET_DUIZENDTALLEN.test(s)) {
    return { waarde: Number(s.replace(/\./g, '')), fout: null }
  }

  if (MET_KOMMA.test(s)) {
    return { waarde: Number(s.replace(/\./g, '').replace(',', '.')), fout: null }
  }

  if (PUNT_ALS_DECIMAAL.test(s)) return { waarde: Number(s), fout: null }

  return nietTeLezen
}

/**
 * Zoals parseBedrag, maar met de grenzen van het veld erbij.
 *
 * Begrenzen gebeurt pas bij het verlaten van het veld, niet tijdens het typen:
 * anders springt een half ingetypt getal onder je handen weg. Een waarde buiten
 * de grenzen wordt bijgetrokken én gemeld, zodat het niet stilzwijgend gebeurt.
 */
export function parseBedragBegrensd(
  raw: string,
  min?: number,
  max?: number
): BedragParse {
  const r = parseBedrag(raw)
  if (r.waarde === null) return r

  if (min !== undefined && r.waarde < min) {
    return { waarde: min, fout: `Laagste waarde is ${formatBedrag(min)}. Aangepast.` }
  }
  if (max !== undefined && r.waarde > max) {
    return { waarde: max, fout: `Hoogste waarde is ${formatBedrag(max)}. Aangepast.` }
  }
  return r
}

/** Terug naar Nederlandse notatie, zonder euroteken. */
export function formatBedrag(v: number): string {
  return v.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
}
