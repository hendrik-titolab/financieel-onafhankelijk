import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { PensionInputs, IncomeType, ContributionFrequency, AowType, LifeEvent, Storting } from '../../types'
import { AOW_NETTO } from '../../utils/pensionCalc'

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
    <div className="inline-flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
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
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pt-1">{title}</h3>
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

function NumberInput({ value, onChange, prefix, suffix, step = 1, min = 0, max }: {
  value: number; onChange: (v: number) => void
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number
}) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-slate-400 text-sm">{prefix}</span>}
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={`input-field ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`} />
      {suffix && <span className="absolute right-3 text-slate-400 text-sm">{suffix}</span>}
    </div>
  )
}

function AgeSliderRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-semibold text-primary-600">{value} jaar</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))} />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

// ---- Parameters tab ----

function ParametersTab({ inputs, onChange }: Props) {
  const fullAow = AOW_NETTO[inputs.aowType]
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

      <div className="border-t border-slate-100" />

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

      <div className="border-t border-slate-100" />

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
          <p className="text-xs text-slate-400">In koopkracht van vandaag — inflatie wordt automatisch verwerkt</p>
        </div>
      </Section>

      <div className="border-t border-slate-100" />

      <Section title="Pensioenuitkeringen">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="label mb-0">AOW-type</label>
            <Toggle value={inputs.aowType} onChange={v => onChange({ aowType: v as AowType })}
              options={[
                { value: 'alleenstaand', label: 'Alleenstaand' },
                { value: 'samenwonend', label: 'Samenwonend' },
              ]} />
          </div>
          <p className="text-xs text-slate-400">
            {inputs.aowType === 'alleenstaand'
              ? 'Volledig AOW alleenstaand: ~€1.550/mnd netto'
              : 'AOW per persoon samenwonend/gehuwd: ~€1.060/mnd netto'}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="label mb-0">AOW-opbouw</label>
            <span className="text-xs font-semibold text-primary-600">{inputs.aowPercentage}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={inputs.aowPercentage}
            onChange={e => onChange({ aowPercentage: parseInt(e.target.value) })} />
          <p className="text-xs text-slate-400">
            ≈ €{Math.round((inputs.aowPercentage / 100) * fullAow).toLocaleString('nl-NL')}/mnd netto
            {inputs.aowPercentage < 100 && ` (${inputs.aowPercentage / 2} opbouwjaren)`}
          </p>
        </div>
        <Field label="AOW ingangsdatum (leeftijd)">
          <NumberInput value={inputs.aowStartAge} onChange={v => onChange({ aowStartAge: v })}
            suffix="jr" step={1} min={60} max={75} />
        </Field>
        <div className="border-t border-slate-100 pt-3">
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
            <p className="text-xs text-slate-400 mt-1">Controleer op de UPO. Default is 67.</p>
          </div>
        </div>
        {inputs.retirementAge < Math.min(inputs.aowStartAge, inputs.employerPensionStartAge) && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 leading-relaxed">
            ⚠ Overbruggingsperiode van {Math.min(inputs.aowStartAge, inputs.employerPensionStartAge) - inputs.retirementAge} jaar — eigen vermogen dekt het volledige inkomen.
          </p>
        )}
      </Section>

      <div className="border-t border-slate-100" />

      <Section title="Rendement & Inflatie">
        <Field label="Rendement vóór pensioendatum">
          <NumberInput value={inputs.returnBeforeRetirement}
            onChange={v => onChange({ returnBeforeRetirement: v })} suffix="%" step={0.5} min={0} max={20} />
        </Field>
        <Field label="Rendement ná pensioendatum">
          <NumberInput value={inputs.returnAfterRetirement}
            onChange={v => onChange({ returnAfterRetirement: v })} suffix="%" step={0.5} min={0} max={15} />
        </Field>
        <Field label="Inflatie">
          <NumberInput value={inputs.inflation}
            onChange={v => onChange({ inflation: v })} suffix="%" step={0.1} min={0} max={10} />
        </Field>
      </Section>

      <div className="border-t border-slate-100" />

      <Section title="Monte Carlo (volatiliteit)">
        <Field label="Volatiliteit vóór pensioendatum">
          <NumberInput value={inputs.volatilityPre}
            onChange={v => onChange({ volatilityPre: v })} suffix="%" step={1} min={0} max={40} />
        </Field>
        <Field label="Volatiliteit ná pensioendatum">
          <NumberInput value={inputs.volatilityPost}
            onChange={v => onChange({ volatilityPost: v })} suffix="%" step={1} min={0} max={30} />
        </Field>
        <p className="text-xs text-slate-400 leading-relaxed">
          Typisch: 15% groeiportefeuille, 8% defensief. 2.000 simulaties.
        </p>
      </Section>
    </div>
  )
}

