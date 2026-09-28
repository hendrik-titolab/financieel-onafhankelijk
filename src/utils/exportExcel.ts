import type { BerekeningsSet, PensionInputs, PensionResult, MonteCarloResult } from '../types'
import { vergelijkingsRegels } from './rapportVergelijking'
import type { Waarde } from './rapportVergelijking'
import { N_SIMULATIONS } from './monteCarlo'
import { slagingskansPercentage } from './slagingskansTekst'
import { opbouwDoelbedrag, indexatieTekst } from './opbouwDoelbedrag'
import { scenarioOmschrijving } from './scenarios'

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
 * De invoer als rijen van twee kolommen: label en waarde. Apart, zodat de export bij
 * een scenario de eigen invoer en de invoer met scenario naast elkaar kan zetten.
 * Beide lijsten hebben altijd dezelfde rijen, want een scenario verandert alleen
 * waarden, geen partner of eenmalige bedragen.
 */
function invoerRijen(inputs: PensionInputs): (string | number)[][] {
  return [
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
    ['Werkgeverspensioen indexatie', indexatieTekst(inputs.employerPensionIndexatie)],
    ['Lijfrente-/bankspaaruitkering (bruto/maand)', inputs.lijfrenteUitkering],
    ['Lijfrente-/bankspaaruitkering ingangsdatum (leeftijd)', inputs.lijfrenteStartAge],
    ['Lijfrente-/bankspaaruitkering indexatie', indexatieTekst(inputs.lijfrenteIndexatie)],
    ['', ''],
    // Zonder deze regels is een dossier met partner niet te reproduceren: je ziet
    // wel een hoger vast inkomen, maar niet waar het vandaan komt.
    ['PARTNER', ''],
    ...(inputs.partner?.actief
      ? [
          ['Partner meegerekend', 'ja, apart belast'],
          ['Leeftijd partner nu', inputs.partner.leeftijd],
          ['AOW partner netto per maand', inputs.partner.aowMaandBedragNetto],
          ['AOW partner ingangsdatum (leeftijd)', inputs.partner.aowStartAge],
          ['Werkgeverspensioen partner (bruto/maand)', inputs.partner.employerPension],
          ['Werkgeverspensioen partner ingangsdatum (leeftijd)', inputs.partner.employerPensionStartAge],
          ['Werkgeverspensioen partner indexatie', indexatieTekst(inputs.partner.employerPensionIndexatie)],
        ]
      : [['Partner meegerekend', 'nee, berekening voor één persoon']]),
    ['', ''],
    ["EENMALIGE BEDRAGEN (in euro's van dat jaar)", ''],
    ...((inputs.lifeEvents ?? []).length > 0
      ? (inputs.lifeEvents ?? []).map(e => [`${e.name} (${e.year})`, e.amount])
      : [['(geen)', '']]
    ),
    ['Totaal inkomsten', (inputs.lifeEvents ?? []).filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)],
    ['Totaal uitgaven', (inputs.lifeEvents ?? []).filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0)],
  ]
}

/** Een vergelijkingswaarde als cel: euro's als getal, de rest als tekst. */
function celWaarde(w: Waarde): string | number {
  return w.soort === 'eur' ? Math.round(w.bedrag) : w.soort === 'kans' ? slagingskansPercentage(w.pct) : w.tekst
}

/** Een jaartabel als rijen, voor zowel de berekening met als zonder scenario. */
function jaarRijen(yearData: PensionResult['yearData']): (string | number)[][] {
  const headers = ['Leeftijd', 'Jaar', 'Fase', 'Vermogen bij vast rendement (€)',
    'Gewenst uit vermogen (€/mnd)', 'Betaald uit vermogen (€/mnd)', 'Ongedekt tekort (€/mnd)',
    'AOW (€/mnd)', 'Werkgever (€/mnd)', 'Lijfrente (€/mnd)', 'Totaal inkomen (€/mnd)']
  return [headers, ...yearData.map(d => [
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
  ])]
}

