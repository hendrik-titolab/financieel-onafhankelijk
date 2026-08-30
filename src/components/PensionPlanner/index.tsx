import { useState, useCallback, useEffect, useRef } from 'react'
import { track } from '@vercel/analytics'
import { RefreshCw, ChevronDown } from 'lucide-react'
import type { PensionInputs, PensionResult, MonteCarloResult } from '../../types'
import { calculatePension } from '../../utils/pensionCalc'
import { runMonteCarlo } from '../../utils/monteCarlo'
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
  const [mc, setMc] = useState<MonteCarloResult | null>(null)
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
  // Een leeftijdcombinatie die zichzelf tegenspreekt (bijv. currentAge >
  // retirementAge) geeft geen fout: pensionCalc.ts/monteCarlo.ts begrenzen
  // yearsToRetirement/yearsInRetirement/totalYears al met Math.max(0, …) resp.
  // Math.max(1, …), dus dat geeft hooguit een kort/leeg traject.
  const handleChange = useCallback((updates: Partial<PensionInputs>) => {
    setInputs(prev => ({ ...prev, ...updates }))
    setMcStale(mcPrev => mcPrev || true)
  }, [])

  const result: PensionResult = calculatePension(inputs)

  const handleRunMonteCarlo = useCallback(() => {
    // Zicht op of bezoekers de tool daadwerkelijk gebruiken, niet alleen de
    // pagina bezoeken (Vercel Web Analytics gaf tot nu toe alleen dat laatste).
    track('bereken_geklikt')
    setIsCalculating(true)
    setTimeout(() => {
      const mcResult = runMonteCarlo(inputs)
      setMc(mcResult)
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
  }, [inputs])

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
              disabled={isCalculating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-ink hover:bg-[#1F2C23] text-warmwhite rounded-[3px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
              {isCalculating ? 'Berekenen…' : 'Bereken'}
            </button>
            {mcStale && mc && !isCalculating && (
              <p className="text-xs text-body mt-2 text-center">Invoer gewijzigd — resultaat hiernaast is nog van de vorige berekening.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Results — full width, scrollable */}
      <div className="flex-1 lg:overflow-y-auto">
        <ResultsPanel
          inputs={inputs}
          result={result}
          mc={mc}
          mcStale={mcStale}
          isCalculating={isCalculating}
          onRunMonteCarlo={handleRunMonteCarlo}
          clientName={clientName}
          onCloseSession={onCloseSession}
        />
      </div>
    </div>
  )
}
