import { useMemo, useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Info, TrendingDown, TrendingUp } from 'lucide-react'

// ---- Presentatie-helpers (NL-notatie) ----

const eur = (n: number, dec = 0): string =>
  '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const pct = (n: number, dec = 1): string =>
  n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%'

/** Compacte euro-notatie voor de grafiek-as (€…k / €…M). */
function eurKort(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `€${(v / 1_000_000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}M`
  if (Math.abs(v) >= 1_000) return `€${Math.round(v / 1_000)}k`
  return `€${Math.round(v)}`
}

// ---- Rekenlogica (jaarlijkse samengestelde groei) ----

interface Inputs {
  startbedrag: number
  inflatie: number // % per jaar
  spaarrente: number // % per jaar
  looptijd: number // jaren
}

interface JaarRij {
  jaar: number
  nominaal: number
  koopkracht: number
  verlies: number // nominaal − koopkracht (het deel dat inflatie "opeet")
}

interface Uitkomst {
  jaren: JaarRij[]
  nominaalEind: number
  koopkrachtEind: number
  verliesEuro: number // t.o.v. het startbedrag van nu
  verliesPct: number
  reeelRendement: number // % per jaar
}

function bereken({ startbedrag, inflatie, spaarrente, looptijd }: Inputs): Uitkomst {
  // Validatie: geen negatieve bedragen, rentes binnen 0–20%, looptijd 1–30.
  const s = Math.max(0, startbedrag || 0)
  const i = Math.min(20, Math.max(0, inflatie || 0)) / 100
  const r = Math.min(20, Math.max(0, spaarrente || 0)) / 100
  const jaar = Math.min(30, Math.max(1, Math.round(looptijd || 1)))

  const jaren: JaarRij[] = []
  for (let t = 0; t <= jaar; t++) {
    const nominaal = s * Math.pow(1 + r, t)
    const koopkracht = nominaal / Math.pow(1 + i, t)
    jaren.push({ jaar: t, nominaal, koopkracht, verlies: Math.max(0, nominaal - koopkracht) })
  }

  const nominaalEind = jaren[jaren.length - 1].nominaal
  const koopkrachtEind = jaren[jaren.length - 1].koopkracht
  const verliesEuro = s - koopkrachtEind // positief = koopkracht gedaald t.o.v. nu
  const verliesPct = s > 0 ? (verliesEuro / s) * 100 : 0
  const reeelRendement = ((1 + r) / (1 + i) - 1) * 100

  return { jaren, nominaalEind, koopkrachtEind, verliesEuro, verliesPct, reeelRendement }
}

// ---- Presentatie-subcomponenten ----

function Field({ label, htmlFor, help, children }: {
  label: string; htmlFor: string; help?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
    </div>
  )
}

