import type { BerekeningsSet } from '../types'
import { N_SIMULATIONS } from './monteCarlo'
import { slagingskansPercentage } from './slagingskansTekst'
import { opbouwDoelbedrag, indexatieTekst } from './opbouwDoelbedrag'
import { scenarioOmschrijving } from './scenarios'
import { vergelijkingsRegels } from './rapportVergelijking'
import { tekenMcGrafiek, gezamenlijkeSchaal } from './pdfMcGrafiek'
import type { Waarde } from './rapportVergelijking'

function eur(v: number): string {
  const r = Math.round(v)
  return `${r < 0 ? '-' : ''}€ ${Math.abs(r).toLocaleString('nl-NL')}`
}

function pct(v: number): string {
  return `${v.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}



/**
 * Schrijft een afgeronde berekening weg. Neemt de hele BerekeningsSet, zodat de
 * invoer, het resultaat en de simulatie in dit rapport gegarandeerd bij elkaar
 * horen (audit 7 september 2026, bevinding 6).
 */
export async function exportToPDF(
  berekening: BerekeningsSet,
  clientName: string,
  chartElementId: string
) {
  const { inputs, result, mc, peildatum, modelVersie, parameterJaar } = berekening
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
  // De peildatum van de berekening, niet het moment van downloaden.
  pdf.text(`Berekend: ${new Date(peildatum).toLocaleDateString('nl-NL')}`, pageW - margin, 21, { align: 'right' })

  let y = 36
  // Nieuwe pagina als het volgende blok de voettekst zou raken. Het rapport paste op
  // één A4; met de scenariotabel erbij niet altijd meer, en jsPDF breekt zelf niet af.
  const ruimte = (hoogte: number) => {
    if (y + hoogte > 280) {
      pdf.addPage()
      y = 20
    }
  }

  // --- Key metrics row ---
  pdf.setTextColor(41, 57, 46)
  const surplus = result.projectedCapital - result.requiredCapital
  const opbouwTekort = result.opbouwTekort
  const isOnTrack = surplus >= 0 && opbouwTekort === null
  const groen: [number, number, number] = [41, 57, 46]
  const rood: [number, number, number] = [168, 90, 60]

  const metrics = [
    { label: 'Verwacht eindvermogen', value: eur(result.projectedCapital), color: groen },
    { label: 'Benodigd eindvermogen', value: eur(result.requiredCapital), color: [76, 90, 80] as [number, number, number] },
    opbouwTekort !== null && surplus >= 0
      ? { label: `Tekort onderweg (leeftijd ${opbouwTekort.leeftijd})`, value: eur(opbouwTekort.bedrag), color: rood }
      : { label: isOnTrack ? 'Overschot' : 'Tekort', value: eur(Math.abs(surplus)), color: isOnTrack ? groen : rood },
  ]

  const basis = berekening.basis
  const scenarioRegels = scenarioOmschrijving(berekening.scenarios)

  // Met een scenario: de kaders hieronder zouden alleen de scenariouitkomst tonen.
  // Daarom dan één tabel met beide uitkomsten naast elkaar (besluit Hendrik
  // 28 september 2026), en verder niets dubbel.
  if (basis) {
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(41, 57, 46)
    pdf.text('Ben ik financieel onafhankelijk? Zonder en met scenario', margin, y)
    y += 5
    pdf.setFontSize(7.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...rood)
    pdf.text(`Scenario (stresstest, geen verwachting): ${scenarioRegels.join(', ')}.`, margin, y)
    y += 4
    pdf.setTextColor(76, 90, 80)
    pdf.text('Bij het verwachte rendement: de helft van de simulaties valt beter uit, de helft slechter.', margin, y)
    y += 5

    const kolomZonder = margin + contentW * 0.72
    const kolomMet = margin + contentW
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(41, 57, 46)
    pdf.text('Jouw invoer', kolomZonder, y, { align: 'right' })
    pdf.text('Met scenario', kolomMet, y, { align: 'right' })
    y += 2
    pdf.setDrawColor(41, 57, 46)
    pdf.line(margin, y, margin + contentW, y)
    y += 4
    pdf.setFont('helvetica', 'normal')
    const fmt = (w: Waarde) =>
      w.soort === 'eur' ? eur(w.bedrag) : w.soort === 'kans' ? slagingskansPercentage(w.pct) : w.tekst
    vergelijkingsRegels(basis, { inputs, result, mc }).forEach((r, i) => {
      if (i % 2 === 0) {
        pdf.setFillColor(247, 246, 244)
        pdf.rect(margin, y - 3.6, contentW, 5.2, 'F')
      }
      pdf.setTextColor(76, 90, 80)
      pdf.text(r.label, margin + 2, y)
      pdf.setTextColor(41, 57, 46)
      pdf.text(fmt(r.zonder), kolomZonder, y, { align: 'right' })
      pdf.text(fmt(r.met), kolomMet, y, { align: 'right' })
      y += 5.2
    })
    y += 4
  }

  const boxW = contentW / 3 - 2.67
  if (!basis) metrics.forEach((m, i) => {
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
  if (!basis) y += 28

  // 8A: de drie getallen hierboven gaan uit van het verwachte rendement (de
  // mediaan). Het slechtweerscenario erbij, zoals op een pensioenoverzicht. Met een
  // scenario staat dat al in de tabel hierboven.
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(76, 90, 80)
  if (!basis) {
    pdf.text('Bij het verwachte rendement: de helft van de simulaties valt beter uit, de helft slechter.', margin, y)
    y += 4
  }
  // Zelfde voorwaarden als op het scherm (ResultsPanel.tsx).
  if (!basis && result.yearsToRetirement > 0 && result.requiredCapital > 0 && opbouwTekort === null) {
    const tekortSlechtWeer = result.requiredCapital - mc.slechtWeerBijPensioen
    pdf.text(
      `Bij slecht weer (1 op de 20 simulaties valt lager uit): ${eur(mc.slechtWeerBijPensioen)} op ${result.effectiveRetirementAge} jaar` +
      (tekortSlechtWeer > 0 ? `, ${eur(tekortSlechtWeer)} minder dan nodig.` : ', genoeg voor je doel.'),
      margin, y)
    y += 4
  }
  if (!basis && opbouwTekort !== null) {
    pdf.setTextColor(...rood)
    pdf.text(`Let op: je vermogen komt op leeftijd ${opbouwTekort.leeftijd} onder nul, tot ${eur(opbouwTekort.bedrag)} te weinig.`, margin, y)
    pdf.setTextColor(76, 90, 80)
    y += 4
  }
  y += 3

  // --- Slagingskans (uitkomst Monte Carlo) — prominent weergegeven ---
  const kansKleur = (v: number): [number, number, number] =>
    v >= 80 ? [41, 57, 46] : v >= 60 ? [154, 131, 91] : [168, 90, 60]

  const halfW = contentW / 2 - 2
  const kansen: { label: string; value: number | null }[] = [
    { label: 'Kans op 100% van je inkomensdoel', value: mc.successRate },
    { label: 'Kans op 75% van je inkomensdoel', value: mc.successRate75 },
  ]
  if (!basis) {
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(41, 57, 46)
  pdf.text('Ben ik financieel onafhankelijk?', margin, y)
  y += 5

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
    pdf.text(k.value === null ? 'Niet berekend' : slagingskansPercentage(k.value), x + halfW / 2, y + 15.5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
  })
  y += 26
  }

  // --- Inkomen per fase ---
  // Met een scenario gaan de fasen, de opbouw en de grafiek hieronder over het
  // scenario (zoals op het scherm). De tabel hierboven zet beide uitkomsten naast
  // elkaar; de aannames onderaan tonen de eigen invoer.
  pdf.setTextColor(41, 57, 46)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text(basis ? 'Maandelijks inkomen per fase, met scenario' : 'Maandelijks inkomen per fase', margin, y)
  y += 6

  result.incomePhases.forEach((phase, fi) => {
    ruimte(18)
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
    // Lijfrente alleen tonen als er ook echt een bedrag is, anders wordt deze
    // regel voor de meeste gebruikers (veld staat standaard op € 0) onnodig lang.
    const delen = [
      `Eigen vermogen: ${eur(phase.incomeFromCapital)}`,
      `AOW: ${eur(phase.aow)}`,
      `Werkgever: ${eur(phase.employerPension)}`,
      ...(phase.lijfrenteUitkering > 0 ? [`Lijfrente: ${eur(phase.lijfrenteUitkering)}`] : []),
    ]
    pdf.text(delen.join('   '), margin + 4, y + 3.5)
    y += 5
    // De bronbedragen hierboven zijn bij een meerekenende partner het totaal van
    // twee apart belaste personen. Hier staat welk deel van de partner komt, in
    // de PDF wél per bron: anders dan in het smalle invoerscherm is daar ruimte
    // voor. Eigen vermogen blijft ongesplitst, dat is van het huishouden samen.
    if (phase.partner !== null && phase.partner.totaal > 0) {
      const p = phase.partner
      const partnerDelen = [
        ...(p.aow > 0 ? [`AOW: ${eur(p.aow)}`] : []),
        ...(p.employerPension > 0 ? [`Werkgever: ${eur(p.employerPension)}`] : []),
        ...(p.lijfrenteUitkering > 0 ? [`Lijfrente: ${eur(p.lijfrenteUitkering)}`] : []),
      ]
      pdf.text(
        `Waarvan van de partner: ${eur(p.totaal)}   (${partnerDelen.join('   ')})`,
        margin + 4, y + 3.5
      )
      y += 5
    }
    // Een fase kan er compleet uitzien terwijl het vermogen halverwege op is.
    // Zonder deze regel leest het rapport een inkomen uit eigen vermogen dat de
    // rekenkern vanaf die leeftijd nergens meer betaalt (bevinding 5).
    if (phase.shortfallFromAge !== null) {
      pdf.setTextColor(168, 90, 60)
      pdf.text(`Let op: eigen vermogen op vanaf leeftijd ${phase.shortfallFromAge}. Het bedrag hierboven is wat nodig is, niet wat binnenkomt.`, margin + 4, y + 3.5)
      pdf.setTextColor(76, 90, 80)
      y += 5
    }
  })

  // De afleiding van het benodigd eindvermogen uit de kaders bovenaan: in die
  // kaders past geen toelichting. Zie opbouwDoelbedrag().
  const opbouw = opbouwDoelbedrag(result)
  const incomeRows = [
    ['Gewenst netto inkomen', eur(result.desiredMonthlyNetto)],
    ...opbouw.map(r => [r.label, eur(Math.abs(r.bedrag))]),
    ...(opbouw.length > 0 ? [['Benodigd eindvermogen', eur(result.requiredCapital)]] : []),
    ['Benodigde maandinleg',
      result.yearsToRetirement === 0 ? 'n.v.t., al met pensioen' : eur(Math.max(0, result.requiredMonthlyContribution))],
    ['Restkapitaal op ' + inputs.lifeExpectancy + ' jaar', eur(result.surplusAtEnd)],
    ['Plan loopt vast vanaf leeftijd',
      result.firstShortfallAge !== null ? String(result.firstShortfallAge) : 'niet binnen de looptijd'],
  ]

  incomeRows.forEach(([label, value], i) => {
    ruimte(9)
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
  // Met een scenario beide simulaties naast elkaar, zelf getekend en op dezelfde
  // schaal (zie pdfMcGrafiek.ts). Zonder scenario de grafiek van het scherm.
  const chartEl = basis ? null : document.getElementById(chartElementId)
  if (basis) {
    const schaal = gezamenlijkeSchaal([basis.mc.percentileData, mc.percentileData])
    const hoogte = 60
    ruimte(hoogte + 20)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(41, 57, 46)
    pdf.text(`Vermogen in ${N_SIMULATIONS.toLocaleString('nl-NL')} simulaties, zonder en met scenario`, margin, y)
    y += 6
    const breedte = (contentW - 6) / 2
    tekenMcGrafiek(pdf, margin, y, breedte, hoogte, basis.mc.percentileData, schaal,
      'Jouw invoer', basis.result.effectiveRetirementAge)
    tekenMcGrafiek(pdf, margin + breedte + 6, y, breedte, hoogte, mc.percentileData, schaal,
      'Met scenario', result.effectiveRetirementAge)
    y += hoogte + 1
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(76, 90, 80)
    for (const regel of pdf.splitTextToSize(
      'Lichte band: 8 van de 10 simulaties. Donkere band: de middelste helft. Lijn: de mediaan. ' +
      'Stippellijn: pensioendatum. Beide grafieken hebben dezelfde schaal.', contentW) as string[]) {
      pdf.text(regel, margin, y)
      y += 3.5
    }
    y += 4
  }
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, { scale: 1.5, backgroundColor: '#F7F6F4' })
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const imgH = (canvas.height / canvas.width) * contentW
      const chartH = Math.min(imgH, 70)
      ruimte(chartH + 6)
      pdf.addImage(imgData, 'JPEG', margin, y, contentW, chartH)
      y += chartH + 6
    } catch {
      // Chart capture failed silently
    }
  }

  // --- Aannames ---
  ruimte(14)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(41, 57, 46)
  pdf.text('Aannames & parameters', margin, y)
  y += 5

  // Het inleglabel volgt de gekozen frequentie. Stond hier vast op "Maandelijkse
  // inleg", ook bij een jaarbedrag: bij 12.000 per jaar las het rapport dan
  // 12.000 per maand, terwijl de berekening met 1.000 per maand werkte
  // (bevinding 28). De frequentie stond nergens in het rapport.
  // De eigen invoer, ook als er een scenario aan stond: de scenarioregel hieronder
  // zegt wat het scenario daaraan veranderde. Anders stond hier bij "AOW
  // gehalveerd" een AOW van € 791 alsof dat was ingevuld.
  const invoer = basis ? basis.inputs : inputs
  const inlegLabel = invoer.contributionFrequency === 'jaarlijks' ? 'Jaarlijkse inleg' : 'Maandelijkse inleg'
  const eenmalige = (invoer.lifeEvents ?? []).filter(e => e.amount !== 0)

  const assumptions = [
    ...(basis ? [`Scenario (stresstest): ${scenarioRegels.join(', ')}. De invoer hieronder is je eigen invoer, zonder scenario.`] : []),
    `Leeftijd: ${invoer.currentAge} jr | Pensioen: ${result.effectiveRetirementAge} jr | AOW: ${invoer.aowStartAge} jr | Werkgeverspensioen: ${invoer.employerPensionStartAge} jr | Plannen tot: ${invoer.lifeExpectancy} jr`,
    `Woonsituatie: ${invoer.woonsituatie === 'alleenstaand' ? 'alleenstaand' : 'samenwonend'} | Gewenst inkomen: ${eur(invoer.desiredRetirementIncome)}/mnd ${invoer.desiredRetirementIncomeType} | Netto omgerekend: ${eur(result.desiredMonthlyNetto)}/mnd`,
    `Rendement voor pensioen: ${pct(invoer.returnBeforeRetirement)} nominaal | Na pensioen: ${pct(invoer.returnAfterRetirement)} | Inflatie: ${pct(invoer.inflation)} | Volatiliteit: ${pct(invoer.volatilityPre)} / ${pct(invoer.volatilityPost)}`,
    `${inlegLabel}: ${eur(invoer.monthlyContribution)} | Huidig vermogen: ${eur(invoer.currentCapital)}`,
    `Werkgeverspensioen: ${eur(invoer.employerPension)}/mnd bruto, ${indexatieTekst(invoer.employerPensionIndexatie)} | Lijfrente-/bankspaaruitkering: ${eur(invoer.lijfrenteUitkering)}/mnd bruto vanaf ${invoer.lijfrenteStartAge} jr, ${indexatieTekst(invoer.lijfrenteIndexatie)} | AOW: ${eur(invoer.aowMaandBedragNetto)}/mnd netto`,
    invoer.partner?.actief
      ? `Partner (apart belast): nu ${invoer.partner.leeftijd} jr | AOW ${eur(invoer.partner.aowMaandBedragNetto)}/mnd netto vanaf ${invoer.partner.aowStartAge} jr | werkgeverspensioen ${eur(invoer.partner.employerPension)}/mnd bruto vanaf ${invoer.partner.employerPensionStartAge} jr, ${indexatieTekst(invoer.partner.employerPensionIndexatie)}`
      : 'Partner: niet meegerekend, deze berekening gaat over een persoon',
    eenmalige.length > 0
      ? `Eenmalige bedragen (in euro's van dat jaar): ${eenmalige.map(e => `${e.name || 'zonder naam'} ${eur(e.amount)} in ${e.year}`).join(' | ')}`
      : 'Eenmalige bedragen: geen',
    `Alle bedragen in koopkracht van vandaag (reeel rendement); een vast bedrag is teruggerekend met de inflatie. Monte Carlo: ${N_SIMULATIONS.toLocaleString('nl-NL')} simulaties; de steekproeffout is rond een kans van 80% circa 1,8 procentpunt.`,
    `Modelversie ${modelVersie} | fiscale cijfers belastingjaar ${parameterJaar} | berekend ${new Date(peildatum).toLocaleString('nl-NL')}`,
  ]

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(76, 90, 80)
  pdf.setFontSize(7.5)
  // Afbreken op de paginabreedte: lange regels liepen over de rechterrand.
  assumptions.forEach(line => {
    for (const deel of pdf.splitTextToSize(line, contentW) as string[]) {
      ruimte(4.5)
      pdf.text(deel, margin, y)
      y += 4.5
    }
  })

  // --- Footer, op elke pagina ---
  for (let p = 1; p <= pdf.getNumberOfPages(); p++) {
    pdf.setPage(p)
    pdf.setFillColor(247, 246, 244)
    pdf.rect(0, 285, pageW, 12, 'F')
    pdf.setFontSize(7)
    pdf.setTextColor(110, 127, 114)
    pdf.text('Dit rapport is indicatief en geen financieel advies. Rendementen uit het verleden bieden geen garantie voor de toekomst.', pageW / 2, 291, { align: 'center' })
  }

  const filename = `financiele-planning_${naam.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(filename)
}
