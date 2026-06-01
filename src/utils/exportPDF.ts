import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
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
  mc: MonteCarloResult,
  clientName: string,
  chartElementId: string
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 16
  const contentW = pageW - margin * 2

  // --- Header ---
  pdf.setFillColor(37, 99, 235)
  pdf.rect(0, 0, pageW, 28, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Financiële Planning', margin, 13)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Opgesteld voor: ${clientName}`, margin, 21)
  pdf.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, pageW - margin, 21, { align: 'right' })

  let y = 36

  // --- Key metrics row ---
  pdf.setTextColor(15, 23, 42)
  const surplus = result.projectedCapital - result.requiredCapital
  const isOnTrack = surplus >= 0

  const metrics = [
    { label: 'Verwacht eindvermogen', value: eur(result.projectedCapital), color: [37, 99, 235] as [number, number, number] },
    { label: 'Benodigd eindvermogen', value: eur(result.requiredCapital), color: [100, 116, 139] as [number, number, number] },
    { label: isOnTrack ? 'Overschot' : 'Tekort', value: eur(Math.abs(surplus)), color: isOnTrack ? [5, 150, 105] as [number, number, number] : [220, 38, 38] as [number, number, number] },
    { label: 'Slagingskans', value: pct(mc.successRate), color: mc.successRate >= 80 ? [5, 150, 105] as [number, number, number] : mc.successRate >= 60 ? [217, 119, 6] as [number, number, number] : [220, 38, 38] as [number, number, number] },
  ]

  const boxW = contentW / 4 - 2
  metrics.forEach((m, i) => {
    const x = margin + i * (boxW + 2.67)
    pdf.setFillColor(248, 250, 252)
    pdf.roundedRect(x, y, boxW, 22, 2, 2, 'F')
    pdf.setFontSize(7)
    pdf.setTextColor(100, 116, 139)
    pdf.text(m.label, x + boxW / 2, y + 7, { align: 'center' })
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...m.color)
    pdf.text(m.value, x + boxW / 2, y + 16, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
  })
  y += 28

  // --- Inkomen per fase ---
  pdf.setTextColor(15, 23, 42)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Maandelijks inkomen per fase', margin, y)
  y += 6

  result.incomePhases.forEach((phase, fi) => {
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(fi % 2 === 0 ? 248 : 239, fi % 2 === 0 ? 250 : 246, fi % 2 === 0 ? 252 : 255)
    pdf.rect(margin, y, contentW, 7, 'F')
    pdf.setTextColor(37, 99, 235)
    pdf.text(phase.label, margin + 2, y + 4.5)
    pdf.setTextColor(15, 23, 42)
    pdf.text(`Totaal: ${eur(phase.total)}/mnd`, margin + contentW, y + 4.5, { align: 'right' })
    y += 7
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(100, 116, 139)
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
      pdf.setDrawColor(37, 99, 235)
      pdf.line(margin, y, margin + contentW, y)
      y += 2
      pdf.setFont('helvetica', 'bold')
    } else {
      pdf.setFont('helvetica', 'normal')
    }
    pdf.setFontSize(9)
    pdf.setTextColor(15, 23, 42)
    pdf.text(label, margin + 2, y + 4)
    pdf.text(value, margin + contentW, y + 4, { align: 'right' })
    y += 7
  })
  y += 4

  // --- Chart ---
  const chartEl = document.getElementById(chartElementId)
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, { scale: 1.5, backgroundColor: '#ffffff' })
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
  pdf.setTextColor(15, 23, 42)
  pdf.text('Aannames & parameters', margin, y)
  y += 5

  const assumptions = [
    `Leeftijd: ${inputs.currentAge} jr | Pensioen: ${inputs.retirementAge} jr | AOW: ${inputs.aowStartAge} jr | Werkgeverspensioen: ${inputs.employerPensionStartAge} jr | Levensverwachting: ${inputs.lifeExpectancy} jr`,
    `Rendement voor pensioen: ${pct(inputs.returnBeforeRetirement)} nominaal | Na pensioen: ${pct(inputs.returnAfterRetirement)} | Inflatie: ${pct(inputs.inflation)}`,
    `Maandelijkse inleg: ${eur(inputs.monthlyContribution)} | Huidig vermogen: ${eur(inputs.currentCapital)}`,
    `Alle bedragen in huidig koopkracht (reëel rendement). Monte Carlo: 2.000 simulaties.`,
  ]

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(7.5)
  assumptions.forEach(line => {
    pdf.text(line, margin, y)
    y += 4.5
  })

  // --- Footer ---
  pdf.setFillColor(248, 250, 252)
  pdf.rect(0, 285, pageW, 12, 'F')
  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text('Dit rapport is indicatief en geen financieel advies. Rendementen uit het verleden bieden geen garantie voor de toekomst.', pageW / 2, 291, { align: 'center' })

  const filename = `financiele-planning_${clientName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(filename)
}
