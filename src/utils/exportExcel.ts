import type { BerekeningsSet } from '../types'
import { N_SIMULATIONS } from './monteCarlo'

function eur(v: number) {
  return `€ ${Math.round(v).toLocaleString('nl-NL')}`
}

function setColumnWidths(ws: import('exceljs').Worksheet, widths: number[]) {
  widths.forEach((wch, i) => {
    ws.getColumn(i + 1).width = wch
  })
}

/**
 * Zet Nederlandse euro-opmaak op een kolom. De waarde in de cel blijft een getal,
 * dus een adviseur kan er zelf mee rekenen; alleen de weergave krijgt het teken en
 * de duizendtalscheiding. Tot september 2026 stonden er strings als "€ 1.042.039"
 * in deze cellen, die Excel als tekst behandelt (audit 7 september 2026,
 * bevinding 28).
 */
function euroKolommen(ws: import('exceljs').Worksheet, kolommen: number[]) {
  for (const k of kolommen) {
    ws.getColumn(k).numFmt = '#,##0;[Red]-#,##0'
  }
}

/**
 * Schrijft een afgeronde berekening weg. Neemt bewust de hele BerekeningsSet en
 * niet drie losse argumenten: zo kan er geen invoer van nu met een simulatie van
 * daarnet in een bestand belanden (audit 7 september 2026, bevinding 6).
 */
