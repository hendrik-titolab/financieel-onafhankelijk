import { FileText, Sheet, TrendingUp, LogOut, X, MessageSquare, RotateCcw } from 'lucide-react'
import type { PensionResult, MonteCarloResult, PensionInputs } from '../../types'
import { WealthChart } from './WealthChart'
import { exportToExcel } from '../../utils/exportExcel'
import { exportToPDF } from '../../utils/exportPDF'
import { FEEDBACK_URL } from '../../config/site'
import { FREE_DOWNLOAD_LIMIT, getDownloadCount, incrementDownloadCount } from '../../utils/downloadLimit'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { InstallAppButton } from '../InstallAppButton'
import { useState } from 'react'

const INSTALL_BANNER_DISMISSED_KEY = 'fp_install_banner_dismissed'

interface Props {
  inputs: PensionInputs
  result: PensionResult
  mc: MonteCarloResult | null
  mcStale: boolean
  isCalculating: boolean
  onRunMonteCarlo: () => void
  clientName: string
  onCloseSession: () => void
}

// Bedragen worden standaard mét teken getoond. Een negatief eindvermogen is een
// tekort en moet ook als tekort te lezen zijn: de oude versie deed altijd
// Math.abs(), waardoor een grótere tegenvaller als een hóger eindvermogen op het
// scherm kwam (bevinding A3).
//
// Gebruik eurAbs() alleen daar waar het label of de toon het teken al draagt,
// zoals de KPI die zelf wisselt tussen "Overschot" en "Tekort". Anders staat er
// twee keer een min.
function eur(v: number): string {
  const rounded = Math.round(v)
  const teken = rounded < 0 ? '−' : ''
  return `${teken}€ ${Math.abs(rounded).toLocaleString('nl-NL')}`
}

function eurAbs(v: number): string {
  return `€ ${Math.abs(Math.round(v)).toLocaleString('nl-NL')}`
}

// KPI-raster: één haarlijn-grid i.p.v. losse kaarten. Precies één donkere cel
// per scherm (de belangrijkste uitkomst); tekort krijgt terracotta + een stip
// zodat betekenis nooit alleen via kleur loopt.
function MetricCell({
  label, value, sub, tone
}: {
  label: string; value: string; sub?: string; tone?: 'tekort' | 'nadruk'
}) {
  const isDark = tone === 'nadruk'
  return (
    <div className={`px-4 py-[15px] flex flex-col justify-center min-w-0 ${isDark ? 'bg-ink' : 'bg-panel'}`}>
      <p className={`label-mono truncate mb-2 ${isDark ? 'text-on-dark' : ''}`}>{label}</p>
      <div className="flex items-center gap-1.5 min-w-0">
        {tone === 'tekort' && <span className="w-[5px] h-[5px] rounded-full bg-signal flex-shrink-0" aria-hidden="true" />}
        <span
          className={`font-numeric tabular text-[30px] leading-none truncate ${
            tone === 'tekort' ? 'text-signal' : isDark ? 'text-warmwhite' : 'text-ink'
          }`}
        >
          {value}
        </span>
      </div>
      {sub && <p className={`text-xs mt-1 truncate ${isDark ? 'text-on-dark' : 'text-body'}`}>{sub}</p>}
    </div>
  )
}

function SuccessGauge({ value, title, subtitle }: { value: number; title: string; subtitle: string }) {
  const color = value >= 80 ? '#29392E' : value >= 60 ? '#9A835B' : '#A85A3C'
  const oordeel = value >= 80 ? 'Goed' : value >= 60 ? 'Redelijk' : 'Risicovol'
  const angle = (value / 100) * 180 - 90  // -90° (links) tot +90° (rechts)

  return (
    <div className="card flex flex-col items-center justify-center gap-1 py-4">
      <span className="text-xs font-medium text-body text-center leading-tight">{title}</span>
      <span className="text-xs text-body text-center leading-tight mb-1">{subtitle}</span>
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#DAD5CD" strokeWidth="10" strokeLinecap="round" />
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
          stroke="#29392E" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="60" cy="65" r="4" fill="#29392E" />
      </svg>
      <div className="text-center">
        <span className="font-numeric tabular text-2xl" style={{ color }}>{value.toFixed(1)}%</span>
        <span className="text-xs text-body block">{oordeel}</span>
      </div>
    </div>
  )
}