/** De percentielen van de simulatie, om het jaar. */
function mcRijen(percentileData: MonteCarloResult['percentileData']): (string | number)[][] {
  const headers = ['Leeftijd', 'P10 (€)', 'P25 (€)', 'P50 mediaan (€)', 'P75 (€)', 'P90 (€)']
  return [headers, ...percentileData
    .filter((_, i) => i % 2 === 0)
    .map(d => [d.age, Math.round(d.p10), Math.round(d.p25), Math.round(d.p50), Math.round(d.p75), Math.round(d.p90)])]
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
  const basis = berekening.basis

  // --- Sheet 1: Invoer ---
  const inputRows = [
    ['FINANCIËLE PLANNING - INVOER', ''],
    ['Berekening', naam],
    // De peildatum van de berekening, niet het moment van downloaden. Die twee
    // kunnen uren schelen en het rapport hoort te zeggen wanneer er gerekend is.
    ['Berekend op', new Date(peildatum).toLocaleString('nl-NL')],
    ['Modelversie', modelVersie],
    ['Fiscale cijfers belastingjaar', parameterJaar],
    ['Scenario (stresstest)', scenarioOmschrijving(berekening.scenarios).join(', ') || 'geen'],
    ['', ''],
    // Met een scenario de eigen invoer en de invoer met scenario naast elkaar, zodat
    // te zien is wat het scenario veranderde (besluit Hendrik 28 september 2026).
    ...(basis
      ? [
          ['', 'Jouw invoer', 'Met scenario'],
          ...invoerRijen(basis.inputs).map((rij, i) => [...rij, invoerRijen(inputs)[i][1]]),
        ]
      : invoerRijen(inputs)),
  ]

  const ws1 = wb.addWorksheet('Invoer')
  ws1.addRows(inputRows)
  setColumnWidths(ws1, [42, 24, 24])

  // --- Sheet 2: Resultaten ---
  const phaseRows: (string | number)[][] = []
  result.incomePhases.forEach(p => {
    phaseRows.push([p.label, '', '', ''])
    phaseRows.push(['  Eigen vermogen', eur(p.incomeFromCapital), 'AOW', eur(p.aow)])
    phaseRows.push(['  Werkgeverspensioen', eur(p.employerPension), 'Lijfrente-/bankspaaruitkering', eur(p.lijfrenteUitkering)])
    phaseRows.push(['  Totaal', eur(p.total), '', ''])
    // Bij een meerekenende partner zijn de drie bronnen hierboven het totaal van
    // twee apart belaste personen. Zonder deze regel is uit de export niet af te
    // leiden van wie welk deel komt. Eigen vermogen staat er bewust niet bij:
    // dat is van het huishouden samen, niet per persoon toe te rekenen.
    if (p.partner !== null && p.partner.totaal > 0) {
      phaseRows.push(['  Waarvan van de partner', eur(p.partner.totaal), 'AOW partner', eur(p.partner.aow)])
      phaseRows.push(['    Werkgeverspensioen partner', eur(p.partner.employerPension), 'Lijfrente partner', eur(p.partner.lijfrenteUitkering)])
    }
    if (p.shortfallFromAge !== null) {
      phaseRows.push(['  Let op', `eigen vermogen op vanaf leeftijd ${p.shortfallFromAge}`, '', ''])
    }
  })

  // Bedragen als getal, niet als string met een euroteken ervoor. Die cellen waren
  // in Excel tekst en dus niet bruikbaar in een eigen som (bevinding 28). De opmaak
  // zit in het getalformaat, dat hieronder op de kolom wordt gezet.
  const resultRows: (string | number)[][] = [
    ['FINANCIËLE PLANNING - RESULTATEN', ''],
    ['Bij het verwachte rendement: de helft van de simulaties valt beter uit, de helft slechter.', ''],
    // Met een scenario eerst beide uitkomsten naast elkaar; de uitwerking daaronder
    // (opbouw, fasen, simulatie) gaat over het scenario, zoals op het scherm. De
    // jaartabel en de simulatie zonder scenario staan op eigen tabbladen.
    ...(basis
      ? [
          ['Scenario (stresstest, geen verwachting)', scenarioOmschrijving(berekening.scenarios).join(', ')],
          ['', ''],
          ['VERGELIJKING', 'Jouw invoer', 'Met scenario'],
          ...vergelijkingsRegels(basis, { inputs, result, mc }).map(r => [r.label, celWaarde(r.zonder), celWaarde(r.met)]),
          ['', ''],
          ['UITWERKING MET SCENARIO', ''],
        ]
      : []),
    ['', ''],
    ['Verwacht eindvermogen', Math.round(result.projectedCapital)],
    // De afleiding van het doelbedrag, met teken zodat een adviseur de kolom kan
    // optellen. Zie opbouwDoelbedrag(): de regels sluiten op requiredCapital.
    ...opbouwDoelbedrag(result).map(r => [r.label, Math.round(r.bedrag)]),
    ['Benodigd eindvermogen', Math.round(result.requiredCapital)],
    ['Verschil', Math.round(result.projectedCapital - result.requiredCapital)],
    ...(result.yearsToRetirement > 0 && result.requiredCapital > 0 && result.opbouwTekort === null
      ? [['Eindvermogen bij slecht weer (5e percentiel)', Math.round(mc.slechtWeerBijPensioen)]]
      : []),
    ...(result.opbouwTekort !== null
      ? [
          ['Vermogen onder nul in de opbouwfase vanaf leeftijd', result.opbouwTekort.leeftijd],
          ['Grootste tekort in de opbouwfase', Math.round(result.opbouwTekort.bedrag)],
        ]
      : []),
    ['Restkapitaal op ' + inputs.lifeExpectancy + ' jaar', Math.round(result.surplusAtEnd)],
    ['Plan loopt vast vanaf leeftijd',
      result.firstShortfallAge !== null ? result.firstShortfallAge : 'niet binnen de looptijd'],
    ['', ''],
    ['INKOMEN PER FASE (maandelijks netto)', ''],
    ...phaseRows,
    ['', ''],
    ['Gewenst netto inkomen (per maand)', Math.round(result.desiredMonthlyNetto)],
    ['Benodigde maandinleg om doel te halen',
      result.yearsToRetirement === 0 ? 'n.v.t., al met pensioen' : Math.round(Math.max(0, result.requiredMonthlyContribution))],
    ['', ''],
    ['MONTE CARLO ANALYSE', ''],
    ['Kans op volledig inkomensdoel', slagingskansPercentage(mc.successRate)],
    ['Kans op 75% van het inkomensdoel', slagingskansPercentage(mc.successRate75)],
    ['Aantal simulaties', N_SIMULATIONS],
    ['Volatiliteit vóór / na pensioendatum (%)',
      `${inputs.volatilityPre.toLocaleString('nl-NL')} / ${inputs.volatilityPost.toLocaleString('nl-NL')}`],
    ['', ''],
    ['Alle bedragen in koopkracht van vandaag (reëel rendement); een vast bedrag is teruggerekend met de inflatie.'],
    ['Onzekerheidsmarge: bij 2.000 simulaties is de steekproeffout rond een kans van 80% circa 1,8 procentpunt.'],
    ['Deze berekening is educatief en indicatief, geen persoonlijk financieel advies.'],
  ]

  const ws2 = wb.addWorksheet('Resultaten')
  ws2.addRows(resultRows)
  setColumnWidths(ws2, [46, 22, 26, 20])
  euroKolommen(ws2, [2, 3])

  // --- Jaarlijkse prognose en Monte Carlo ---
  // Gewenst, betaald en ongedekt tekort staan apart. De kolom "Eigen kapitaal"
  // toonde eerder het gewenste bedrag ook als de pot leeg was (bevinding 5).
  // Met een scenario krijgt de berekening zonder scenario eigen tabbladen, zodat
  // beide uitkomsten volledig in het bestand staan.
  const jaarblad = (titel: string, yearData: PensionResult['yearData']) => {
    const ws = wb.addWorksheet(titel)
    ws.addRows(jaarRijen(yearData))
    setColumnWidths(ws, [10, 8, 12, 30, 24, 24, 22, 14, 18, 16, 22])
    euroKolommen(ws, [4, 5, 6, 7, 8, 9, 10, 11])
  }
  const mcBlad = (titel: string, percentileData: MonteCarloResult['percentileData']) => {
    const ws = wb.addWorksheet(titel)
    ws.addRows(mcRijen(percentileData))
    setColumnWidths(ws, Array(6).fill(18))
    euroKolommen(ws, [2, 3, 4, 5, 6])
  }

  if (basis) {
    jaarblad('Prognose zonder scenario', basis.result.yearData)
    jaarblad('Prognose met scenario', result.yearData)
    mcBlad('Monte Carlo zonder scenario', basis.mc.percentileData)
    mcBlad('Monte Carlo met scenario', mc.percentileData)
  } else {
    jaarblad('Jaarlijkse Prognose', result.yearData)
    mcBlad('Monte Carlo', mc.percentileData)
  }

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
