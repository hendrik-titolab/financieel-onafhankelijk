import { FileText, Sheet, RefreshCw, TrendingUp, LogOut } from 'lucide-react'
import type { PensionResult, MonteCarloResult, PensionInputs } from '../../types'
import { WealthChart } from './WealthChart'
import { exportToExcel } from '../../utils/exportExcel'
import { exportToPDF } from '../../utils/exportPDF'
import { useState } from 'react'

interface Props {
  inputs: PensionInputs
  result: PensionResult
  mc: MonteCarloResult | null
  isCalculating: boolean
  onRunMonteCarlo: () => void
  clientName: string
  onCloseSession: () => void
}

function eur(v: number): string {
  return `€ ${Math.abs(Math.round(v)).toLocaleString('nl-NL')}`
}

function MetricCard({
  label, value, sub, accent, size = 'normal'
}: {
  label: string; value: string; sub?: string; accent?: 'blue' | 'green' | 'red' | 'amber'; size?: 'normal' | 'large'
}) {
  const accentClass = {
    blue: 'text-primary-600',
    green: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    undefined: 'text-slate-800',
  }[accent ?? 'undefined']

  return (
    <div className="card flex flex-col justify-between min-h-[80px]">
      <span className="label">{label}</span>
      <span className={`font-bold ${size === 'large' ? 'text-2xl' : 'text-xl'} ${accentClass}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400 mt-0.5">{sub}</span>}
    </div>
  )
}

function SuccessGauge({ value, title, subtitle }: { value: number; title: string; subtitle: string }) {
  const color = value >= 80 ? '#059669' : value >= 60 ? '#d97706' : '#dc2626'
  const oordeel = value >= 80 ? 'Goed' : value >= 60 ? 'Redelijk' : 'Risicovol'
  const angle = (value / 100) * 180 - 90  // -90° (links) tot +90° (rechts)

  return (
    <div className="card flex flex-col items-center justify-center gap-1 py-4">
      <span className="text-xs font-semibold text-slate-600 text-center leading-tight">{title}</span>
      <span className="text-xs text-slate-400 text-center leading-tight mb-1">{subtitle}</span>
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
        {/* Colored arc — fills proportionally */}
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157} 157`}
        />
        {/* Needle */}
        <line
          x1="60" y1="65"
          x2={60 + 35 * Math.cos((angle * Math.PI) / 180)}
          y2={65 + 35 * Math.sin((angle * Math.PI) / 180)}
          stroke="#0f172a" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="60" cy="65" r="4" fill="#0f172a" />
      </svg>
      <div className="text-center">
        <span className="text-2xl font-bold" style={{ color }}>{value.toFixed(1)}%</span>
        <span className="text-xs text-slate-400 block">{oordeel}</span>
      </div>
    </div>
  )
}

// Nominal income at a given number of years from today (real amount × accumulated inflation)
function nominalIncome(realMonthly: number, inflation: number, yearsFromNow: number): number {
  return realMonthly * Math.pow(1 + inflation / 100, yearsFromNow)
}