export async function exportToExcel(berekening: BerekeningsSet, clientName: string) {
  const { inputs, result, mc, peildatum, modelVersie, parameterJaar } = berekening
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
    // De peildatum van de berekening, niet het moment van downloaden. Die twee
    // kunnen uren schelen en het rapport hoort te zeggen wanneer er gerekend is.
    ['Berekend op', new Date(peildatum).toLocaleString('nl-NL')],
    ['Modelversie', modelVersie],
    ['Fiscale cijfers belastingjaar', parameterJaar],
    ['', ''],
    ['LEEFTIJD', ''],
    ['Huidige leeftijd', inputs.currentAge],
    ['Pensioenleeftijd', inputs.retirementAge],
    ['Plannen tot leeftijd', inputs.lifeExpectancy],
    ['', ''],
    ['VERMOGEN & INLEG', ''],
    ['Huidig vermogen', inputs.currentCapital],
    // Het label volgt de gekozen frequentie. Stond hier vast op "Maandelijkse
    // inleg", ook bij een jaarbedrag: bij 12.000 per jaar las het rapport dan
    // 12.000 per maand (bevinding 28).
    [inputs.contributionFrequency === 'jaarlijks' ? 'Jaarlijkse inleg' : 'Maandelijkse inleg',
      inputs.monthlyContribution],
    ['Omgerekend naar per maand',
      inputs.contributionFrequency === 'jaarlijks' ? inputs.monthlyContribution / 12 : inputs.monthlyContribution],
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
    ['Woonsituatie', inputs.woonsituatie === 'alleenstaand' ? 'Alleenstaand' : 'Samenwonend'],
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
  setColumnWidths(ws1, [42, 24])

  // --- Sheet 2: Resultaten ---
  const phaseRows: (string | number)[][] = []
  result.incomePhases.forEach(p => {
    phaseRows.push([p.label, '', '', ''])
    phaseRows.push(['  Eigen vermogen', eur(p.incomeFromCapital), 'AOW', eur(p.aow)])
    phaseRows.push(['  Werkgeverspensioen', eur(p.employerPension), 'Lijfrente-/bankspaaruitkering', eur(p.lijfrenteUitkering)])
    phaseRows.push(['  Totaal', eur(p.total), '', ''])
    if (p.shortfallFromAge !== null) {
      phaseRows.push(['  Let op', `eigen vermogen op vanaf leeftijd ${p.shortfallFromAge}`, '', ''])
    }
  })

  // Bedragen als getal, niet als string met een euroteken ervoor. Die cellen waren
  // in Excel tekst en dus niet bruikbaar in een eigen som (bevinding 28). De opmaak
  // zit in het getalformaat, dat hieronder op de kolom wordt gezet.
  const resultRows: (string | number)[][] = [
    ['FINANCIËLE PLANNING - RESULTATEN', ''],
    ['', ''],
    ['Verwacht eindvermogen', Math.round(result.projectedCapital)],
    // Eenmalige bedragen ná de pensioendatum zitten verrekend in
    // requiredCapital (zie pensionCalc.ts). Hier staat de afleiding uitgeschreven,
    // anders is uit het doelbedrag alleen niet af te lezen waardoor het afwijkt van
    // wat het inkomen op zichzelf kost. Alleen tonen als er zo'n bedrag is.
    ...(Math.round(result.pvEventsAfterRetirement) !== 0
      ? [
          ['Benodigd voor je inkomen', Math.round(result.requiredCapitalEindwaarde + result.pvEventsAfterRetirement)],
          [
            result.pvEventsAfterRetirement > 0
              ? 'Af: eenmalige bedragen ná de pensioendatum (contante waarde)'
              : 'Bij: eenmalige bedragen ná de pensioendatum (contante waarde)',
            Math.round(Math.abs(result.pvEventsAfterRetirement)),
          ],
        ]
      : []),
    // Wat er extra nodig is om de jaren tot een latere ontvangst te overbruggen.
    // Alleen tonen als er iets te overbruggen valt (bevinding 2).
    ...(Math.round(result.overbruggingsToeslag) !== 0
      ? [['Bij: overbrugging tot dat geld binnenkomt', Math.round(result.overbruggingsToeslag)]]
      : []),
    ['Benodigd eindvermogen', Math.round(result.requiredCapital)],
    ['Verschil', Math.round(result.projectedCapital - result.requiredCapital)],
    ['Restkapitaal op ' + inputs.lifeExpectancy + ' jaar', Math.round(result.surplusAtEnd)],
    ['Plan loopt vast vanaf leeftijd',
      result.firstShortfallAge !== null ? result.firstShortfallAge : 'niet binnen de looptijd'],
    ['', ''],
    ['INKOMEN PER FASE (maandelijks netto)', ''],
    ...phaseRows,
    ['', ''],
    ['Gewenst netto inkomen (per maand)', Math.round(result.desiredMonthlyNetto)],
    ['Benodigde maandinleg om doel te halen', Math.round(Math.max(0, result.requiredMonthlyContribution))],
    ['', ''],
    ['MONTE CARLO ANALYSE', ''],
    ['Kans op volledig inkomensdoel', `${mc.successRate.toFixed(1)}%`],
    ['Kans op 75% van het inkomensdoel', `${mc.successRate75.toFixed(1)}%`],
    ['Aantal simulaties', N_SIMULATIONS],
    ['Volatiliteit vóór / na pensioendatum (%)', `${inputs.volatilityPre} / ${inputs.volatilityPost}`],
    ['', ''],
    ['Alle bedragen in huidig koopkracht (reëel rendement)'],
    ['Onzekerheidsmarge: bij 2.000 simulaties is de steekproeffout rond een kans van 80% circa 1,8 procentpunt.'],
    ['Deze berekening is educatief en indicatief, geen persoonlijk financieel advies.'],
  ]

  const ws2 = wb.addWorksheet('Resultaten')
  ws2.addRows(resultRows)
  setColumnWidths(ws2, [46, 22, 26, 20])
  euroKolommen(ws2, [2])

  // --- Sheet 3: Jaarlijkse Prognose ---
  // Gewenst, betaald en ongedekt tekort staan apart. De kolom "Eigen kapitaal"
  // toonde eerder het gewenste bedrag ook als de pot leeg was (bevinding 5).
  const headers = ['Leeftijd', 'Jaar', 'Fase', 'Vermogen bij vast rendement (€)',
    'Gewenst uit vermogen (€/mnd)', 'Betaald uit vermogen (€/mnd)', 'Ongedekt tekort (€/mnd)',
    'AOW (€/mnd)', 'Werkgever (€/mnd)', 'Lijfrente (€/mnd)', 'Totaal inkomen (€/mnd)']
  const dataRows = result.yearData.map(d => [
    d.age,
    d.year,
    d.phase === 'opbouw' ? 'Opbouw' : 'Uitkering',
    Math.round(Math.max(0, d.capital)),
    Math.round(d.desiredFromCapital),
    Math.round(d.incomeFromCapital),
    Math.round(d.shortfall),
    Math.round(d.aowIncome),
    Math.round(d.employerIncome),
    Math.round(d.lijfrenteIncome),
    Math.round(d.totalIncome),
  ])

  const ws3 = wb.addWorksheet('Jaarlijkse Prognose')
  ws3.addRows([headers, ...dataRows])
  setColumnWidths(ws3, [10, 8, 12, 30, 24, 24, 22, 14, 18, 16, 22])
  euroKolommen(ws3, [4, 5, 6, 7, 8, 9, 10, 11])

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
  euroKolommen(ws4, [2, 3, 4, 5, 6])

  const filename = `financiele-planning_${naam.replace(/\s/g, '_')}_${peildatum.slice(0, 10)}.xlsx`

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