function ResultRow({ label, value, highlight, tone }: {
  label: string; value: string; highlight?: boolean; tone?: 'negatief' | 'positief'
}) {
  const valueColor = tone === 'negatief'
    ? 'text-red-600'
    : tone === 'positief'
      ? 'text-emerald-600'
      : highlight ? 'text-primary-600' : 'text-slate-800'
  return (
    <div className={`flex justify-between items-center py-2.5 px-3 rounded-lg ${highlight ? 'bg-primary-50' : 'bg-slate-50'}`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-primary-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`font-bold ${highlight ? 'text-lg' : ''} ${valueColor}`}>{value}</span>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: number
}) => {
  if (!active || !payload?.length) return null
  const nominaal = payload.find(p => p.dataKey === 'nominaal')?.value ?? 0
  const koopkracht = payload.find(p => p.dataKey === 'koopkracht')?.value ?? 0
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">Na {label} jaar</p>
      <div className="flex items-center justify-between gap-4 py-0.5">
        <span className="font-medium text-primary-600">Nominaal saldo</span>
        <span className="text-slate-700 font-mono">{eur(nominaal)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 py-0.5">
        <span className="font-medium text-amber-600">Koopkracht (nu)</span>
        <span className="text-slate-700 font-mono">{eur(koopkracht)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 py-0.5 border-t border-slate-100 mt-1 pt-1">
        <span className="font-medium text-red-500">Koopkrachtverlies</span>
        <span className="text-slate-700 font-mono">{eur(Math.max(0, nominaal - koopkracht))}</span>
      </div>
    </div>
  )
}

// ---- Hoofdcomponent ----

export function InflatieCalculator() {
  const [startbedrag, setStartbedrag] = useState(10000)
  const [inflatie, setInflatie] = useState(3.0)
  const [spaarrente, setSpaarrente] = useState(1.5)
  const [looptijd, setLooptijd] = useState(20)

  const r = useMemo(
    () => bereken({ startbedrag, inflatie, spaarrente, looptijd }),
    [startbedrag, inflatie, spaarrente, looptijd],
  )

  const daalt = r.verliesEuro > 0.5 // koopkracht daalt t.o.v. nu
  const stijgt = r.verliesEuro < -0.5

  return (
    <div className="space-y-5">
      {/* Invoer */}
      <div className="card space-y-4">
        <Field
          label="Startbedrag spaargeld"
          htmlFor="startbedrag"
          help="Het bedrag dat je nu op je spaarrekening hebt staan."
        >
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 text-sm">€</span>
            <input
              id="startbedrag"
              type="number"
              min={0}
              step={500}
              value={startbedrag}
              onChange={e => setStartbedrag(Math.max(0, parseFloat(e.target.value) || 0))}
              onFocus={e => e.target.select()}
              className="input-field pl-7"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Verwachte inflatie"
            htmlFor="inflatie"
            help="Gemiddelde prijsstijging per jaar. Historisch vaak rond 2–3%."
          >
            <div className="relative flex items-center">
              <input
                id="inflatie"
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={inflatie}
                onChange={e => setInflatie(Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)))}
                onFocus={e => e.target.select()}
                className="input-field pr-8"
              />
              <span className="absolute right-3 text-slate-400 text-sm">%</span>
            </div>
          </Field>

          <Field
            label="Spaarrente"
            htmlFor="spaarrente"
            help="De rente die je bank je per jaar geeft over je spaargeld."
          >
            <div className="relative flex items-center">
              <input
                id="spaarrente"
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={spaarrente}
                onChange={e => setSpaarrente(Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)))}
                onFocus={e => e.target.select()}
                className="input-field pr-8"
              />
              <span className="absolute right-3 text-slate-400 text-sm">%</span>
            </div>
          </Field>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="looptijd" className="label mb-0">Looptijd</label>
            <span className="text-sm font-semibold text-primary-600">{looptijd} jaar</span>
          </div>
          <input
            id="looptijd"
            type="range"
            min={1}
            max={30}
            value={looptijd}
            aria-label="Looptijd in jaren"
            onChange={e => setLooptijd(parseInt(e.target.value))}
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 jaar</span><span>30 jaar</span>
          </div>
        </div>
      </div>

      {/* Kop-uitkomst */}
      <div className={`card border-l-4 ${daalt ? 'border-l-red-400' : stijgt ? 'border-l-emerald-400' : 'border-l-slate-300'}`}>
        <div className="flex items-start gap-3">
          {daalt
            ? <TrendingDown className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            : <TrendingUp className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />}
          <p className="text-xl sm:text-2xl font-semibold text-slate-900 leading-snug">
            {daalt ? (
              <>Over {looptijd} jaar is je {eur(startbedrag)} in koopkracht nog maar{' '}
                <span className="text-red-600">{eur(r.koopkrachtEind)}</span> waard, een verlies van{' '}
                <span className="text-red-600">{eur(r.verliesEuro)} ({pct(r.verliesPct)})</span>.</>
            ) : stijgt ? (
              <>Over {looptijd} jaar is je {eur(startbedrag)} in koopkracht{' '}
                <span className="text-emerald-600">{eur(r.koopkrachtEind)}</span> waard, een stijging van{' '}
                <span className="text-emerald-600">{eur(-r.verliesEuro)} ({pct(-r.verliesPct)})</span>.</>
            ) : (
              <>Over {looptijd} jaar houdt je {eur(startbedrag)} vrijwel exact dezelfde koopkracht:{' '}
                <span className="text-slate-700">{eur(r.koopkrachtEind)}</span>.</>
            )}
          </p>
        </div>
      </div>

      {/* Grafiek */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Nominaal saldo vs. koopkracht</h2>
        <p className="text-xs text-slate-400 mb-4">
          Het rode vlak tussen de lijnen is het deel van je saldo dat door inflatie aan waarde inboet.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={r.jaren} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradKoopkracht" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="jaar"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Jaren', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              tickFormatter={eurKort}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Onderste band = behouden koopkracht (amber). */}
            <Area
              dataKey="koopkracht"
              stackId="saldo"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradKoopkracht)"
              name="Koopkracht (euro's van nu)"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b' }}
            />
            {/* Bovenste band = koopkrachtverlies, stapelt tot het nominale saldo. */}
            <Area
              dataKey="verlies"
              stackId="saldo"
              stroke="none"
              fill="#fca5a5"
              fillOpacity={0.55}
              name="Koopkrachtverlies"
              dot={false}
            />
            {/* Lijn op het nominale saldo (bovenrand van de stapel). */}
            <Line
              dataKey="nominaal"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              name="Nominaal saldo"
              activeDot={{ r: 4, fill: '#2563eb' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
              formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Kerncijfers */}
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Kerncijfers</h2>
        <ResultRow label="Startbedrag (nu)" value={eur(startbedrag)} />
        <ResultRow label={`Nominaal saldo na ${looptijd} jaar`} value={eur(r.nominaalEind)} />
        <ResultRow
          label="Koopkracht in euro's van nu"
          value={eur(r.koopkrachtEind)}
          highlight
        />
        <ResultRow
          label="Koopkrachtverlies"
          value={`${eur(Math.abs(r.verliesEuro))} (${pct(Math.abs(r.verliesPct))})`}
          tone={daalt ? 'negatief' : stijgt ? 'positief' : undefined}
        />
        <ResultRow
          label="Netto reëel rendement"
          value={`${r.reeelRendement >= 0 ? '+' : '−'}${pct(Math.abs(r.reeelRendement))} p.j.`}
          tone={r.reeelRendement < 0 ? 'negatief' : r.reeelRendement > 0 ? 'positief' : undefined}
        />
        <p className="text-xs text-slate-400 pt-1">
          Netto reëel rendement = (1 + spaarrente) ÷ (1 + inflatie) − 1. Zolang je spaarrente lager is
          dan de inflatie, daalt je koopkracht ondanks een groeiend saldo.
        </p>
      </div>

      {/* Verplichte box 3-noot */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 leading-relaxed">
          Deze tool houdt bewust <strong>géén</strong> rekening met de vermogensrendementsheffing
          (box 3). Dat zou de berekening te complex maken vanwege verschillende vermogensmixen,
          vrijstellingen en jaarlijkse wijzigingen. De uitkomst is een indicatie, geen persoonlijk advies.
        </p>
      </div>
    </div>
  )
}
