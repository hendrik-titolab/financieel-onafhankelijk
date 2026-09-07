import { useState, useCallback, useEffect, useRef } from 'react'
import { track } from '@vercel/analytics'
import { RefreshCw, ChevronDown } from 'lucide-react'
import type { PensionInputs, PensionResult, BerekeningsSet } from '../../types'
import { calculatePension, controleerLeeftijden } from '../../utils/pensionCalc'
import { runMonteCarlo } from '../../utils/monteCarlo'
import { MODEL_VERSIE, PARAMETER_JAAR } from '../../config/modelVersie'
import { InputPanel } from './InputPanel'
import { ResultsPanel } from './ResultsPanel'

const DEFAULT_INPUTS: PensionInputs = {
  currentAge: 40,
  retirementAge: 67,
  lifeExpectancy: 90,
  currentCapital: 100000,
  monthlyContribution: 0,
  contributionFrequency: 'maandelijks',
  returnBeforeRetirement: 6,
  returnAfterRetirement: 4,
  inflation: 3.0,
  // Standaard nul: de rendementen hierboven zijn bruto, en de gebruiker kiest zelf
  // wat hij aan kosten en vermogensbelasting invult. Zie utils/box3.ts.
  kostenPct: 0,
  vermogensbelastingPct: 0,
  currentIncome: 80000,
  currentIncomeType: 'bruto',
  desiredRetirementIncome: 5000,
  desiredRetirementIncomeType: 'bruto',
  woonsituatie: 'alleenstaand',
  aowMaandBedragNetto: 1582,  // alleenstaand netto met heffingskorting, SVB per 1 juli 2026
  aowStartAge: 67,
  employerPension: 0,
  employerPensionStartAge: 67,
  lijfrenteUitkering: 0,
  lijfrenteStartAge: 67,
  lijfrenteSoort: 'levenslang',
  // Alleen van betekenis bij een tijdelijke uitkering; bij levenslang loopt ze
  // door tot de planningshorizon.
  lijfrenteEindLeeftijd: 87,
  lifeEvents: [],
  volatilityPre: 12,
  volatilityPost: 8,
  riskProfile: 'neutraal',
  useCustomReturns: false,
}

interface Props {
  clientName: string
  onCloseSession: () => void
}

