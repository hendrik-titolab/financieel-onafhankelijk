import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { PensionInputs, IncomeType, ContributionFrequency, LifeEvent, RiskProfile } from '../../types'
import { RISICOPROFIELEN, PROFIEL_VOLGORDE } from '../../config/risicoprofielen'

const MAX_ROWS = 20

interface Props {
  inputs: PensionInputs
  onChange: (updates: Partial<PensionInputs>) => void
}

// ---- Shared UI primitives ----

function Toggle({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex bg-canvas rounded-[3px] p-0.5 gap-0.5">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`toggle-btn ${value === opt.value ? 'toggle-btn-active' : 'toggle-btn-inactive'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="label-mono pt-1">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

// Bedragvelden houden de ruwe tekst lokaal bij, zodat een leeg veld leeg mag
// blijven terwijl je typt. Alleen bij het verlaten van het veld valt een lege
// of ongeldige invoer terug op 0 — niet meer bij elke toetsaanslag.
function NumberInput({ value, onChange, prefix, suffix, step = 1, min = 0, max }: {
  value: number; onChange: (v: number) => void
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number
}) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    // Alleen synchroniseren als de waarde van buitenaf wijzigt (bijv. profielwissel),
    // niet bij elke render, anders overschrijft dit het typen.
    if (Number(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'))
    const next = isNaN(parsed) ? 0 : parsed
    setText(String(next))
    onChange(next)
  }

  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-body text-sm">{prefix}</span>}
      <input type="number" value={text} min={min} max={max} step={step}
        onChange={e => {
          setText(e.target.value)
          const parsed = parseFloat(e.target.value.replace(',', '.'))
          if (!isNaN(parsed)) onChange(parsed)
        }}
        onBlur={e => commit(e.target.value)}
        onFocus={e => e.target.select()}
        className={`input-field ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`} />
      {suffix && <span className="absolute right-3 text-body text-sm">{suffix}</span>}
    </div>
  )
}

function AgeSliderRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  const fillPct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="label mb-0">{label}</label>
        <span className="font-numeric tabular text-sm text-data-700">{value} jaar</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        style={{ '--range-fill': `${fillPct}%` } as React.CSSProperties}
        onChange={e => onChange(parseInt(e.target.value))} />
      <div className="flex justify-between text-xs text-body">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

// ---- Parameters tab ----

function ParametersTab({ inputs, onChange }: Props) {
  return (
    <div className="space-y-5 pb-4">
      <Section title="Leeftijd">
        <AgeSliderRow label="Huidige leeftijd" value={inputs.currentAge} min={18} max={70}
          onChange={v => onChange({ currentAge: v })} />
        <AgeSliderRow label="Pensioenleeftijd" value={inputs.retirementAge} min={50} max={75}
          onChange={v => onChange({ retirementAge: v })} />
        <AgeSliderRow label="Levensverwachting" value={inputs.lifeExpectancy}
          min={inputs.retirementAge + 1} max={100}
          onChange={v => onChange({ lifeExpectancy: v })} />
      </Section>

      <div className="border-t border-line-soft" />

      <Section title="Vermogen & Inleg">
        <Field label="Huidig vermogen">
          <NumberInput value={inputs.currentCapital} onChange={v => onChange({ currentCapital: v })}
            prefix="€" step={1000} />
        </Field>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="label mb-0">Inleg</label>
            <Toggle value={inputs.contributionFrequency}
              onChange={v => onChange({ contributionFrequency: v as ContributionFrequency })}
              options={[{ value: 'maandelijks', label: 'Maand' }, { value: 'jaarlijks', label: 'Jaar' }]} />
          </div>
          <NumberInput value={inputs.monthlyContribution}
            onChange={v => onChange({ monthlyContribution: v })} prefix="€" step={50} />
        </div>
      </Section>

      <div className="border-t border-line-soft" />

      <Section title="Inkomen">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="label mb-0">Huidig inkomen</label>
            <Toggle value={inputs.currentIncomeType}
              onChange={v => onChange({ currentIncomeType: v as IncomeType })}
              options={[{ value: 'bruto', label: 'Bruto' }, { value: 'netto', label: 'Netto' }]} />
          </div>
          <NumberInput value={inputs.currentIncome} onChange={v => onChange({ currentIncome: v })}
            prefix="€" suffix="/jr" step={500} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="label mb-0">Gewenst pensioeninkomen</label>
            <Toggle value={inputs.desiredRetirementIncomeType}
              onChange={v => onChange({ desiredRetirementIncomeType: v as IncomeType })}
              options={[{ value: 'bruto', label: 'Bruto' }, { value: 'netto', label: 'Netto' }]} />
          </div>
          <NumberInput value={inputs.desiredRetirementIncome}
            onChange={v => onChange({ desiredRetirementIncome: v })}
            prefix="€" suffix="/mnd" step={100} />
          <p className="text-xs text-body">In koopkracht van vandaag: inflatie wordt automatisch verwerkt</p>
        </div>
        <Field label="Inflatie">
          <NumberInput value={inputs.inflation}
            onChange={v => onChange({ inflation: v })} suffix="%" step={0.1} min={0} max={10} />
          <p className="text-xs text-body mt-1">Waarmee we je koopkracht corrigeren (Nederlands langjarig gemiddelde: circa 3,5%, CBS 1960-2025).</p>
        </Field>
      </Section>

      <div className="border-t border-line-soft" />

      <Section title="Pensioenuitkeringen">
        {/* Referentie aan je eigen pensioenleeftijd: die staat in de sectie
            "Leeftijd" hierboven, dus zonder deze regel zie je 'm niet meer
            terwijl je AOW en werkgeverspensioen invult — precies waar het
            mis kan gaan als die twee leeftijden bewust ver uit elkaar liggen
            (bijv. stoppen op 50, pensioenen die pas op 65-70 ingaan). */}
        <div className="rounded-[3px] bg-morning border border-line px-3 py-2">
          <p className="text-xs text-ink">
            Je stopt met werken op <span className="font-medium">{inputs.retirementAge} jaar</span>{' '}
            (in te stellen bij "Leeftijd" hierboven). AOW en werkgeverspensioen mogen daar los van staan.
          </p>
        </div>
        <Field label="AOW netto per maand">
          <NumberInput value={inputs.aowMaandBedragNetto}
            onChange={v => onChange({ aowMaandBedragNetto: v })} prefix="€" step={50} />
          <p className="text-xs text-body mt-1">
            Te vinden op{' '}
            <a href="https://www.mijnpensioenoverzicht.nl" target="_blank" rel="noopener noreferrer"
              className="text-data-700 hover:underline">mijnpensioenoverzicht.nl</a>.
            {' '}Alleenstaand ~€1.558/mnd, samenwonend ~€1.068/mnd (2026, met heffingskorting).
          </p>
        </Field>
        <Field label="AOW ingangsdatum (leeftijd)">
          <NumberInput value={inputs.aowStartAge} onChange={v => onChange({ aowStartAge: v })}
            suffix="jr" step={1} min={60} max={75} />
        </Field>
        <div className="border-t border-line-soft pt-3">
          <Field label="Werkgeverspensioen (bruto/mnd)">
            <NumberInput value={inputs.employerPension}
              onChange={v => onChange({ employerPension: v })} prefix="€" step={50} />
          </Field>
          <div className="mt-2">
            <Field label="Werkgeverspensioen ingang (leeftijd)">
              <NumberInput value={inputs.employerPensionStartAge}
                onChange={v => onChange({ employerPensionStartAge: v })}
                suffix="jr" step={1} min={55} max={75} />
            </Field>
            <p className="text-xs text-body mt-1">
              Controleer op de UPO of via{' '}
              <a href="https://www.mijnpensioenoverzicht.nl" target="_blank" rel="noopener noreferrer"
                className="text-data-700 hover:underline">mijnpensioenoverzicht.nl</a>.
            </p>
          </div>
        </div>
        {inputs.retirementAge < Math.min(inputs.aowStartAge, inputs.employerPensionStartAge) && (
          <p className="text-xs text-signal bg-panel border border-signal rounded-[3px] p-2 leading-relaxed">
            ⚠ Overbruggingsperiode van {Math.min(inputs.aowStartAge, inputs.employerPensionStartAge) - inputs.retirementAge} jaar: eigen vermogen dekt het volledige inkomen.
          </p>
        )}
      </Section>

      <div className="border-t border-line-soft" />

      <RisicoprofielSection inputs={inputs} onChange={onChange} />
    </div>
  )
}

// ---- Risicoprofiel: schuif + uitleg, of zelf invullen ----
function RisicoprofielSection({ inputs, onChange }: Props) {
  const profiel = RISICOPROFIELEN[inputs.riskProfile]
  const index = Math.max(0, PROFIEL_VOLGORDE.indexOf(inputs.riskProfile))

  const kiesProfiel = (i: number) => {
    const key = PROFIEL_VOLGORDE[i] as RiskProfile
    const p = RISICOPROFIELEN[key]
    onChange({
      riskProfile: key,
      returnBeforeRetirement: p.rendementVoor,
      returnAfterRetirement: p.rendementNa,
      volatilityPre: p.volatiliteitVoor,
      volatilityPost: p.volatiliteitNa,
    })
  }

  return (
    <Section title="Risicoprofiel">
      {!inputs.useCustomReturns && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="label mb-0">Beleggingsprofiel</label>
            <span className="text-sm font-medium text-data-700">{profiel.label}</span>
          </div>
          <input type="range" min={0} max={PROFIEL_VOLGORDE.length - 1} step={1} value={index}
            style={{ '--range-fill': `${(index / (PROFIEL_VOLGORDE.length - 1)) * 100}%` } as React.CSSProperties}
            onChange={e => kiesProfiel(parseInt(e.target.value))} />
          <div className="flex justify-between text-xs text-body">
            <span>Defensiever</span><span>Offensiever</span>
          </div>
          <div className="rounded-[3px] bg-canvas border border-line-soft p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-body">Verwacht rendement</span>
              <span className="font-medium text-ink">{profiel.rendementVoor}% vóór · {profiel.rendementNa}% ná pensioen</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-body">Schommeling (volatiliteit)</span>
              <span className="font-medium text-ink">{profiel.volatiliteitVoor}% / {profiel.volatiliteitNa}%</span>
            </div>
            <p className="text-xs text-body leading-relaxed pt-1">{profiel.uitleg}</p>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input type="checkbox" checked={inputs.useCustomReturns}
          onChange={e => {
            const aan = e.target.checked
            // Bij terugschakelen naar profiel: rendement/volatiliteit van het profiel herstellen
            if (!aan) {
              onChange({
                useCustomReturns: false,
                returnBeforeRetirement: profiel.rendementVoor,
                returnAfterRetirement: profiel.rendementNa,
                volatilityPre: profiel.volatiliteitVoor,
                volatilityPost: profiel.volatiliteitNa,
              })
            } else {
              onChange({ useCustomReturns: true })
            }
          }}
          className="rounded accent-ink" />
        <span className="text-xs text-body">Zelf rendement en volatiliteit invullen</span>
      </label>

      {inputs.useCustomReturns && (
        <div className="space-y-3 pt-1">
          <Field label="Rendement vóór pensioendatum">
            <NumberInput value={inputs.returnBeforeRetirement}
              onChange={v => onChange({ returnBeforeRetirement: v })} suffix="%" step={0.5} min={0} max={20} />
          </Field>
          <Field label="Rendement ná pensioendatum">
            <NumberInput value={inputs.returnAfterRetirement}
              onChange={v => onChange({ returnAfterRetirement: v })} suffix="%" step={0.5} min={0} max={15} />
          </Field>
          <Field label="Volatiliteit vóór pensioendatum">
            <NumberInput value={inputs.volatilityPre}
              onChange={v => onChange({ volatilityPre: v })} suffix="%" step={1} min={0} max={40} />
          </Field>
          <Field label="Volatiliteit ná pensioendatum">
            <NumberInput value={inputs.volatilityPost}
              onChange={v => onChange({ volatilityPost: v })} suffix="%" step={1} min={0} max={30} />
          </Field>
          <p className="text-xs text-body leading-relaxed">
            Monte Carlo rekent met 2.000 scenario's rond dit gemiddelde rendement.
          </p>
        </div>
      )}
    </Section>
  )
}

// ---- Eenmalige bedragen tab ----
//
// Life events en stortingen rekenden altijd al identiek (pensionCalc.ts voegt
// ze samen tot allEvents), maar stonden in twee bijna-gedupliceerde secties
// met een onderscheid dat voor een gebruiker niet te raden was. Eén lijst,
// alles naar inputs.lifeEvents. Het stortingen-veld blijft in de types en in
// pensionCalc bestaan (voor bestaande code-paden), maar deze UI vult het niet
// meer — zie DESIGN_SYSTEM.md-aanvulling / handoff voor de toelichting.
function EenmaligeBedragenSection({ inputs, onChange }: Props) {
  const currentYear = new Date().getFullYear()
  type DraftEvent = { name: string; amount: string; year: string }

  const [rows, setRows] = useState<DraftEvent[]>(() => {
    const saved = [...(inputs.lifeEvents ?? []), ...(inputs.stortingen ?? [])].map(e => ({
      name: e.name ?? '', amount: String(e.amount), year: String(e.year),
    }))
    return [...saved, { name: '', amount: '', year: String(currentYear) }]
  })

  useEffect(() => {
    const valid: LifeEvent[] = rows
      .filter(r => r.amount && r.year && !isNaN(Number(r.amount)) && Number(r.amount) !== 0 && !isNaN(Number(r.year)))
      .map(r => ({ name: r.name.trim() || '—', amount: Number(r.amount), year: Number(r.year) }))
    onChange({ lifeEvents: valid, stortingen: [] })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const isFilled = (r: DraftEvent) => r.amount !== '' && Number(r.amount) !== 0

  const handleChange = (i: number, field: keyof DraftEvent, value: string) => {
    const newRows = rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    if (i === newRows.length - 1 && isFilled(newRows[i]) && newRows.length < MAX_ROWS)
      newRows.push({ name: '', amount: '', year: String(currentYear) })
    setRows(newRows)
  }

  const handleAddRow = () => {
    if (rows.length >= MAX_ROWS) return
    setRows([...rows, { name: '', amount: '', year: String(currentYear) }])
  }

  const handleDelete = (i: number) => {
    const newRows = rows.filter((_, idx) => idx !== i)
    if (newRows.length === 0 || isFilled(newRows[newRows.length - 1]))
      newRows.push({ name: '', amount: '', year: String(currentYear) })
    setRows(newRows)
  }

  const validCount = (inputs.lifeEvents ?? []).length
  const totaalBij = rows.filter(r => isFilled(r) && Number(r.amount) > 0).reduce((s, r) => s + Number(r.amount), 0)
  const totaalAf = rows.filter(r => isFilled(r) && Number(r.amount) < 0).reduce((s, r) => s + Math.abs(Number(r.amount)), 0)

  return (
    <Section title={`Eenmalige bedragen${validCount > 0 ? ` (${validCount})` : ''}`}>
      <p className="text-xs text-body -mt-1 leading-relaxed">
        Een erfenis, verbouwing, extra inleg of opname: eenmalige bedragen die je vermogen op
        een bepaald jaar raken. Positief is een bijschrijving, negatief een afschrijving.
      </p>
      <div className="space-y-3">
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1
          const isDraft = isLast && !isFilled(row)
          const isExpense = Number(row.amount) < 0
          return (
            <div key={i} className={`space-y-1 ${isDraft ? 'opacity-50' : ''}`}>
              <input type="text" value={row.name} placeholder="Omschrijving (optioneel)"
                onChange={e => handleChange(i, 'name', e.target.value)}
                className="input-field text-sm" />
              <div className="flex gap-1.5 items-center">
                <div className="flex-[2] relative flex items-center">
                  <span className="absolute left-3 text-body text-sm">€</span>
                  <input type="number" value={row.amount} step={500}
                    placeholder="Bedrag (− = afschrijving)"
                    onChange={e => handleChange(i, 'amount', e.target.value)}
                    className={`input-field pl-7 text-sm ${isExpense ? 'text-signal' : (!isDraft && row.amount ? 'text-ink' : '')}`} />
                </div>
                <div className="w-20 flex-shrink-0">
                  <input type="number" value={row.year} min={currentYear - 10} max={currentYear + 60}
                    step={1} placeholder="Jaar"
                    onChange={e => handleChange(i, 'year', e.target.value)}
                    className="input-field text-center text-sm" />
                </div>
                {!isDraft
                  ? <button onClick={() => handleDelete(i)} className="flex-shrink-0 p-1.5 text-body hover:text-signal hover:bg-canvas rounded-[3px] transition-colors"><X size={13} /></button>
                  : <div className="w-7 flex-shrink-0" />}
              </div>
            </div>
          )
        })}
      </div>

      {(totaalBij > 0 || totaalAf > 0) && (
        <div className="space-y-0.5 pt-1">
          {totaalBij > 0 && <p className="text-xs text-ink font-medium">+ €{totaalBij.toLocaleString('nl-NL')} bij</p>}
          {totaalAf > 0 && <p className="text-xs text-signal font-medium">− €{totaalAf.toLocaleString('nl-NL')} af</p>}
        </div>
      )}

      {rows.length < MAX_ROWS && (
        <button onClick={handleAddRow}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-data-700 hover:text-ink border border-dashed border-line hover:border-ink rounded-[3px] transition-colors">
          + Regel toevoegen
        </button>
      )}
    </Section>
  )
}

function EventsTab({ inputs, onChange }: Props) {
  return (
    <div className="space-y-5 pb-4">
      <EenmaligeBedragenSection inputs={inputs} onChange={onChange} />
    </div>
  )
}

// ---- Main InputPanel with tabs ----

type PanelTab = 'parameters' | 'events'

export function InputPanel({ inputs, onChange }: Props) {
  const [tab, setTab] = useState<PanelTab>('parameters')

  const eventCount = (inputs.lifeEvents?.length ?? 0) + (inputs.stortingen?.length ?? 0)

  return (
    <div>
      {/* Tab switcher — onderlijn-tabs, geen pill-groep in een grijze track */}
      <div className="flex mb-4 border-b border-line-soft">
        {([
          { id: 'parameters', label: 'Uitgangspunten' },
          { id: 'events', label: `Eenmalige bedragen${eventCount > 0 ? ` (${eventCount})` : ''}` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-ink text-ink'
                : 'border-transparent text-body hover:text-ink'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'parameters' && <ParametersTab inputs={inputs} onChange={onChange} />}
      {tab === 'events'     && <EventsTab     inputs={inputs} onChange={onChange} />}
    </div>
  )
}
