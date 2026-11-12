import { parseBedragBegrensd, type BedragParse } from 'rekenkern/utils/bedrag'

/**
 * Wat een leeg of onleesbaar veld wordt. Standaard 0, of de ondergrens als die boven 0 ligt.
 *
 * Los van `min`: in de box 3-tool hebben drie velden van het tegenbewijs een ondergrens van
 * -100.000.000, omdat een negatief bedrag daar mag. Viel een leeg veld terug op de ondergrens,
 * dan stond er -100.000.000 en werd de belasting € 0 (review 10 november 2026, deel 2, C1).
 */
export function terugvalVoor(min: number | undefined, terugval?: number): number {
  if (terugval !== undefined) return terugval
  return min !== undefined && min > 0 ? min : 0
}

/** De waarde die een invoerveld krijgt als je het verlaat: begrensd, of de terugval. */
export function verwerkInvoer(
  raw: string,
  { min, max, terugval }: { min?: number; max?: number; terugval?: number },
): BedragParse & { waarde: number } {
  const r = parseBedragBegrensd(raw, min, max)
  if (r.waarde === null) return { waarde: terugvalVoor(min, terugval), fout: r.fout }
  return { waarde: r.waarde, fout: r.fout }
}
