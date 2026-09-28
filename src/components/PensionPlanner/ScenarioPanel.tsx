import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { PensionInputs, PensionResult, BerekeningsSet } from '../../types'
import type { Scenarios, AowScenario, Richting } from '../../utils/scenarios'
import { GEEN_SCENARIO, SCENARIO_STAPPEN, heeftScenario, scenarioOmschrijving } from '../../utils/scenarios'
import { slagingskansPercentage } from '../../utils/slagingskansTekst'
import { Toggle } from './InputPanel'

interface Props {
  scenarios: Scenarios
  onChange: (s: Scenarios) => void
  /** De eigen invoer, zonder scenario: voor de hints bij de schakelaars. */
  inputs: PensionInputs
  /** De live uitkomst mét scenario. */
  result: PensionResult
  /** De live uitkomst zonder scenario, of null als er geen scenario aan staat. */
  basisResult: PensionResult | null
  berekening: BerekeningsSet | null
  mcStale: boolean
}

function eur(v: number): string {
  const r = Math.round(v)
  return `${r < 0 ? '−' : ''}€ ${Math.abs(r).toLocaleString('nl-NL')}`
}

const pct = (v: number) => v.toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + '%'

/**
 * Scenario-schakelaars: wat gebeurt er met mijn plan als de AOW lager uitvalt, het
 * rendement tegenvalt of ik langer leef? Gevraagd door Hendrik op 28 september 2026.
 *
 * Een scenario verandert alleen de invoer van de rekenkernen (utils/scenarios.ts).
 * Het invoerpaneel links blijft de eigen invoer tonen. Hier staat de uitkomst met en
 * zonder scenario naast elkaar, zodat het effect zichtbaar is in plaats van dat alleen
 * de getallen eronder verspringen.
 *
 * Geen gekleurd oordeel over de slagingskans: dat is bij auditbevinding 15 bewust
 * weggehaald, omdat een norm als "80% is goed" nergens onderbouwd wordt.
 */
export function ScenarioPanel({ scenarios, onChange, inputs, result, basisResult, berekening, mcStale }: Props) {
  const actief = heeftScenario(scenarios)
  const [open, setOpen] = useState(false)
  const zet = (deel: Partial<Scenarios>) => onChange({ ...scenarios, ...deel })
  const stap = SCENARIO_STAPPEN

  // De kansen komen uit de laatste afgeronde berekening, en alleen als die bij de
  // huidige invoer én de huidige scenario's hoort.
  const kansen = berekening && berekening.basis && !mcStale
    ? { zonder: berekening.basis.mc.successRate, met: berekening.mc.successRate }
    : null

  const overschot = (r: PensionResult) => r.projectedCapital - r.requiredCapital

  return (
    <div className={`rounded-[3px] border ${actief ? 'border-signal' : 'border-line'} bg-panel`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-ink">
          Scenario's
          {actief && (
            <span className="ml-2 text-xs font-normal text-signal">
              aan: {scenarioOmschrijving(scenarios).join(', ')}
            </span>
          )}
        </span>
        <ChevronDown size={16} className={`text-body transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-line-soft pt-3">
          <p className="text-xs text-body leading-relaxed">
            Test wat er met je plan gebeurt als het anders loopt dan je invult. Een scenario is een
            stresstest, geen verwachting. Links blijft je eigen invoer staan; de uitkomst hieronder
            rekent met het scenario.
          </p>

          <div className="space-y-1">
            <span className="label">AOW</span>
            <Toggle value={scenarios.aow} onChange={v => zet({ aow: v as AowScenario })}
              options={[
                { value: 'normaal', label: 'Zoals ingevuld' },
                { value: 'gehalveerd', label: 'Gehalveerd' },
                { value: 'verdwenen', label: 'Geen AOW' },
              ]} />
            <p className="text-xs text-body">Geldt voor jou en, als die meerekent, je partner.</p>
          </div>

          <div className="space-y-1">
            <span className="label">Rendement</span>
            <Toggle value={scenarios.rendement} onChange={v => zet({ rendement: v as Richting })}
              options={[
                { value: 'lager', label: `−${stap.rendementProcentpunt}%-punt` },
                { value: 'normaal', label: 'Zoals ingevuld' },
                { value: 'hoger', label: `+${stap.rendementProcentpunt}%-punt` },
              ]} />
            <p className="text-xs text-body">
              Ingevuld: {pct(inputs.returnBeforeRetirement)} vóór en {pct(inputs.returnAfterRetirement)} ná
              je pensioendatum.
            </p>
          </div>

          <div className="space-y-1">
            <span className="label">Inflatie</span>
            <Toggle value={scenarios.inflatie} onChange={v => zet({ inflatie: v as Richting })}
              options={[
                { value: 'lager', label: `−${stap.inflatieProcentpunt}%-punt` },
                { value: 'normaal', label: 'Zoals ingevuld' },
                { value: 'hoger', label: `+${stap.inflatieProcentpunt}%-punt` },
              ]} />
            <p className="text-xs text-body">
              Ingevuld: {pct(inputs.inflation)}. Het rendement blijft gelijk, dus hogere inflatie
              betekent minder rendement na inflatie.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={scenarios.langerLeven}
              onChange={e => zet({ langerLeven: e.target.checked })}
              className="rounded accent-ink mt-0.5" />
            <span className="text-xs text-body">
              {stap.langerLevenJaren} jaar langer leven: plannen tot {inputs.lifeExpectancy + stap.langerLevenJaren} in
              plaats van {inputs.lifeExpectancy} jaar
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={scenarios.geenIndexatie}
              onChange={e => zet({ geenIndexatie: e.target.checked })}
              className="rounded accent-ink mt-0.5" />
            <span className="text-xs text-body">
              Werkgeverspensioen en lijfrente stijgen niet mee met de inflatie (de AOW wel)
            </span>
          </label>

          {actief && (
            <button type="button" onClick={() => onChange(GEEN_SCENARIO)}
              className="text-xs text-data-700 hover:text-ink underline">
              Alle scenario's uit
            </button>
          )}
        </div>
      )}

      {actief && basisResult && (
        <div className="px-4 pb-4 pt-3 border-t border-line-soft">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-body">
                <th className="text-left font-normal pb-1"></th>
                <th className="text-right font-normal pb-1">Zonder scenario</th>
                <th className="text-right font-normal pb-1">Met scenario</th>
              </tr>
            </thead>
            <tbody className="font-numeric tabular text-ink">
              <tr>
                <td className="text-body py-0.5">Benodigd eindvermogen</td>
                <td className="text-right">{eur(basisResult.requiredCapital)}</td>
                <td className="text-right">{eur(result.requiredCapital)}</td>
              </tr>
              <tr>
                <td className="text-body py-0.5">Verwacht eindvermogen</td>
                <td className="text-right">{eur(basisResult.projectedCapital)}</td>
                <td className="text-right">{eur(result.projectedCapital)}</td>
              </tr>
              <tr>
                <td className="text-body py-0.5">Overschot of tekort</td>
                <td className="text-right">{eur(overschot(basisResult))}</td>
                <td className={`text-right ${overschot(result) < 0 ? 'text-signal' : ''}`}>{eur(overschot(result))}</td>
              </tr>
              <tr>
                <td className="text-body py-0.5">Kans op volledig doel</td>
                {kansen ? (
                  <>
                    <td className="text-right">{slagingskansPercentage(kansen.zonder)}</td>
                    <td className="text-right">{slagingskansPercentage(kansen.met)}</td>
                  </>
                ) : (
                  <td colSpan={2} className="text-right text-body font-sans">klik op Bereken</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
