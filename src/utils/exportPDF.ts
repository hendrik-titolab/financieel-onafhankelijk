import type { PensionResult, MonteCarloResult, PensionInputs } from '../types'

function eur(v: number): string {
  return `€ ${Math.round(v).toLocaleString('nl-NL')}`
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`
}

export async function exportToPDF(
  inputs: PensionInputs,
  result: PensionResult,
  mc: MonteCarloResult | null,
  clientName: string,
  chartElementId: string
) {
  // jspdf + html2canvas zijn zwaar en alleen nodig bij export → dynamisch laden
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 16
  const contentW = pageW - margin * 2
  const naam = clientName.trim() || 'Naamloze berekening'

  // --- Header ---
  pdf.setFillColor(41, 57, 46)
  pdf.rect(0, 0, pageW, 28, 'F')
  pdf.setTextColor(235, 233, 230)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Financiële Planning', margin, 13)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Berekening: ${naam}`, margin, 21)
  pdf.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, pageW - margin, 21, { align: 'right' })

  let y = 36

  // --- Key metrics row ---
  pdf.setTextColor(41, 57, 46)
  const surplus = result.projectedCapital - result.requiredCapital
  const isOnTrack = surplus >= 0

  const metrics = [
    { label: 'Verwacht eindvermogen', value: eur(result.projectedCapital), color: [41, 57, 46] as [number, number, number] },
    { label: 'Benodigd eindvermogen', value: eur(result.requiredCapital), color: [76, 90, 80] as [number, number, number] },
    { label: isOnTrack ? 'Overschot' : 'Tekort', value: eur(Math.abs(surplus)), color: isOnTrack ? [41, 57, 46] as [number, number, number] : [168, 90, 60] as [number, number, number] },
  ]

  const boxW = contentW / 3 - 2.67
  metrics.forEach((m, i) => {
    const x = margin + i * (boxW + 4)
    pdf.setFillColor(247, 246, 244)
    pdf.roundedRect(x, y, boxW, 22, 2, 2, 'F')
    pdf.setFontSize(7)
    pdf.setTextColor(76, 90, 80)
    pdf.text(m.label, x + boxW / 2, y + 7, { align: 'center' })
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...m.color)
    pdf.text(m.value, x + boxW / 2, y + 16, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
  })
  y += 28

  // --- Slagingskans (uitkomst Monte Carlo) — prominent weergegeven ---
  const kansKleur = (v: number): [number, number, number] =>
    v >= 80 ? [41, 57, 46] : v >= 60 ? [154, 131, 91] : [168, 90, 60]

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(41, 57, 46)
  pdf.text('Ben ik financieel onafhankelijk?', margin, y)
  y += 5

  const halfW = contentW / 2 - 2
  const kansen: { label: string; value: number | null }[] = [
    { label: 'Kans op 100% van je inkomensdoel', value: mc ? mc.successRate : null },
    { label: 'Kans op 75% van je inkomensdoel', value: mc ? mc.successRate75 : null },
  ]
  kansen.forEach((k, i) => {
    const x = margin + i * (halfW + 4)
    const kleur: [number, number, number] = k.value === null ? [76, 90, 80] : kansKleur(k.value)
    pdf.setFillColor(kleur[0], kleur[1], kleur[2])
    pdf.roundedRect(x, y, halfW, 20, 2, 2, 'F')
    pdf.setTextColor(235, 233, 230)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(k.label, x + halfW / 2, y + 7, { align: 'center' })
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.text(k.value === null ? 'Niet berekend' : pct(k.value), x + halfW / 2, y + 15.5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
  })
  y += 26

  // --- Inkomen per fase ---
  pdf.setTextColor(41, 57, 46)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Maandelijks inkomen per fase', margin, y)
  y += 6

  result.incomePhases.forEach((phase, fi) => {
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(fi % 2 === 0 ? 247 : 255, fi % 2 === 0 ? 246 : 253, fi % 2 === 0 ? 244 : 250)
    pdf.rect(margin, y, contentW, 7, 'F')
    pdf.setTextColor(41, 57, 46)
    pdf.text(phase.label, margin + 2, y + 4.5)
    pdf.setTextColor(41, 57, 46)
    pdf.text(`Totaal: ${eur(phase.total)}/mnd`, margin + contentW, y + 4.5, { align: 'right' })
    y += 7
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(76, 90, 80)
    pdf.text(
      `Eigen vermogen: ${eur(phase.incomeFromCapital)}   AOW: ${eur(phase.aow)}   Werkgever: ${eur(phase.employerPension)}`,
      margin + 4, y + 3.5
    )
    y += 5
  })

  const incomeRows = [
    ['Gewenst netto inkomen', eur(result.desiredMonthlyNetto)],
    ['Restkapitaal op ' + inputs.lifeExpectancy + ' jaar', eur(result.surplusAtEnd)],
  ]

  incomeRows.forEach(([label, value], i) => {
    const isFirst = i === 0
    if (isFirst) {
      pdf.setDrawColor(41, 57, 46)
      pdf.line(margin, y, margin + contentW, y)
      y += 2
      pdf.setFont('helvetica', 'bold')
    } else {
      pdf.setFont('helvetica', 'normal')
    }
    pdf.setFontSize(9)
    pdf.setTextColor(41, 57, 46)
    pdf.text(label, margin + 2, y + 4)
    pdf.text(value, margin + contentW, y + 4, { align: 'right' })
    y += 7
  })
  y += 4

  // --- Chart ---
  const chartEl = document.getElementById(chartElementId)
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, { scale: 1.5, backgroundColor: '#F7F6F4' })
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const imgH = (canvas.height / canvas.width) * contentW
      const chartH = Math.min(imgH, 70)
      pdf.addImage(imgData, 'JPEG', margin, y, contentW, chartH)
      y += chartH + 6
    } catch {
      // Chart capture failed silently
    }
  }

  // --- Aannames ---
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(41, 57, 46)
  pdf.text('Aannames & parameters', margin, y)
  y += 5

  const assumptions = [
    `Leeftijd: ${inputs.currentAge} jr | Pensioen: ${inputs.retirementAge} jr | AOW: ${inputs.aowStartAge} jr | Werkgeverspensioen: ${inputs.employerPensionStartAge} jr | Levensverwachting: ${inputs.lifeExpectancy} jr`,
    `Rendement voor pensioen: ${pct(inputs.returnBeforeRetirement)} nominaal | Na pensioen: ${pct(inputs.returnAfterRetirement)} | Inflatie: ${pct(inputs.inflation)}`,
    `Maandelijkse inleg: ${eur(inputs.monthlyContribution)} | Huidig vermogen: ${eur(inputs.currentCapital)}`,
    `Alle bedragen in huidig koopkracht (reëel rendement). Monte Carlo: 2.000 simulaties.`,
  ]

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(76, 90, 80)
  pdf.setFontSize(7.5)
  assumptions.forEach(line => {
    pdf.text(line, margin, y)
    y += 4.5
  })

  // --- Footer ---
  pdf.setFillColor(247, 246, 244)
  pdf.rect(0, 285, pageW, 12, 'F')
  pdf.setFontSize(7)
  pdf.setTextColor(110, 127, 114)
  pdf.text('Dit rapport is indicatief en geen financieel advies. Rendementen uit het verleden bieden geen garantie voor de toekomst.', pageW / 2, 291, { align: 'center' })

  const filename = `financiele-planning_${naam.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(filename)
}
