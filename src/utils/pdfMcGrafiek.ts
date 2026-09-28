import type { jsPDF } from 'jspdf'
import type { PercentilePoint } from '../types'

/**
 * Een Monte Carlo-grafiek rechtstreeks in de PDF getekend.
 *
 * Bij een scenario wil Hendrik beide simulaties in het rapport zien (28 september
 * 2026). Op het scherm staat alleen de grafiek met scenario, dus een schermafdruk
 * zoals zonder scenario (html2canvas) kan hier niet. Daarom tekent deze functie de
 * banden zelf, met dezelfde kleuren als WealthChart.tsx en voor beide grafieken
 * dezelfde schaal, zodat ze direct te vergelijken zijn.
 */

type Kleur = [number, number, number]
const BAND_BUITEN: Kleur = [182, 200, 216]  // #B6C8D8, P10 tot P90
const BAND_BINNEN: Kleur = [131, 160, 185]  // #83A0B9, P25 tot P75
const INKT: Kleur = [41, 57, 46]            // #29392E, mediaan
const TEKST: Kleur = [76, 90, 80]
const RASTER: Kleur = [228, 225, 220]
const PENSIOEN: Kleur = [110, 127, 114]

export interface Schaal {
  xMin: number
  xMax: number
  yMax: number
}

/** Eén schaal voor meerdere grafieken: de ruimste leeftijden en de hoogste P90. */
export function gezamenlijkeSchaal(reeksen: PercentilePoint[][]): Schaal {
  const alle = reeksen.flat()
  return {
    xMin: Math.min(...alle.map(p => p.age)),
    xMax: Math.max(...alle.map(p => p.age)),
    yMax: Math.max(1, ...alle.map(p => p.p90)),
  }
}

/** Een asbedrag, kort: € 1,2 mln of € 450.000. */
export function asBedrag(v: number): string {
  if (v >= 1_000_000) {
    return `€ ${(v / 1_000_000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} mln`
  }
  return `€ ${(Math.round(v / 1000) * 1000).toLocaleString('nl-NL')}`
}

export function tekenMcGrafiek(
  pdf: jsPDF,
  x: number, y: number, breedte: number, hoogte: number,
  data: PercentilePoint[],
  schaal: Schaal,
  titel: string,
  pensioenLeeftijd: number,
): void {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...INKT)
  pdf.text(titel, x, y)

  const boven = y + 4
  const links = x + 17          // ruimte voor de bedragen op de y-as
  const w = breedte - 17
  const h = hoogte - 12         // ruimte voor de titel en de leeftijden eronder
  const X = (leeftijd: number) =>
    links + ((leeftijd - schaal.xMin) / ((schaal.xMax - schaal.xMin) || 1)) * w
  const Y = (bedrag: number) => boven + h - (Math.max(0, bedrag) / schaal.yMax) * h

  // Raster met bedragen.
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setLineWidth(0.1)
  for (const f of [0, 0.5, 1]) {
    const yy = Y(schaal.yMax * f)
    pdf.setDrawColor(...RASTER)
    pdf.line(links, yy, links + w, yy)
    pdf.setTextColor(...TEKST)
    pdf.text(asBedrag(schaal.yMax * f), links - 1, yy + 1, { align: 'right' })
  }

  // Een band als gesloten veelhoek: de bovengrens heen, de ondergrens terug.
  const band = (bovengrens: (p: PercentilePoint) => number, ondergrens: (p: PercentilePoint) => number, kleur: Kleur) => {
    const punten = [
      ...data.map(p => [X(p.age), Y(bovengrens(p))]),
      ...[...data].reverse().map(p => [X(p.age), Y(ondergrens(p))]),
    ]
    if (punten.length < 3) return
    const stappen = punten.slice(1).map((pt, i) => [pt[0] - punten[i][0], pt[1] - punten[i][1]])
    pdf.setFillColor(...kleur)
    pdf.lines(stappen, punten[0][0], punten[0][1], [1, 1], 'F', true)
  }
  band(p => p.p90, p => p.p10, BAND_BUITEN)
  band(p => p.p75, p => p.p25, BAND_BINNEN)

  // Mediaan.
  pdf.setDrawColor(...INKT)
  pdf.setLineWidth(0.5)
  for (let i = 1; i < data.length; i++) {
    pdf.line(X(data[i - 1].age), Y(data[i - 1].p50), X(data[i].age), Y(data[i].p50))
  }

  // Pensioendatum, gestippeld.
  pdf.setDrawColor(...PENSIOEN)
  pdf.setLineWidth(0.2)
  pdf.setLineDashPattern([1, 1], 0)
  pdf.line(X(pensioenLeeftijd), boven, X(pensioenLeeftijd), boven + h)
  pdf.setLineDashPattern([], 0)

  // Leeftijden onder de as, om de tien jaar.
  pdf.setTextColor(...TEKST)
  for (let a = Math.ceil(schaal.xMin / 10) * 10; a <= schaal.xMax; a += 10) {
    pdf.text(String(a), X(a), boven + h + 4, { align: 'center' })
  }
}
