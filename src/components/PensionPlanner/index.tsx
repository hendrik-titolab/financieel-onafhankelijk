import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
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
  inflation: 2.5,
  currentIncome: 80000,
  currentIncomeType: 'bruto',
  desiredRetirementIncome: 5000,
  desiredRetirementIncomeType: 'bruto',
  aowMaandBedragNetto: 1558,  // alleenstaand netto met heffingskorting 2026 (Lindenhaege)
  aowStartAge: 67,
  employerPension: 0,
  employerPensionStartAge: 67,
  lifeEvents: [],
  stortingen: [],
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

  const handleChange = useCallback((updates: Partial<PensionInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates }
      if (next.retirementAge <= next.currentAge) next.retirementAge = next.currentAge + 1
      if (next.lifeExpectancy <= next.retirementAge) next.lifeExpectancy = next.retirementAge + 1
      return next
    })
    setMcStale(mcPrev => mcPrev || true)
  }, [])

  const result: PensionResult = calculatePension(inputs)

  const handleRunMonteCarlo = useCallback(() => {
    setIsCalculating(true)
    setTimeout(() => {
      const mcResult = runMonteCarlo(inputs)
      setMc(mcResult)
      setMcStale(false)
      setIsCalculating(false)
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
          <div className="flex-1 min-h-0 overflow-y-auto visible-scrollbar p-4">
            <h2 className="text-sm font-medium text-ink mb-4">Invoer</h2>
            <InputPanel inputs={inputs} onChange={handleChange} />
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