// ---- Events tab ----

// Progressive row for life events (name + amount + year)
function LifeEventsSection({ inputs, onChange }: Props) {
  const currentYear = new Date().getFullYear()
  type DraftEvent = { name: string; amount: string; year: string }

  const [rows, setRows] = useState<DraftEvent[]>(() => {
    const saved = (inputs.lifeEvents ?? []).map(e => ({
      name: e.name, amount: String(e.amount), year: String(e.year),
    }))
    return [...saved, { name: '', amount: '', year: String(currentYear) }]
  })

  useEffect(() => {
    const valid: LifeEvent[] = rows
      .filter(r => r.amount && r.year && !isNaN(Number(r.amount)) && Number(r.amount) !== 0 && !isNaN(Number(r.year)))
      .map(r => ({ name: r.name.trim() || '—', amount: Number(r.amount), year: Number(r.year) }))
    onChange({ lifeEvents: valid })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const isFilled = (r: DraftEvent) => r.amount !== '' && Number(r.amount) !== 0

  const handleChange = (i: number, field: keyof DraftEvent, value: string) => {
    const newRows = rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    if (i === newRows.length - 1 && isFilled(newRows[i]) && newRows.length < MAX_ROWS)
      newRows.push({ name: '', amount: '', year: String(currentYear) })
    setRows(newRows)
  }

  const handleDelete = (i: number) => {
    const newRows = rows.filter((_, idx) => idx !== i)
    if (newRows.length === 0 || isFilled(newRows[newRows.length - 1]))
      newRows.push({ name: '', amount: '', year: String(currentYear) })
    setRows(newRows)
  }

  const validCount = (inputs.lifeEvents ?? []).length

  return (
    <Section title={`Life events${validCount > 0 ? ` (${validCount})` : ''}`}>
      <p className="text-xs text-slate-400 -mt-1 leading-relaxed">
        Éénmalige financiële gevolgen van een levensgebeurtenis. Positief = inkomst, negatief = uitgave.
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
                  <span className="absolute left-3 text-slate-400 text-sm">€</span>
                  <input type="number" value={row.amount} step={500}
                    placeholder="Bedrag (− = uitgave)"
                    onChange={e => handleChange(i, 'amount', e.target.value)}
                    className={`input-field pl-7 text-sm ${isExpense ? 'text-red-600' : (!isDraft && row.amount ? 'text-emerald-600' : '')}`} />
                </div>
                <div className="flex-1">
                  <input type="number" value={row.year} min={currentYear - 10} max={currentYear + 60}
                    step={1} placeholder="Jaar"
                    onChange={e => handleChange(i, 'year', e.target.value)}
                    className="input-field text-center text-sm" />
                </div>
                {!isDraft
                  ? <button onClick={() => handleDelete(i)} className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={13} /></button>
                  : <div className="w-7 flex-shrink-0" />}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// Progressive rows for stortingen/onttrekkingen (just amount + year, no name)
function StoringenSection({ inputs, onChange }: Props) {
  const currentYear = new Date().getFullYear()
  type DraftStorting = { amount: string; year: string }

  const [rows, setRows] = useState<DraftStorting[]>(() => {
    const saved = (inputs.stortingen ?? []).map(s => ({
      amount: String(s.amount), year: String(s.year),
    }))
    return [...saved, { amount: '', year: String(currentYear) }]
  })

  useEffect(() => {
    const valid: Storting[] = rows
      .filter(r => r.amount && r.year && !isNaN(Number(r.amount)) && Number(r.amount) !== 0 && !isNaN(Number(r.year)))
      .map(r => ({ amount: Number(r.amount), year: Number(r.year) }))
    onChange({ stortingen: valid })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const isFilled = (r: DraftStorting) => r.amount !== '' && Number(r.amount) !== 0

  const handleChange = (i: number, field: keyof DraftStorting, value: string) => {
    const newRows = rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    if (i === newRows.length - 1 && isFilled(newRows[i]) && newRows.length < MAX_ROWS)
      newRows.push({ amount: '', year: String(currentYear) })
    setRows(newRows)
  }

  const handleDelete = (i: number) => {
    const newRows = rows.filter((_, idx) => idx !== i)
    if (newRows.length === 0 || isFilled(newRows[newRows.length - 1]))
      newRows.push({ amount: '', year: String(currentYear) })
    setRows(newRows)
  }

  const all = inputs.stortingen ?? []
  const totaalPos = all.filter(s => s.amount > 0).reduce((s, e) => s + e.amount, 0)
  const totaalNeg = all.filter(s => s.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)

  return (
    <Section title={`Stortingen & onttrekkingen${all.length > 0 ? ` (${all.length})` : ''}`}>
      <p className="text-xs text-slate-400 -mt-1 leading-relaxed">
        Geplande extra inleg (positief) of opname (negatief) uit je portefeuille.
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1
          const isDraft = isLast && !isFilled(row)
          const isWithdrawal = Number(row.amount) < 0
          return (
            <div key={i} className={`flex gap-1.5 items-center ${isDraft ? 'opacity-50' : ''}`}>
              <div className="flex-[2] relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-sm">€</span>
                <input type="number" value={row.amount} step={500}
                  placeholder="Bedrag (− = opname)"
                  onChange={e => handleChange(i, 'amount', e.target.value)}
                  className={`input-field pl-7 text-sm ${isWithdrawal ? 'text-red-600' : (!isDraft && row.amount ? 'text-emerald-600' : '')}`} />
              </div>
              <div className="flex-1">
                <input type="number" value={row.year} min={currentYear - 10} max={currentYear + 60}
                  step={1} placeholder="Jaar"
                  onChange={e => handleChange(i, 'year', e.target.value)}
                  className="input-field text-center text-sm" />
              </div>
              {!isDraft
                ? <button onClick={() => handleDelete(i)} className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={13} /></button>
                : <div className="w-7 flex-shrink-0" />}
            </div>
          )
        })}
      </div>
      {all.length > 0 && (
        <div className="space-y-0.5 pt-1">
          {totaalPos > 0 && <p className="text-xs text-emerald-600 font-medium">+ €{totaalPos.toLocaleString('nl-NL')} extra inleg</p>}
          {totaalNeg > 0 && <p className="text-xs text-red-500 font-medium">− €{totaalNeg.toLocaleString('nl-NL')} opnames</p>}
        </div>
      )}
    </Section>
  )
}

function EventsTab({ inputs, onChange }: Props) {
  return (
    <div className="space-y-5 pb-4">
      <LifeEventsSection inputs={inputs} onChange={onChange} />
      <div className="border-t border-slate-100" />
      <StoringenSection inputs={inputs} onChange={onChange} />
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
      {/* Tab switcher */}
      <div className="flex mb-4 border-b border-slate-100">
        {([
          { id: 'parameters', label: 'Parameters' },
          { id: 'events', label: `Events${eventCount > 0 ? ` (${eventCount})` : ''}` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
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
