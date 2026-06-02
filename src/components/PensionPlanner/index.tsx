import { useState, useCallback } from 'react'
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
  returnBeforeRetirement: 7,
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
  volatilityPre: 15,
  volatilityPost: 8,
}

interface Props {
  clientName: string
  onCloseSession: () => void
}

export function PensionPlanner({ clientName, onCloseSession }: Props) {
  const [inputs, setInputs] = useState<PensionInputs>(DEFAULT_INPUTS)
  const [mc, setMc] = useState<MonteCarloResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleChange = useCallback((updates: Partial<PensionInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates }
      if (next.retirementAge <= next.currentAge) next.retirementAge = next.currentAge + 1
      if (next.lifeExpectancy <= next.retirementAge) next.lifeExpectancy = next.retirementAge + 1
      return next
    })
    setMc(null)
  }, [])

  const result: PensionResult = calculatePension(inputs)

  const handleRunMonteCarlo = useCallback(() => {
    setIsCalculating(true)
    setTimeout(() => {
      const mcResult = runMonteCarlo(inputs)
      setMc(mcResult)
      setIsCalculating(false)
    }, 50)
  }, [inputs])

  return (
    // Responsive: stacked on mobile/portrait tablet, side-by-side on desktop/landscape
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 min-h-0">
      {/* Left: Input panel — full width on mobile, fixed sidebar on desktop */}
      <div className="w-full lg:w-72 lg:flex-shrink-0 lg:overflow-y-auto">
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Invoer parameters</h2>
          <InputPanel inputs={inputs} onChange={handleChange} />
        </div>
      </div>

      {/* Right: Results — full width, scrollable */}
      <div className="flex-1 lg:overflow-y-auto">
        <ResultsPanel
          inputs={inputs}
          result={result}
          mc={mc}
          isCalculating={isCalculating}
          onRunMonteCarlo={handleRunMonteCarlo}
          clientName={clientName}
          onCloseSession={onCloseSession}
        />
      </div>
    </div>
  )
}