export function ResultsPanel({ inputs, result, mc, isCalculating, onRunMonteCarlo, clientName, onCloseSession }: Props) {
  const [showMonteCarlo, setShowMonteCarlo] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isClosingSession, setIsClosingSession] = useState(false)
  const [showInflationDetail, setShowInflationDetail] = useState(false)
  const surplus = result.projectedCapital - result.requiredCapital
  const isOnTrack = surplus >= 0
  const currentMonthlyPMT = inputs.contributionFrequency === 'maandelijks'
    ? inputs.monthlyContribution
    : inputs.monthlyContribution / 12
  const needsMoreContribution = result.requiredMonthlyContribution > currentMonthlyPMT

  const handlePDF = async () => {
    setIsExportingPdf(true)
    try {
      await exportToPDF(inputs, result, mc ?? { successRate: 0, successRate75: 0, percentileData: [] }, clientName, 'wealth-chart')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExcel = () => {
    exportToExcel(inputs, result, mc ?? { successRate: 0, successRate75: 0, percentileData: [] }, clientName)
  }

  // Export both PDF + Excel, then wipe the session
  const handleExportAndClose = async () => {
    setIsClosingSession(true)
    try {
      // Excel first (sync, fast)
      exportToExcel(inputs, result, mc ?? { successRate: 0, successRate75: 0, percentileData: [] }, clientName)
      // Then PDF (async, may take a moment)
      await exportToPDF(inputs, result, mc ?? { successRate: 0, successRate75: 0, percentileData: [] }, clientName, 'wealth-chart')
      // All exports done — wipe the session
      onCloseSession()
    } finally {
      setIsClosingSession(false)
    }
  }

  return (
    <div className="space-y-5" id="results-panel">
      {/* Export bar — responsive: stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Pensioenprognose</h2>
          <p className="text-xs text-slate-400">Alle bedragen in huidige koopkracht (reëel)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExcel} className="btn-secondary">
            <Sheet size={14} />
            Excel
          </button>
          <button onClick={handlePDF} disabled={isExportingPdf} className="btn-primary">
            <FileText size={14} />
            {isExportingPdf ? 'Laden...' : 'PDF klant'}
          </button>
          {/* Combined export + wipe — the key mobile/session workflow button */}
          <button
            onClick={handleExportAndClose}
            disabled={isClosingSession || isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Exporteer PDF + Excel en wis daarna alle invoergegevens"
          >
            <LogOut size={14} />
            {isClosingSession ? 'Exporteren…' : 'Exporteer & sluit sessie'}
          </button>
        </div>
      </div>

      {/* Key metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Verwacht eindvermogen"
          value={eur(result.projectedCapital)}
          sub={`bij leeftijd ${inputs.retirementAge}`}
          accent="blue"
          size="large"
        />
        <MetricCard
          label="Benodigd eindvermogen"
          value={eur(result.requiredCapital)}
          sub={`voor ${inputs.lifeExpectancy - inputs.retirementAge} jaar inkomen`}
        />
        <MetricCard
          label={isOnTrack ? 'Overschot' : 'Tekort'}
          value={eur(surplus)}
          sub={isOnTrack ? 'meer dan nodig' : 'extra nodig'}
          accent={isOnTrack ? 'green' : 'red'}
        />
        <MetricCard
          label="Benodigde maandinleg"
          value={needsMoreContribution ? eur(result.requiredMonthlyContribution) : '—'}
          sub={needsMoreContribution ? `huidig: ${eur(currentMonthlyPMT)}/mnd` : 'Huidige inleg voldoende'}
          accent={needsMoreContribution ? 'amber' : 'green'}
        />
      </div>

      {/* Income phases */}
      <div className="card">
        <div className="flex justify-between items-baseline mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Inkomen per fase</h3>
          <span className="text-xs text-slate-400">Gewenst: {eur(result.desiredMonthlyNetto)}/mnd</span>
        </div>
        <div className="space-y-3">
          {result.incomePhases.map((phase, i) => {
            const total = phase.total
            const isGap = phase.aow === 0 && phase.employerPension === 0
            return (
              <div key={i} className={`rounded-xl p-3 border ${isGap ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-semibold ${isGap ? 'text-amber-700' : 'text-slate-600'}`}>
                    {isGap ? '⚠ ' : ''}{phase.label}
                    {isGap && <span className="ml-1 font-normal">(overbrugging)</span>}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{eur(total)}/mnd</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Eigen vermogen', value: phase.incomeFromCapital, color: '#2563eb' },
                    { label: 'AOW', value: phase.aow, color: '#10b981' },
                    { label: 'Werkgeverspensioen', value: phase.employerPension, color: '#8b5cf6' },
                  ].filter(r => r.value > 0 || r.label === 'Eigen vermogen').map(row => (
                    <div key={row.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-xs text-slate-500 flex-1">{row.label}</span>
                      <span className="text-xs font-medium text-slate-700">{eur(row.value)}</span>
                      <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full" style={{
                          width: total > 0 ? `${(row.value / result.desiredMonthlyNetto) * 100}%` : '0%',
                          backgroundColor: row.color
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Restkapitaal bij {inputs.lifeExpectancy} jaar:{' '}
          <span className={result.surplusAtEnd >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
            {result.surplusAtEnd >= 0 ? eur(result.surplusAtEnd) : `−${eur(Math.abs(result.surplusAtEnd))}`}
          </span>
        </p>

        {/* Inflation detail toggle */}
        <button
          onClick={() => setShowInflationDetail(v => !v)}
          className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <span>{showInflationDetail ? '▲' : '▼'}</span>
          {showInflationDetail ? 'Verberg nominale bedragen' : 'Toon nominale inkomensbedragen'}
        </button>

        {showInflationDetail && (() => {
          // Key milestones: retirement, mid-retirement, life expectancy
          const yRetirement = result.yearsToRetirement
          const yMid = yRetirement + Math.round(result.yearsInRetirement / 2)
          const yEnd = yRetirement + result.yearsInRetirement
          const milestones = [
            { label: `Nu (leeftijd ${inputs.currentAge})`, age: inputs.currentAge, yearsFromNow: 0 },
            { label: `Pensionering (leeftijd ${inputs.retirementAge})`, age: inputs.retirementAge, yearsFromNow: yRetirement },
            ...(result.yearsInRetirement > 4 ? [{ label: `Leeftijd ${inputs.retirementAge + Math.round(result.yearsInRetirement / 2)}`, age: inputs.retirementAge + Math.round(result.yearsInRetirement / 2), yearsFromNow: yMid }] : []),
            { label: `Leeftijd ${inputs.lifeExpectancy}`, age: inputs.lifeExpectancy, yearsFromNow: yEnd },
          ]
          return (
            <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                Koopkrachtbehoud — nominale inkomensbedragen ({inputs.inflation}% inflatie)
              </p>
              <p className="text-xs text-blue-600 mb-3 leading-relaxed">
                Het gewenste inkomen van {eur(result.desiredMonthlyNetto)}/mnd is in huidige koopkracht.
                De simulatie werkt met reëel rendement, zodat koopkracht behouden blijft.
                Onderstaand zie je hoeveel dat nominaal betekent per leeftijd.
              </p>
              <div className="space-y-1.5">
                {milestones.map(m => {
                  const nominal = nominalIncome(result.desiredMonthlyNetto, inputs.inflation, m.yearsFromNow)
                  const isNow = m.yearsFromNow === 0
                  return (
                    <div key={m.label} className="flex justify-between items-center">
                      <span className="text-xs text-blue-700">{m.label}</span>
                      <span className={`text-xs font-semibold ${isNow ? 'text-slate-600' : 'text-blue-800'}`}>
                        {eur(nominal)}/mnd{isNow ? ' (reëel)' : ' nominaal'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Chart */}
      <div className="card" id="wealth-chart">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Vermogensontwikkeling</h3>
          <div className="flex items-center gap-3">
            {mc && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMonteCarlo}
                  onChange={e => setShowMonteCarlo(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-slate-500">Monte Carlo bandbreedte</span>
              </label>
            )}
            <button
              onClick={onRunMonteCarlo}
              disabled={isCalculating}
              className="btn-secondary py-1 text-xs"
            >
              <RefreshCw size={12} className={isCalculating ? 'animate-spin' : ''} />
              {isCalculating ? 'Berekenen…' : 'Monte Carlo'}
            </button>
          </div>
        </div>
        {mc ? (
          <WealthChart
            result={result}
            mc={mc}
            retirementAge={inputs.retirementAge}
            showMonteCarlo={showMonteCarlo}
            lifeEvents={inputs.lifeEvents ?? []}
            currentAge={inputs.currentAge}
          />
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
            <TrendingUp size={40} strokeWidth={1} />
            <div className="text-center">
              <p className="text-sm font-medium">Klik op Monte Carlo om de simulatie te starten</p>
              <p className="text-xs mt-1">2.000 scenario's gebaseerd op opgegeven volatiliteit</p>
            </div>
          </div>
        )}
      </div>

      {/* Monte Carlo gauges — two side by side */}
      {mc && (
        <div className="grid grid-cols-2 gap-3">
          <SuccessGauge
            value={mc.successRate75}
            title="Kans op 75% inkomensdoel"
            subtitle="Acceptabele terugval"
          />
          <SuccessGauge
            value={mc.successRate}
            title="Kans op volledig inkomensdoel"
            subtitle="Volledig doelbedrag"
          />
        </div>
      )}

      {/* Assumptions note */}
      <p className="text-xs text-slate-400 leading-relaxed px-1">
        Berekeningen op basis van reëel rendement (na inflatie van {inputs.inflation}%). AOW en werkgeverspensioen zijn in netto termen.
        Monte Carlo simuleert {2000} scenario's met jaarlijkse rendementsschommelingen.
        Dit is een indicatieve berekening en geen financieel advies.
      </p>
    </div>
  )
}
