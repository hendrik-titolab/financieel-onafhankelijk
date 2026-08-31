import type { PensionInputs, PensionResult, MonteCarloResult } from '../types'
import { N_SIMULATIONS } from './monteCarlo'

function eur(v: number) {
  return `€ ${Math.round(v).toLocaleString('nl-NL')}`
}

function setColumnWidths(ws: import('exceljs').Worksheet, widths: number[]) {
  widths.forEach((wch, i) => {
    ws.getColumn(i + 1).width = wch
  })
}

export async function exportToExcel(
  inputs: PensionInputs,
  result: PensionResult,
  mc: MonteCarloResult,
  clientName: string
) {
  // exceljs is zwaar en alleen nodig bij export → dynamisch laden (code-splitting).
  // De kant-en-klare browser-bundel gebruiken (niet de Node-hoofdingang), anders
  // sleept de build fs/stream-polyfills mee.
  const ExcelJS = (await import('exceljs/dist/exceljs.js')).default
  const wb = new ExcelJS.Workbook()
  const naam = clientName.trim() || 'Naamloze berekening'

  // --- Sheet 1: Invoer ---
  const inputRows = [
    ['FINANCIËLE PLANNING - INVOER', ''],
    ['Berekening', naam],
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
    ['AOW netto per maand', inputs.aowMaandBedragNetto],
    ['AOW ingangsdatum (leeftijd)', inputs.aowStartAge],
    ['Werkgeverspensioen (bruto/maand)', inputs.employerPension],
    ['Werkgeverspensioen ingangsdatum (leeftijd)', inputs.employerPensionStartAge],
    ['Lijfrente-/bankspaaruitkering (bruto/maand)', inputs.lijfrenteUitkering],
    ['Lijfrente-/bankspaaruitkering ingangsdatum (leeftijd)', inputs.lijfrenteStartAge],
    ['', ''],
    ['LIFE EVENTS', ''],
    ...((inputs.lifeEvents ?? []).length > 0
      ? (inputs.lifeEvents ?? []).map(e => [`${e.name} (${e.year})`, e.amount])
      : [['(geen)', '']]
    ),
    ['Totaal inkomsten', (inputs.lifeEvents ?? []).filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)],
    ['Totaal uitgaven', (inputs.lifeEvents ?? []).filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0)],
  ]

  const ws1 = wb.addWorksheet('Invoer')
  ws1.addRows(inputRows)
  setColumnWidths(ws1, [35, 20])

  // --- Sheet 2: Resultaten ---
  const phaseRows: (string | number)[][] = []
  result.incomePhases.forEach(p => {
    phaseRows.push([p.label, '', '', ''])
    phaseRows.push(['  Eigen vermogen', eur(p.incomeFromCapital), 'AOW', eur(p.aow)])
    phaseRows.push(['  Werkgeverspensioen', eur(p.employerPension), 'Lijfrente-/bankspaaruitkering', eur(p.lijfrenteUitkering)])
    phaseRows.push(['  Totaal', eur(p.total), '', ''])
  })

  const resultRows = [
    ['FINANCIËLE PLANNING - RESULTATEN', ''],
    ['', ''],
    ['Verwacht eindvermogen', eur(result.projectedCapital)],
    // Eenmalige bedragen ná de pensioendatum zitten verrekend in
    // requiredCapital (zie pensionCalc.ts). Hier staat de afleiding uitgeschreven,
    // anders is uit het doelbedrag alleen niet af te lezen waardoor het afwijkt van
    // wat het inkomen op zichzelf kost. Alleen tonen als er zo'n bedrag is.
    ...(Math.round(result.pvEventsAfterRetirement) !== 0
      ? [
          ['Benodigd voor je inkomen', eur(result.requiredCapital + result.pvEventsAfterRetirement)],
          [
            result.pvEventsAfterRetirement > 0
              ? 'Af: eenmalige bedragen ná de pensioendatum (contante waarde)'
              : 'Bij: eenmalige bedragen ná de pensioendatum (contante waarde)',
            eur(Math.abs(result.pvEventsAfterRetirement)),
          ],
        ]
      : []),
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
    ['Aantal simulaties', String(N_SIMULATIONS)],
    ['', ''],
    ['Alle bedragen in huidig koopkracht (reëel rendement)'],
  ]

  const ws2 = wb.addWorksheet('Resultaten')
  ws2.addRows(resultRows)
  setColumnWidths(ws2, [40, 20, 20, 20])

  // --- Sheet 3: Jaarlijkse Prognose ---
  const headers = ['Leeftijd', 'Jaar', 'Fase', 'Vermogen bij vast rendement (€)', 'Eigen kapitaal (€/mnd)', 'AOW (€/mnd)', 'Werkgever (€/mnd)', 'Lijfrente (€/mnd)', 'Totaal inkomen (€/mnd)']
  const dataRows = result.yearData.map(d => [
    d.age,
    d.year,
    d.phase === 'opbouw' ? 'Opbouw' : 'Uitkering',
    Math.round(Math.max(0, d.capital)),
    Math.round(d.incomeFromCapital),
    Math.round(d.aowIncome),
    Math.round(d.employerIncome),
    Math.round(d.lijfrenteIncome),
    Math.round(d.totalIncome),
  ])

  const ws3 = wb.addWorksheet('Jaarlijkse Prognose')
  ws3.addRows([headers, ...dataRows])
  setColumnWidths(ws3, [10, 8, 12, 30, 20, 14, 18, 16, 22])

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

  const ws4 = wb.addWorksheet('Monte Carlo')
  ws4.addRows([mcHeaders, ...mcRows])
  setColumnWidths(ws4, Array(6).fill(18))

  const filename = `financiele-planning_${naam.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`

  // Expliciete blob-download i.p.v. een auto-triggerde download — browsers blokkeren
  // de laatste soms als "automatische download". Deze aanpak telt als door de
  // gebruiker gestart.
  const wbout = await wb.xlsx.writeBuffer()
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
