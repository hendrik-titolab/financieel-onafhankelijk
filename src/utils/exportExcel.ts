import * as XLSX from 'xlsx'
import type { PensionInputs, PensionResult, MonteCarloResult } from '../types'

function eur(v: number) {
  return `€ ${Math.round(v).toLocaleString('nl-NL')}`
}

export function exportToExcel(
  inputs: PensionInputs,
  result: PensionResult,
  mc: MonteCarloResult,
  clientName: string
) {
  const wb = XLSX.utils.book_new()

  // --- Sheet 1: Invoer ---
  const inputRows = [
    ['FINANCIËLE PLANNING - INVOER', ''],
    ['Klant', clientName],
    ['Datum', new Date().toLocaleDateString('nl-NL')],
    ['', ''],
    ['LEEFTIJD', ''],
    ['Huidige leeftijd', inputs.currentAge],
    ['Pensioenleeftijd', inputs.retirementAge],
    ['Levensverwachting', inputs.lifeExpectancy],
    ['', ''],
    ['VERMOGEN & INLEG', ''],
    ['Huidig vermogen', inputs.currentCapital],
    ['Maandelijkse inleg', inputs.monthlyContribution],
    ['Inlegfrequentie', inputs.contributionFrequency],
    ['', ''],
    ['RENDEMENT', ''],
    ['Rendement voor pensioendatum (%)', inputs.returnBeforeRetirement],
    ['Rendement na pensioendatum (%)', inputs.returnAfterRetirement],
    ['Inflatie (%)', inputs.inflation],
    ['Volatiliteit voor pensioendatum (%)', inputs.volatilityPre],
    ['Volatiliteit na pensioendatum (%)', inputs.volatilityPost],
    ['', ''],
    ['INKOMEN', ''],
    ['Huidig inkomen', inputs.currentIncome],
    ['Inkomenstype', inputs.currentIncomeType],
    ['Gewenst pensioeninkomen', inputs.desiredRetirementIncome],
    ['Pensioeninkomentype', inputs.desiredRetirementIncomeType],
    ['', ''],
    ['PENSIOENUITKERINGEN', ''],
    ['AOW-type', inputs.aowType === 'alleenstaand' ? 'Alleenstaand' : 'Samenwonend/gehuwd'],
    ['AOW-percentage (%)', inputs.aowPercentage],
    ['AOW ingangsdatum (leeftijd)', inputs.aowStartAge],
    ['Werkgeverspensioen (bruto/maand)', inputs.employerPension],
    ['Werkgeverspensioen ingangsdatum (leeftijd)', inputs.employerPensionStartAge],
    ['', ''],
    ['LIFE EVENTS', ''],
    ...((inputs.lifeEvents ?? []).length > 0
      ? (inputs.lifeEvents ?? []).map(e => [`${e.name} (${e.year})`, e.amount])
      : [['(geen)', '']]
    ),
    ['Totaal inkomsten', (inputs.lifeEvents ?? []).filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)],
    ['Totaal uitgaven', (inputs.lifeEvents ?? []).filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0)],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(inputRows)
  ws1['!cols'] = [{ wch: 35 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Invoer')

  // --- Sheet 2: Resultaten ---
  const phaseRows: (string | number)[][] = []
  result.incomePhases.forEach(p => {
    phaseRows.push([p.label, '', '', ''])
    phaseRows.push(['  Eigen vermogen', eur(p.incomeFromCapital), 'AOW', eur(p.aow)])
    phaseRows.push(['  Werkgeverspensioen', eur(p.employerPension), 'Totaal', eur(p.total)])
  })

  const resultRows = [
    ['FINANCIËLE PLANNING - RESULTATEN', ''],
    ['', ''],
    ['Verwacht eindvermogen', eur(result.projectedCapital)],
    ['Benodigd eindvermogen', eur(result.requiredCapital)],
    ['Verschil', eur(result.projectedCapital - result.requiredCapital)],
    ['Restkapitaal op ' + inputs.lifeExpectancy + ' jaar', eur(result.surplusAtEnd)],
    ['', ''],
    ['INKOMEN PER FASE (maandelijks netto)', ''],
    ...phaseRows,
    ['', ''],
    ['Gewenst netto inkomen', eur(result.desiredMonthlyNetto)],
    ['Benodigde maandinleg om doel te halen', eur(Math.max(0, result.requiredMonthlyContribution))],
    ['', ''],
    ['MONTE CARLO ANALYSE', ''],
    ['Slagingskans', `${mc.successRate.toFixed(1)}%`],
    ['Aantal simulaties', '2000'],
    ['', ''],
    ['Alle bedragen in huidig koopkracht (reëel rendement)'],
  ]

  const ws2 = XLSX.utils.aoa_to_sheet(resultRows)
  ws2['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Resultaten')

  // --- Sheet 3: Jaarlijkse Prognose ---
  const headers = ['Leeftijd', 'Jaar', 'Fase', 'Vermogen (€)', 'Eigen kapitaal (€/mnd)', 'AOW (€/mnd)', 'Werkgever (€/mnd)', 'Totaal inkomen (€/mnd)']
  const dataRows = result.yearData.map(d => [
    d.age,
    d.year,
    d.phase === 'opbouw' ? 'Opbouw' : 'Uitkering',
    Math.round(Math.max(0, d.capital)),
    Math.round(d.incomeFromCapital),
    Math.round(d.aowIncome),
    Math.round(d.employerIncome),
    Math.round(d.totalIncome),
  ])

  const ws3 = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
  ws3['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'Jaarlijkse Prognose')

  // --- Sheet 4: Monte Carlo Percentielen ---
  const mcHeaders = ['Leeftijd', 'P10 (€)', 'P25 (€)', 'P50 mediaan (€)', 'P75 (€)', 'P90 (€)']
  const mcRows = mc.percentileData
    .filter((_, i) => i % 2 === 0)
    .map(d => [
      d.age,
      Math.round(d.p10),
      Math.round(d.p25),
      Math.round(d.p50),
      Math.round(d.p75),
      Math.round(d.p90),
    ])

  const ws4 = XLSX.utils.aoa_to_sheet([mcHeaders, ...mcRows])
  ws4['!cols'] = Array(6).fill({ wch: 18 })
  XLSX.utils.book_append_sheet(wb, ws4, 'Monte Carlo')

  const filename = `financiele-planning_${clientName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename)
}
