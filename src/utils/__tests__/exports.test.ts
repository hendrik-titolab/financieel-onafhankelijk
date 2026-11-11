// De PDF- en Excel-export, gegenereerd in Node met de echte exportcode, en gecontroleerd op de
// kernbedragen (review 10 november 2026, deel 2, D2). Alleen de browserstukken worden nagebootst:
// de downloadlink, en de grafiek van het scherm (html2canvas).
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { BerekeningsSet, PensionInputs } from 'rekenkern/types/index'
import { calculatePension } from 'rekenkern/utils/pensionCalc'
import { runMonteCarlo } from 'rekenkern/utils/monteCarlo'
import { MODEL_VERSIE, PARAMETER_JAAR } from 'rekenkern/config/modelVersie'
import { GEEN_SCENARIO } from 'rekenkern/utils/scenarios'
import { RISICOPROFIELEN } from 'rekenkern/config/risicoprofielen'
import { AOW_NETTO } from 'rekenkern/utils/pensionCalc'
import { slagingskansPercentage } from 'rekenkern/utils/slagingskansTekst'

vi.mock('html2canvas', () => ({ default: vi.fn() }))

// jsPDF zet save() per document; in Node zou die een bestand schrijven. Hier vangen we de inhoud.
const pdfVangst = vi.hoisted(() => ({ tekst: '', keer: 0 }))
vi.mock('jspdf', async (orig) => {
  const echt = (await orig()) as { default: new (...a: unknown[]) => { save: unknown; output: () => string } }
  function NepPdf(...args: unknown[]) {
    const pdf = new echt.default(...args)
    pdf.save = () => { pdfVangst.tekst = pdf.output(); pdfVangst.keer++; return pdf }
    return pdf
  }
  return { ...echt, default: NepPdf }
})

// Vaste invoer, dicht bij de standaard van de planner, zodat de test niet meeloopt met een
// wijziging in het scherm.
const inputs: PensionInputs = {
  currentAge: 40, retirementAge: 67, lifeExpectancy: 90,
  currentCapital: 100_000, monthlyContribution: 500, contributionFrequency: 'maandelijks',
  returnBeforeRetirement: RISICOPROFIELEN.neutraal.rendementVoor,
  returnAfterRetirement: RISICOPROFIELEN.neutraal.rendementNa,
  inflation: 3, kostenPct: 0, vermogensbelastingPct: 0, vermogensbelastingHandmatig: true,
  currentIncome: 80_000, currentIncomeType: 'bruto',
  desiredRetirementIncome: 4_000, desiredRetirementIncomeType: 'netto',
  woonsituatie: 'alleenstaand', aowMaandBedragNetto: AOW_NETTO.alleenstaand, aowStartAge: 67,
  aowVakantiegeld: true,
  partner: {
    actief: false, leeftijd: 40, aowMaandBedragNetto: AOW_NETTO.samenwonend, aowStartAge: 67,
    employerPension: 0, employerPensionStartAge: 67, employerPensionIndexatie: 'meestijgend',
  },
  employerPension: 1_000, employerPensionStartAge: 67, employerPensionIndexatie: 'meestijgend',
  lijfrenteUitkering: 0, lijfrenteStartAge: 67, lijfrenteSoort: 'levenslang',
  lijfrenteEindLeeftijd: 87, lijfrenteIndexatie: 'vast',
  lifeEvents: [],
  volatilityPre: RISICOPROFIELEN.neutraal.volatiliteitVoor,
  volatilityPost: RISICOPROFIELEN.neutraal.volatiliteitNa,
  riskProfile: 'neutraal', useCustomReturns: false,
}
const result = calculatePension(inputs, { currentYear: 2026 })
const mc = runMonteCarlo(inputs, { currentYear: 2026 })
const set: BerekeningsSet = {
  inputs, result, mc, scenarios: GEEN_SCENARIO, basis: null,
  peildatum: '2026-11-11T10:00:00.000Z', modelVersie: MODEL_VERSIE, parameterJaar: PARAMETER_JAAR,
}

// Wat de export als download aanbiedt, onderschept.
let blob: Blob | null = null
const origineel = { document: globalThis.document, createObjectURL: URL.createObjectURL }

beforeAll(() => {
  const link = { href: '', download: '', click() {} }
  ;(globalThis as Record<string, unknown>).document = {
    createElement: () => link,
    getElementById: () => null, // geen grafiek van het scherm: die is browserwerk
    body: { appendChild() {}, removeChild() {} },
  }
  URL.createObjectURL = (b: Blob) => { blob = b; return 'blob:test' }
})

afterAll(() => {
  ;(globalThis as Record<string, unknown>).document = origineel.document
  URL.createObjectURL = origineel.createObjectURL
})

describe('Excel-export', () => {
  it('bevat de kernbedragen van de berekening', async () => {
    const { exportToExcel } = await import('../exportExcel')
    await exportToExcel(set, 'Test')
    expect(blob).not.toBeNull()
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await blob!.arrayBuffer())
    const waarden = new Map<string, unknown>()
    wb.eachSheet(ws => ws.eachRow(r => {
      const [, label, waarde] = r.values as unknown[]
      if (typeof label === 'string') waarden.set(label, waarde)
    }))
    expect(waarden.get('Modelversie')).toBe(MODEL_VERSIE)
    expect(waarden.get('Verwacht eindvermogen')).toBe(Math.round(result.projectedCapital))
    expect(waarden.get('Benodigd eindvermogen')).toBe(Math.round(result.requiredCapital))
    expect(waarden.get('Verschil')).toBe(Math.round(result.projectedCapital - result.requiredCapital))
    expect(waarden.get('Kans op volledig inkomensdoel')).toBe(slagingskansPercentage(mc.successRate))
  })
})

describe('PDF-export', () => {
  it('bevat de kernbedragen van de berekening', async () => {
    const { exportToPDF } = await import('../exportPDF')
    await exportToPDF(set, 'Test', 'grafiek')
    expect(pdfVangst.keer).toBe(1)
    const pdfTekst = pdfVangst.tekst
    const bedrag = (v: number) => Math.abs(Math.round(v)).toLocaleString('nl-NL')
    expect(pdfTekst).toContain(`Modelversie ${MODEL_VERSIE}`)
    expect(pdfTekst).toContain(bedrag(result.projectedCapital))
    expect(pdfTekst).toContain(bedrag(result.requiredCapital))
  })
})