export function PensionPlanner({ clientName, onCloseSession }: Props) {
  const [inputs, setInputs] = useState<PensionInputs>(DEFAULT_INPUTS)
  // Eén afgeronde berekening, vastgelegd op het moment van rekenen: invoer,
  // deterministisch resultaat, simulatie, peildatum en modelversie bij elkaar. De
  // export leest uitsluitend hieruit, zodat een rapport nooit nieuwe invoer met
  // een oude simulatie kan mengen (audit 7 september 2026, bevinding 6).
  const [berekening, setBerekening] = useState<BerekeningsSet | null>(null)
  // Het resultaat blijft in beeld staan na een invoerwijziging (was: setMc(null),
  // waardoor de grafiek en beide meters meteen verdwenen). mcStale markeert dat
  // het getoonde resultaat niet meer bij de huidige invoer hoort, zonder het weg
  // te halen — precies "wat als ik twee jaar later stop" moet je kunnen navragen
  // zonder eerst je uitkomst kwijt te raken.
  const [mcStale, setMcStale] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // Scroll-aanwijzing: hangt vast aan de onderkant van het zichtbare vlak
  // (niet aan een vaste plek in de inhoud) zodat hij op elke schermhoogte
  // meteen zichtbaar is bij het laden — een pijltje verderop in de inhoud
  // bleek op een groot scherm met minder browserchrome-ruimte al buiten
  // beeld te vallen, waardoor je 'm nooit zag zonder al gescrold te hebben.
  // Verdwijnt zodra je zelf ook maar iets scrolt, zodat hij niet aanvoelt
  // als een vastzittend element dat je scrollen negeert.
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  useEffect(() => {
    const area = scrollAreaRef.current
    if (!area) return

    const checkScroll = () => {
      const hasOverflow = area.scrollHeight - area.clientHeight > 8
      setShowScrollHint(hasOverflow && area.scrollTop <= 4)
    }

    checkScroll()
    area.addEventListener('scroll', checkScroll)
    const ro = new ResizeObserver(checkScroll)
    ro.observe(area)
    if (area.firstElementChild) ro.observe(area.firstElementChild)
    return () => {
      area.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [])

  // Elk leeftijdveld toont en onthoudt precies wat je instelt, zonder een ander
  // veld te corrigeren. Eerder werd retirementAge/lifeExpectancy hier automatisch
  // opgehoogd zodra currentAge/retirementAge die inhaalde, waardoor een schuifje
  // zichtbaar "vanzelf" meebewoog met een ander schuifje — expliciet ongewenst.
  //
  // Een combinatie die zichzelf tegenspreekt levert nu wél een melding op. Tot
  // september 2026 niet: de Math.max()-begrenzingen in pensionCalc.ts en
  // monteCarlo.ts vingen dat stilzwijgend op, maar niet op dezelfde manier. Bij
  // huidige leeftijd 70, stoppen op 60 en eindleeftijd 65 liep de ene kern vanaf
  // leeftijd 60 door terwijl de andere nul jaren doorliep en 100% slagingskans
  // meldde (audit 7 september 2026, bevinding 3). De schuifjes blijven zelfstandig
  // bedienbaar; alleen de uitkomst wordt tegengehouden zolang ze niets betekent.
  const handleChange = useCallback((updates: Partial<PensionInputs>) => {
    setInputs(prev => ({ ...prev, ...updates }))
    setMcStale(mcPrev => mcPrev || true)
  }, [])

  const leeftijden = controleerLeeftijden(inputs.currentAge, inputs.retirementAge, inputs.lifeExpectancy)
  const isGeldig = leeftijden.errors.length === 0

  // Bij een ongeldige combinatie wordt er niet gerekend. Een uitkomst tonen die
  // op een onmogelijke aanname rust is in het Wft-domein erger dan geen uitkomst.
  const result: PensionResult | null = isGeldig ? calculatePension(inputs) : null

  const handleRunMonteCarlo = useCallback(() => {
    // Zicht op of bezoekers de tool daadwerkelijk gebruiken, niet alleen de
    // pagina bezoeken (Vercel Web Analytics gaf tot nu toe alleen dat laatste).
    if (!isGeldig) return
    track('bereken_geklikt')
    setIsCalculating(true)
    setTimeout(() => {
      // Beide kernen in één keer, op dezelfde invoer. Het deterministische
      // resultaat wordt hier apart berekend en niet uit de live `result`
      // overgenomen: die hoort bij wat er nú op het scherm staat, en dat is
      // precies wat er in de export niet door elkaar mag lopen.
      setBerekening({
        inputs,
        result: calculatePension(inputs),
        mc: runMonteCarlo(inputs),
        peildatum: new Date().toISOString(),
        modelVersie: MODEL_VERSIE,
        parameterJaar: PARAMETER_JAAR,
      })
      setMcStale(false)
      setIsCalculating(false)
      // Op mobiel staat de invoerkolom boven de resultaten (gestapelde layout
      // onder het lg:-breakpoint), dus na Bereken zie je zonder zelf te
      // scrollen niet dat er iets is gebeurd. Vanaf lg: staan ze al naast
      // elkaar zichtbaar, dus dan niet scrollen.
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        requestAnimationFrame(() => {
          document.getElementById('wealth-chart')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }, 50)
  }, [inputs, isGeldig])

  return (
    // Responsive: stacked on mobile/portrait tablet, side-by-side on desktop/landscape
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 min-h-0">
      {/* Left: Input panel — bounded height met altijd zichtbare scrollbar,
          en een vast onderin blijvende Bereken-knop zodat je 'm niet hoeft
          op te zoeken na het invullen van een veld. */}
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <div className="card !p-0 flex flex-col max-h-[75vh] lg:max-h-[calc(100vh-140px)] overflow-hidden">
          <div ref={scrollAreaRef} className="relative flex-1 min-h-0 overflow-y-auto visible-scrollbar p-4">
            <h2 className="text-sm font-medium text-ink mb-4">Invoer</h2>
            <InputPanel inputs={inputs} onChange={handleChange} />
            {showScrollHint && (
              // position:absolute (niet in de content-flow) zodat de plek
              // waar dit landt niet afhangt van de zichtbare paneelhoogte —
              // altijd onderin het zichtbare vlak, op elk scherm.
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 flex items-end justify-center bg-gradient-to-t from-panel to-transparent">
                <div className="mb-1.5 flex items-center justify-center w-7 h-7 rounded-full bg-panel border border-line animate-bounce">
                  <ChevronDown size={15} className="text-data-700" />
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 border-t border-line-soft p-3 bg-panel">
            <button
              onClick={handleRunMonteCarlo}
              disabled={isCalculating || !isGeldig}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-ink hover:bg-[#1F2C23] text-warmwhite rounded-[3px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
              {isCalculating ? 'Berekenen…' : 'Bereken'}
            </button>
            {!isGeldig && (
              <p className="text-xs text-signal mt-2 text-center leading-relaxed">
                {leeftijden.errors[0]}
              </p>
            )}
            {isGeldig && mcStale && berekening && !isCalculating && (
              <p className="text-xs text-body mt-2 text-center">Invoer gewijzigd — resultaat hiernaast is nog van de vorige berekening.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Results — full width, scrollable */}
      <div className="flex-1 lg:overflow-y-auto">
        {!isGeldig || result === null ? (
          <div className="card">
            <h2 className="text-sm font-medium text-ink mb-2">Deze leeftijden kunnen niet samen</h2>
            <ul className="space-y-1">
              {leeftijden.errors.map((e, i) => (
                <li key={i} className="text-sm text-signal leading-relaxed">{e}</li>
              ))}
            </ul>
            <p className="text-xs text-body mt-3 leading-relaxed">
              Zolang de combinatie niets betekent laten we geen uitkomst zien. Een getal dat op een
              onmogelijke aanname rust is misleidender dan geen getal.
            </p>
          </div>
        ) : (
        <ResultsPanel
          inputs={inputs}
          result={result}
          berekening={berekening}
          mcStale={mcStale}
          isCalculating={isCalculating}
          onRunMonteCarlo={handleRunMonteCarlo}
          clientName={clientName}
          onCloseSession={onCloseSession}
        />
        )}
        {isGeldig && leeftijden.notes.length > 0 && (
          <div className="card mt-4">
            {leeftijden.notes.map((n, i) => (
              <p key={i} className="text-xs text-body leading-relaxed">{n}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