// Nominal income at a given number of years from today (real amount × accumulated inflation)
function nominalIncome(realMonthly: number, inflation: number, yearsFromNow: number): number {
  return realMonthly * Math.pow(1 + inflation / 100, yearsFromNow)
}

export function ResultsPanel({ inputs, result, mc, mcStale, isCalculating, onRunMonteCarlo, clientName, onCloseSession }: Props) {
  const [showMonteCarlo, setShowMonteCarlo] = useState(true)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [showInflationDetail, setShowInflationDetail] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [downloadCount, setDownloadCount] = useState(() => getDownloadCount())
  const [installBannerDismissed, setInstallBannerDismissed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === 'true'
  )
  const { canInstall: canInstallApp } = useInstallPrompt()
  const limitReached = downloadCount >= FREE_DOWNLOAD_LIMIT
  const surplus = result.projectedCapital - result.requiredCapital
  const isOnTrack = surplus >= 0
  const currentMonthlyPMT = inputs.contributionFrequency === 'maandelijks'
    ? inputs.monthlyContribution
    : inputs.monthlyContribution / 12
  const needsMoreContribution = result.requiredMonthlyContribution > currentMonthlyPMT

  const handlePDF = async () => {
    if (limitReached) return
    setIsExportingPdf(true)
    try {
      await exportToPDF(inputs, result, mc, clientName, 'wealth-chart')
      setDownloadCount(incrementDownloadCount())
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExcel = async () => {
    if (limitReached) return
    await exportToExcel(inputs, result, mc ?? { successRate: 0, successRate75: 0, percentileData: [] }, clientName)
    setDownloadCount(incrementDownloadCount())
  }

  // Wis alle invoer zonder iets op te slaan (na bevestiging)
  const handleWipe = () => {
    setConfirmingClose(false)
    onCloseSession()
  }

  return (
    <div className="space-y-5" id="results-panel">
      {/* Welkom / invulinstructie */}
      {showIntro && (
        <div className="relative rounded-[3px] border border-line bg-morning p-4 pr-10">
          <button
            onClick={() => setShowIntro(false)}
            className="absolute top-2.5 right-2.5 text-muted hover:text-ink transition-colors"
            title="Sluiten"
          >
            <X size={16} />
          </button>
          <p className="text-sm font-medium text-ink mb-1">Hallo, welkom op deze pagina! 👋</p>
          <p className="text-sm text-ink leading-relaxed">
            Vul eerst links de <span className="font-medium">Uitgangspunten</span> in en eventueel de{' '}
            <span className="font-medium">Eenmalige bedragen</span>. Klik daarna op{' '}
            <span className="font-medium">Bereken</span> en je krijgt antwoord op de vraag:
            {' '}<span className="italic">"Ben ik financieel onafhankelijk?"</span>{' '}
            Veel plezier met rekenen, en laat gerust een reactie achter als je feedback of
            gedachten met ons wilt delen!
          </p>
        </div>
      )}

      {/* Bevestiging bij afsluiten */}
      {confirmingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setConfirmingClose(false)}>
          <div className="bg-panel rounded-[3px] border border-line max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <p className="text-base font-medium text-ink mb-1">Weet je het zeker?</p>
            <p className="text-sm text-body mb-4 leading-relaxed">
              Wil je afsluiten zonder iets op te slaan? Alle ingevoerde gegevens worden gewist.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmingClose(false)}
                className="px-4 py-2 text-sm font-medium text-body hover:bg-canvas rounded-[3px] transition-colors"
              >
                Nee, terug
              </button>
              <button
                onClick={handleWipe}
                className="px-4 py-2 text-sm font-medium bg-signal hover:bg-[#8F4B30] text-warmwhite rounded-[3px] transition-colors"
              >
                Ja, wis alles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export bar — responsive: stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-ink">Pensioenprognose</h2>
          <p className="text-xs text-body">Alle bedragen in huidige koopkracht (reëel)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExcel} disabled={limitReached}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-transparent text-ink border border-sand hover:bg-warmwhite rounded-[3px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <Sheet size={14} />
            Download Excel
          </button>
          <button onClick={handlePDF} disabled={isExportingPdf || limitReached}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-ink hover:bg-[#1F2C23] text-warmwhite rounded-[3px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <FileText size={14} />
            {isExportingPdf ? 'Laden...' : 'Download PDF'}
          </button>
          {FEEDBACK_URL && (
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-transparent text-ink border border-sand hover:bg-warmwhite rounded-[3px] transition-colors">
              <MessageSquare size={14} />
              Laat een reactie achter
            </a>
          )}
          <button
            onClick={() => setConfirmingClose(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-body hover:text-signal rounded-[3px] transition-colors"
            title="Wis alle invoergegevens"
          >
            <LogOut size={14} />
            Sluit af en wis alles
          </button>
        </div>
      </div>

      {limitReached ? (
        <p className="text-xs text-ink bg-panel border border-signal rounded-[3px] px-3 py-2">
          Je hebt het maximum aan gratis downloads bereikt. Neem{' '}
          {FEEDBACK_URL ? (
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium text-signal hover:text-ink">
              contact
            </a>
          ) : (
            'contact'
          )}
          {' '}op als je meer berekeningen wil downloaden.
        </p>
      ) : (
        <p className="text-xs text-body">
          Nog {FREE_DOWNLOAD_LIMIT - downloadCount} gratis download{FREE_DOWNLOAD_LIMIT - downloadCount === 1 ? '' : 's'} beschikbaar.
        </p>
      )}

      {/* KPI-raster: haarlijnen tussen de cellen, precies één donkere cel */}
      <div
        className="grid grid-cols-2 gap-px bg-line border border-line rounded-[3px] overflow-hidden"
      >
        <MetricCell
          label="Verwacht eindvermogen"
          value={eur(result.projectedCapital)}
          sub={`bij leeftijd ${inputs.retirementAge}`}
        />
        <MetricCell
          label="Benodigd eindvermogen"
          value={eur(result.requiredCapital)}
          sub={`voor ${inputs.lifeExpectancy - inputs.retirementAge} jaar inkomen`}
        />
        <MetricCell
          label={isOnTrack ? 'Overschot' : 'Tekort'}
          value={eurAbs(surplus)}
          sub={isOnTrack ? 'meer dan nodig' : 'extra nodig'}
          tone={isOnTrack ? undefined : 'tekort'}
        />
        <MetricCell
          label="Benodigde maandinleg"
          value={needsMoreContribution ? eur(Math.max(0, result.requiredMonthlyContribution)) : '—'}
          sub={needsMoreContribution ? `huidig: ${eur(currentMonthlyPMT)}/mnd` : 'Huidige inleg voldoende'}
          tone="nadruk"
        />
      </div>

      {/* Income phases */}
      <div className="card">
        <div className="flex justify-between items-baseline mb-4">
          <h3 className="text-sm font-medium text-ink">Inkomen per fase</h3>
          <span className="text-xs text-body">Gewenst: {eur(result.desiredMonthlyNetto)}/mnd</span>
        </div>
        <div className="space-y-3">
          {result.incomePhases.map((phase, i) => {
            const total = phase.total
            const isGap = phase.aow === 0 && phase.employerPension === 0
            return (
              <div key={i} className={`rounded-[3px] p-3 border ${isGap ? 'border-signal bg-panel' : 'border-line-soft bg-canvas'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-medium ${isGap ? 'text-signal' : 'text-body'}`}>
                    {isGap ? '⚠ ' : ''}{phase.label}
                    {isGap && <span className="ml-1 font-normal">(overbrugging)</span>}
                  </span>
                  <span className="font-numeric tabular text-sm text-ink">{eur(total)}/mnd</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Eigen vermogen', value: phase.incomeFromCapital, color: '#527898' },
                    { label: 'AOW', value: phase.aow, color: '#29392E' },
                    { label: 'Werkgeverspensioen', value: phase.employerPension, color: '#9A835B' },
                  ].filter(r => r.value > 0 || r.label === 'Eigen vermogen').map(row => (
                    <div key={row.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-xs text-body flex-1">{row.label}</span>
                      <span className="font-numeric tabular text-xs text-ink">{eur(row.value)}</span>
                      <div className="w-24 h-1.5 bg-field rounded-full overflow-hidden flex-shrink-0">
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
        <p className="text-xs text-body mt-3">
          Restkapitaal bij {inputs.lifeExpectancy} jaar:{' '}
          <span className={`font-numeric tabular font-medium ${result.surplusAtEnd >= 0 ? 'text-ink' : 'text-signal'}`}>
            {eur(result.surplusAtEnd)}
          </span>
        </p>

        {/* Inflation detail toggle */}
        <button
          onClick={() => setShowInflationDetail(v => !v)}
          className="mt-3 text-xs text-data-700 hover:text-ink font-medium flex items-center gap-1"
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
            <div className="mt-3 rounded-[3px] bg-morning border border-line p-3">
              <p className="text-xs font-medium text-ink mb-2">
                Koopkrachtbehoud: nominale inkomensbedragen ({inputs.inflation}% inflatie)
              </p>
              <p className="text-xs text-body mb-3 leading-relaxed">
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
                      <span className="text-xs text-body">{m.label}</span>
                      <span className={`font-numeric tabular text-xs font-medium ${isNow ? 'text-body' : 'text-ink'}`}>
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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-ink">Vermogensontwikkeling</h3>
            {mc && mcStale && (
              <span className="inline-flex items-center gap-1 text-xs text-signal">
                <RotateCcw size={11} />
                Verouderd
              </span>
            )}
          </div>
          {mc && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMonteCarlo}
                  onChange={e => setShowMonteCarlo(e.target.checked)}
                  className="rounded accent-ink"
                />
                <span className="text-xs text-body">Monte Carlo bandbreedte</span>
              </label>
              {mcStale && (
                <button onClick={onRunMonteCarlo} disabled={isCalculating}
                  className="text-xs text-data-700 hover:text-ink font-medium disabled:opacity-60">
                  {isCalculating ? 'Berekenen…' : 'Opnieuw berekenen →'}
                </button>
              )}
            </div>
          )}
        </div>
        {mc ? (
          <div className={mcStale ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <WealthChart
              result={result}
              mc={mc}
              retirementAge={inputs.retirementAge}
              showMonteCarlo={showMonteCarlo}
              lifeEvents={inputs.lifeEvents ?? []}
              currentAge={inputs.currentAge}
            />
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-body gap-3">
            <TrendingUp size={40} strokeWidth={1} />
            <div className="text-center">
              <p className="text-sm font-medium">Klik op Bereken om de simulatie te starten</p>
              <p className="text-xs mt-1 text-body">2.000 scenario's gebaseerd op opgegeven volatiliteit</p>
            </div>
          </div>
        )}
      </div>

      {/* Monte Carlo gauges — two side by side */}
      {mc && (
        <div className={`grid grid-cols-2 gap-3 ${mcStale ? 'opacity-50 transition-opacity' : 'transition-opacity'}`}>
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

      {/* App-installatie: alleen tonen na een eerste berekening, en niet meer na wegklikken */}
      {mc && canInstallApp && !installBannerDismissed && (
        <div className="rounded-[3px] border border-line bg-morning p-4 pr-10 relative flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, 'true')
              setInstallBannerDismissed(true)
            }}
            className="absolute top-2.5 right-2.5 text-muted hover:text-ink transition-colors"
            title="Sluiten"
          >
            <X size={16} />
          </button>
          <p className="text-sm text-ink leading-relaxed flex-1 min-w-[200px]">
            Wist je dat je deze tool ook als app kunt installeren? Werkt ook offline.
          </p>
          <InstallAppButton
            label="Installeer nu"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-ink hover:bg-[#1F2C23] text-warmwhite rounded-[3px] transition-colors flex-shrink-0"
          />
        </div>
      )}

      {/* Assumptions note */}
      <p className="text-xs text-body leading-relaxed px-1">
        Deze berekening gaat uit van vrij belegd vermogen in box 3. Staat een deel van je geld in een
        lijfrente, op een bankspaarrekening of in pensioenbeleggen, dan is de opname daaruit belast in
        box 1 en houd je netto minder over dan hier staat.
        We berekenen in 2.000 scenario's met verschillende toekomstige rendementen hoe groot de kans is dat je jouw doel haalt.
        Voor het gemiddelde rendement en de inflatie gaan we uit van wat er is ingevoerd.
        Dit is een indicatieve berekening en geen financieel advies.
        Voor goed advies raden wij aan een financieel planner te raadplegen:
        vind een geschikte specialist op{' '}
        <a href="https://www.ffp.nl" target="_blank" rel="noopener noreferrer"
          className="text-data-700 hover:underline">ffp.nl</a>.
      </p>
    </div>
  )
}
