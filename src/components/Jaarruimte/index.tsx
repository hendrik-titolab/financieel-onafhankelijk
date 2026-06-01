import { useState, useEffect } from 'react'
import { Trash2, Plus, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react'
import type { JaarruimteInputs, JaarruimteResult, SavedJaarruimte, ReserveringsruimteRij, PensioenType } from '../../types'
import { calculateJaarruimte, getAvailableYears, getJaarruimteParamsNote, isPreWtp, berekenJaarruimteEenvoudig } from '../../utils/jaarruimte'

const STORAGE_KEY = 'jaarruimte_berekeningen'
const MAX_RESERVERING_RIJEN = 10

const DEFAULT_INPUTS: JaarruimteInputs = {
  year: 2025,
  income: 75000,
  pensioenType: 'geen',
  factorA: 0,
  werkgeverspremie: 0,
  alIngelegd: 0,
  reserveringsruimteRijen: [],
  clientName: '',
  adviseurNaam: '',
  notities: '',
}

function eur(v: number): string {
  return `€ ${Math.round(v).toLocaleString('nl-NL')}`
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 bg-primary-50 border border-primary-100 rounded-lg">
      <Info size={14} className="text-primary-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-primary-700 leading-relaxed">{children}</p>
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 leading-relaxed">{children}</p>
    </div>
  )
}

function ResultRow({ label, value, highlight, sub }: {
  label: string; value: string; highlight?: boolean; sub?: string
}) {
  return (
    <div className={`flex justify-between items-center py-2.5 px-3 rounded-lg ${highlight ? 'bg-primary-50' : 'bg-slate-50'}`}>
      <div>
        <span className={`text-sm ${highlight ? 'font-semibold text-primary-700' : 'text-slate-600'}`}>{label}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`font-bold ${highlight ? 'text-primary-600 text-lg' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

// Tracking rows: beschikbaar / al ingelegd / nog te doen
function TrackingBar({ alIngelegd, totaalBeschikbaar }: { alIngelegd: number; totaalBeschikbaar: number }) {
  if (totaalBeschikbaar <= 0) return null
  const pct = Math.min(100, Math.round((alIngelegd / totaalBeschikbaar) * 100))
  const isOver = alIngelegd > totaalBeschikbaar
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Al ingelegd: {eur(alIngelegd)}</span>
        <span>Ruimte: {eur(totaalBeschikbaar)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-red-400' : pct > 80 ? 'bg-emerald-400' : 'bg-primary-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs font-medium ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
        {isOver
          ? `⚠ €${(alIngelegd - totaalBeschikbaar).toLocaleString('nl-NL')} boven de ruimte`
          : `Nog ${eur(Math.max(0, totaalBeschikbaar - alIngelegd))} beschikbaar (${100 - pct}%)`}
      </p>
    </div>
  )
}

interface SavedCardProps {
  item: SavedJaarruimte
  onDelete: (id: string) => void
  onLoad: (item: SavedJaarruimte) => void
}

function SavedCard({ item, onDelete, onLoad }: SavedCardProps) {
  const [expanded, setExpanded] = useState(false)
  const r = item.result
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div>
          <p className="font-medium text-slate-800 text-sm">{item.clientName}</p>
          <p className="text-xs text-slate-400">{item.date} · Jaarruimte {item.year}: {eur(r.jaarruimte)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            Nog {eur(r.nogTeDoen)}
          </span>
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-400">Inkomen:</span> <span className="font-medium">{eur(item.inputs.income)}</span></div>
            <div><span className="text-slate-400">Factor A:</span> <span className="font-medium">{eur(item.inputs.factorA)}</span></div>
            <div><span className="text-slate-400">Jaarruimte:</span> <span className="font-medium">{eur(r.jaarruimte)}</span></div>
            <div><span className="text-slate-400">Reserveringsruimte:</span> <span className="font-medium">{eur(r.beschikbareReserveringsruimte)}</span></div>
            <div><span className="text-slate-400">Al ingelegd:</span> <span className="font-medium">{eur(r.alIngelegd)}</span></div>
            <div><span className="text-slate-400">Belastingvoordeel:</span> <span className="font-medium text-emerald-600">{eur(r.belastingVoordeel)}</span></div>
          </div>
          {item.notities && (
            <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">{item.notities}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onLoad(item)} className="btn-secondary text-xs py-1">Laden</button>
            <button onClick={() => onDelete(item.id)} className="flex items-center gap-1 px-3 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={12} /> Verwijderen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Reserveringsruimte: twee modi ----
// Modus "direct": gebruiker weet de onbenutte bedragen al en vult ze direct in.
// Modus "berekenen": gebruiker vult per jaar de jaarruimte én wat er ingelegd is in —
//   het onbenutte bedrag wordt automatisch berekend.

type Reserveringsmodus = 'direct' | 'berekenen'

interface ReserveringProps {
  rijen: ReserveringsruimteRij[]
  onChange: (rijen: ReserveringsruimteRij[]) => void
  baseYear: number
}

// Modus 1: directe invoer van onbenutte bedragen per jaar
function ReserveringsruimteDirect({ rijen, onChange, baseYear }: ReserveringProps) {
  const [rows, setRows] = useState<{ jaar: string; bedrag: string }[]>(() => {
    const saved = rijen.map(r => ({ jaar: String(r.jaar), bedrag: String(r.onbenutBedrag) }))
    return saved.length > 0 ? [...saved, { jaar: String(baseYear - saved.length - 1), bedrag: '' }]
      : [{ jaar: String(baseYear - 1), bedrag: '' }]
  })

  useEffect(() => {
    const valid = rows
      .filter(r => r.jaar && r.bedrag && !isNaN(Number(r.jaar)) && !isNaN(Number(r.bedrag)) && Number(r.bedrag) > 0)
      .map(r => ({ jaar: Number(r.jaar), onbenutBedrag: Number(r.bedrag) }))
    onChange(valid)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const handleChange = (index: number, field: 'jaar' | 'bedrag', value: string) => {
    const newRows = rows.map((r, i) => i === index ? { ...r, [field]: value } : r)
    const updated = newRows[index]
    const isLast = index === newRows.length - 1
    const isFilled = updated.bedrag && Number(updated.bedrag) > 0
    if (isLast && isFilled && newRows.length < MAX_RESERVERING_RIJEN) {
      newRows.push({ jaar: String(Number(updated.jaar) - 1), bedrag: '' })
    }
    setRows(newRows)
  }

  const handleDelete = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    if (newRows.length === 0 || newRows[newRows.length - 1].bedrag !== '')
      newRows.push({ jaar: String(baseYear - newRows.length - 1), bedrag: '' })
    setRows(newRows)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 leading-relaxed">
        Vul per jaar het bedrag in dat je <em>niet</em> hebt ingelegd — te vinden in eerder gemaakte jaarruimteberekeningen of belastingaangiften. Vul een rij in, de volgende verschijnt vanzelf.
      </p>
      {/* Column headers */}
      <div className="flex gap-1.5 text-xs text-slate-400 font-medium px-0.5">
        <span className="flex-1">Jaar</span>
        <span className="flex-[2] pl-1">Onbenut bedrag</span>
        <span className="w-7" />
      </div>
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1
        const isDraft = isLast && (!row.bedrag || Number(row.bedrag) === 0)
        return (
          <div key={i} className={`flex gap-1.5 items-center ${isDraft ? 'opacity-50' : ''}`}>
            <div className="flex-1">
              <input type="number" value={row.jaar} min={baseYear - 11} max={baseYear - 1} step={1}
                placeholder="Jaar" onChange={e => handleChange(i, 'jaar', e.target.value)}
                className="input-field text-center text-sm" />
            </div>
            <div className="flex-[2] relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm">€</span>
              <input type="number" value={row.bedrag} min={0} max={200000} step={100}
                placeholder="Bijv. 3.000" onChange={e => handleChange(i, 'bedrag', e.target.value)}
                className="input-field pl-7 text-sm" />
            </div>
            {!isDraft
              ? <button onClick={() => handleDelete(i)} className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={13} /></button>
              : <div className="w-7 flex-shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

// Modus 2: bereken jaarruimte per jaar vanuit inkomen + pensioentype + factor A,
// trek er het ingelegde bedrag van af → onbenut wordt automatisch berekend.
// UI: uitklapbare kaartjes per jaar (accordion), één per vorig belastingjaar.
function ReserveringsruimteBerekenen({ onChange, baseYear }: ReserveringProps) {
  type JaarKaart = {
    jaar: number
    inkomen: string
    pensioenType: PensioenType
    factorA: string
    werkgeverspremie: string
    ingelegd: string
    open: boolean
  }

  const [kaarten, setKaarten] = useState<JaarKaart[]>([
    { jaar: baseYear - 1, inkomen: '', pensioenType: 'geen', factorA: '', werkgeverspremie: '', ingelegd: '', open: true },
  ])

  // Bereken jaarruimte en onbenut voor een kaart
  const bereken = (k: JaarKaart) => {
    const ink = Number(k.inkomen)
    if (!k.inkomen || isNaN(ink)) return { jaarruimte: null, onbenut: null }
    const jr = berekenJaarruimteEenvoudig(k.jaar, ink, k.pensioenType, Number(k.factorA) || 0, Number(k.werkgeverspremie) || 0)
    const ing = Number(k.ingelegd) || 0
    return { jaarruimte: jr, onbenut: Math.max(0, jr - ing) }
  }

  // Geef geldige onbenutte bedragen door aan parent
  useEffect(() => {
    const valid: ReserveringsruimteRij[] = kaarten
      .map(k => ({ jaar: k.jaar, onbenutBedrag: bereken(k).onbenut ?? 0 }))
      .filter(r => r.onbenutBedrag > 0)
    onChange(valid)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kaarten])

  const update = (i: number, patch: Partial<JaarKaart>) =>
    setKaarten(prev => prev.map((k, idx) => idx === i ? { ...k, ...patch } : k))

  const voegJaarToe = () => {
    if (kaarten.length >= MAX_RESERVERING_RIJEN) return
    const vorigeJaar = kaarten[kaarten.length - 1].jaar - 1
    setKaarten(prev => [
      ...prev.map(k => ({ ...k, open: false })),
      { jaar: vorigeJaar, inkomen: '', pensioenType: 'geen', factorA: '', werkgeverspremie: '', ingelegd: '', open: true },
    ])
  }

  const verwijder = (i: number) =>
    setKaarten(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 leading-relaxed">
        Voeg per vorig belastingjaar een kaartje toe. Vul inkomen en pensioensituatie in — de jaarruimte en het onbenutte bedrag worden automatisch berekend.
      </p>

      {kaarten.map((k, i) => {
        const { jaarruimte, onbenut } = bereken(k)
        const heeftResultaat = jaarruimte !== null

        return (
          <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Koptekst — altijd zichtbaar, klikbaar om uit/in te klappen */}
            <button
              onClick={() => update(i, { open: !k.open })}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{k.jaar}</span>
                {heeftResultaat && (
                  <span className="text-xs text-slate-400">
                    Jaarruimte: {eur(jaarruimte!)} · Onbenut:{' '}
                    <span className={onbenut! > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {eur(onbenut!)}
                    </span>
                  </span>
                )}
                {!heeftResultaat && <span className="text-xs text-slate-400 italic">Nog niet ingevuld</span>}
              </div>
              <div className="flex items-center gap-1.5">
                {kaarten.length > 1 && (
                  <span
                    onClick={e => { e.stopPropagation(); verwijder(i) }}
                    className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors"
                    role="button"
                  >
                    <X size={12} />
                  </span>
                )}
                {k.open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </div>
            </button>

            {/* Uitklapbaar inhoud */}
            {k.open && (
              <div className="border-t border-slate-100 px-3 pb-3 pt-2.5 space-y-2.5 bg-slate-50">
                {/* Jaar aanpassen */}
                <div>
                  <label className="label text-xs">Belastingjaar</label>
                  <input type="number" value={k.jaar} min={baseYear - 11} max={baseYear - 1} step={1}
                    onChange={e => update(i, { jaar: parseInt(e.target.value) || k.jaar })}
                    className="input-field text-sm w-24" />
                </div>

                {/* Inkomen */}
                <div>
                  <label className="label text-xs">Bruto jaarinkomen {k.jaar - 1}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 text-sm">€</span>
                    <input type="number" value={k.inkomen} min={0} step={500} placeholder="Bijv. 65.000"
                      onChange={e => update(i, { inkomen: e.target.value })}
                      className="input-field pl-7 text-sm" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Bron: jaaropgave of aangifte {k.jaar - 1}</p>
                </div>

                {/* Pensioentype */}
                <div>
                  <label className="label text-xs">Pensioenregeling in {k.jaar - 1}</label>
                  <div className="flex gap-1">
                    {(['geen', 'db', 'wtp'] as PensioenType[]).map(pt => (
                      <button key={pt} onClick={() => update(i, { pensioenType: pt })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          k.pensioenType === pt
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300'
                        }`}>
                        {pt === 'geen' ? 'Geen' : pt === 'db' ? 'DB' : 'Wtp'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Factor A (alleen bij DB) */}
                {k.pensioenType === 'db' && (
                  <div>
                    <label className="label text-xs">Factor A {k.jaar - 1} (van UPO)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 text-sm">€</span>
                      <input type="number" value={k.factorA} min={0} step={50} placeholder="0"
                        onChange={e => update(i, { factorA: e.target.value })}
                        className="input-field pl-7 text-sm" />
                    </div>
                  </div>
                )}

                {/* Werkgeverspremie (alleen bij Wtp) */}
                {k.pensioenType === 'wtp' && (
                  <div>
                    <label className="label text-xs">Werkgeverspremie {k.jaar - 1}</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 text-sm">€</span>
                      <input type="number" value={k.werkgeverspremie} min={0} step={100} placeholder="0"
                        onChange={e => update(i, { werkgeverspremie: e.target.value })}
                        className="input-field pl-7 text-sm" />
                    </div>
                  </div>
                )}

                {/* Berekende jaarruimte — read-only */}
                {heeftResultaat && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                    <span className="text-xs text-slate-500">Jaarruimte {k.jaar}</span>
                    <span className="text-sm font-semibold text-primary-600">{eur(jaarruimte!)}</span>
                  </div>
                )}

                {/* Ingelegd */}
                <div>
                  <label className="label text-xs">Ingelegd in {k.jaar} (lijfrente)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 text-sm">€</span>
                    <input type="number" value={k.ingelegd} min={0} step={100} placeholder="0"
                      onChange={e => update(i, { ingelegd: e.target.value })}
                      className="input-field pl-7 text-sm" />
                  </div>
                </div>

                {/* Onbenut resultaat */}
                {heeftResultaat && (
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    onbenut! > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-xs text-slate-500">Onbenut {k.jaar}</span>
                    <span className={`text-sm font-bold ${onbenut! > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {eur(onbenut!)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Voeg jaar toe knop */}
      {kaarten.length < MAX_RESERVERING_RIJEN && (
        <button onClick={voegJaarToe}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-primary-600 hover:text-primary-700 border border-dashed border-primary-200 hover:border-primary-400 rounded-xl transition-colors">
          <Plus size={12} /> Voeg vorig jaar toe
        </button>
      )}
    </div>
  )
}

// Wrapper met modus-keuze bovenaan
function ReserveringsruimteSectie({ rijen, onChange, baseYear }: ReserveringProps) {
  const [modus, setModus] = useState<Reserveringsmodus>(
    rijen.length > 0 ? 'direct' : 'direct'
  )

  return (
    <div className="space-y-3">
      {/* Modus-keuze */}
      <div className="grid grid-cols-2 gap-1.5">
        {([
          { value: 'direct',    label: 'Ik weet de bedragen', sub: 'Vul onbenut bedrag per jaar in' },
          { value: 'berekenen', label: 'Bereken voor mij',    sub: 'Ik vul jaarruimte + ingelegd in' },
        ] as { value: Reserveringsmodus; label: string; sub: string }[]).map(opt => (
          <button key={opt.value} onClick={() => setModus(opt.value)}
            className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-colors ${
              modus === opt.value
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-slate-200 text-slate-500 hover:border-primary-200'
            }`}>
            <span className="text-xs font-semibold">{opt.label}</span>
            <span className="text-xs opacity-70 mt-0.5">{opt.sub}</span>
          </button>
        ))}
      </div>

      {/* Inhoud per modus */}
      {modus === 'direct'
        ? <ReserveringsruimteDirect  rijen={rijen} onChange={onChange} baseYear={baseYear} />
        : <ReserveringsruimteBerekenen rijen={rijen} onChange={onChange} baseYear={baseYear} />}
    </div>
  )
}

// X icon inline (avoid extra import)
function X({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

export function JaarruimteTab() {
  const [inputs, setInputs] = useState<JaarruimteInputs>(DEFAULT_INPUTS)
  const [saved, setSaved] = useState<SavedJaarruimte[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: SavedJaarruimte[] = JSON.parse(raw)
        // Migrate old format: ensure new fields exist
        const migrated = parsed.map(s => ({
          ...s,
          inputs: {
            ...s.inputs,
            pensioenType: (s.inputs as JaarruimteInputs).pensioenType ?? ('db' as PensioenType),
            werkgeverspremie: (s.inputs as JaarruimteInputs).werkgeverspremie ?? 0,
            alIngelegd: s.inputs.alIngelegd ?? 0,
            reserveringsruimteRijen: s.inputs.reserveringsruimteRijen ?? [],
          },
          result: {
            ...s.result,
            beschikbareReserveringsruimte: (s.result as any).beschikbareReserveringsruimte ?? (s.result as any).reserveruimteUsed ?? 0,
            totaalBeschikbaar: (s.result as any).totaalBeschikbaar ?? (s.result as any).effectiefMaximum ?? s.result.jaarruimte,
            alIngelegd: (s.result as any).alIngelegd ?? 0,
            nogTeDoen: (s.result as any).nogTeDoen ?? (s.result as any).effectiefMaximum ?? s.result.jaarruimte,
          },
        }))
        setSaved(migrated)
      }
    } catch { /* ignore */ }
  }, [])

  const result: JaarruimteResult = calculateJaarruimte(inputs)

  const handleSave = () => {
    if (!inputs.clientName.trim()) {
      alert('Vul een klantnaam in om de berekening op te slaan.')
      return
    }
    const entry: SavedJaarruimte = {
      id: crypto.randomUUID(),
      clientName: inputs.clientName,
      adviseurNaam: inputs.adviseurNaam,
      date: new Date().toLocaleDateString('nl-NL'),
      year: inputs.year,
      inputs: { ...inputs },
      result: { ...result },
      notities: inputs.notities,
    }
    const updated = [entry, ...saved]
    setSaved(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleDelete = (id: string) => {
    const updated = saved.filter(s => s.id !== id)
    setSaved(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleLoad = (item: SavedJaarruimte) => {
    setInputs({ ...item.inputs })
  }

  const set = <K extends keyof JaarruimteInputs>(k: K, v: JaarruimteInputs[K]) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  const is2026 = inputs.year >= 2026

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
      {/* Left: Form — full width on mobile, fixed sidebar on desktop */}
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Jaarruimteberekening</h2>

          <div>
            <label className="label">Belastingjaar</label>
            <select
              value={inputs.year}
              onChange={e => set('year', parseInt(e.target.value))}
              className="input-field"
            >
              {getAvailableYears().map(y => (
                <option key={y} value={y}>{y}{y >= 2026 ? ' (geschat)' : ''}</option>
              ))}
            </select>
            {is2026 && (
              <p className="text-xs text-amber-600 mt-1">
                2026 parameters zijn geschat. Controleer belastingdienst.nl.
              </p>
            )}
          </div>

          <div>
            <label className="label">Klantnaam</label>
            <input
              type="text"
              value={inputs.clientName}
              onChange={e => set('clientName', e.target.value)}
              placeholder="Naam klant"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Adviseur</label>
            <input
              type="text"
              value={inputs.adviseurNaam}
              onChange={e => set('adviseurNaam', e.target.value)}
              placeholder="Naam adviseur"
              className="input-field"
            />
          </div>

          {/* Inkomen — label toont het juiste bronjaar */}
          <div className="border-t border-slate-100 pt-3">
            <label className="label">
              Bruto jaarinkomen {inputs.year - 1}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm">€</span>
              <input
                type="number"
                value={inputs.income}
                min={0} step={500}
                onChange={e => set('income', parseFloat(e.target.value) || 0)}
                className="input-field pl-7"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bron: jaaropgave werkgever {inputs.year - 1} of aangifte inkomstenbelasting {inputs.year - 1} (box 1, loon)
            </p>
          </div>

          {/* Pensioentype — bepaalt welk veld zichtbaar is */}
          <div>
            <label className="label">Pensioenregeling in {inputs.year - 1}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { value: 'geen', label: 'Geen' },
                { value: 'db',   label: 'DB-pensioen' },
                { value: 'wtp',  label: 'Wtp-pensioen' },
              ] as { value: PensioenType; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('pensioenType', opt.value)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    inputs.pensioenType === opt.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {inputs.pensioenType === 'geen' && (
              <p className="text-xs text-slate-400 mt-1.5">Geen werkgeverspensioen (bijv. ZZP) — aftrek is €0.</p>
            )}
            {inputs.pensioenType === 'db' && (
              <p className="text-xs text-slate-400 mt-1.5">
                Traditioneel pensioen (eindloon / middelloon / CDC).
                {isPreWtp(inputs.year) ? ' Formule: 13,3% × grondslag − 7,44 × factor A.' : ' Formule: 30% × grondslag − 6,27 × factor A.'}
              </p>
            )}
            {inputs.pensioenType === 'wtp' && (
              <p className="text-xs text-slate-400 mt-1.5">Wtp beschikbare-premieregeling. Formule: 30% × grondslag − werkgeverspremie.</p>
            )}
          </div>

          {/* Factor A — alleen zichtbaar bij DB */}
          {inputs.pensioenType === 'db' && (
            <div>
              <label className="label">Factor A (pensioenaangroei {inputs.year - 1})</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-sm">€</span>
                <input
                  type="number"
                  value={inputs.factorA}
                  min={0} step={100}
                  onChange={e => set('factorA', parseFloat(e.target.value) || 0)}
                  className="input-field pl-7"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bron: UPO {inputs.year - 1} (jaarlijks pensioenoverzicht), rubriek "pensioenaangroei" of "toename pensioenaanspraak" — in €/jaar.
              </p>
            </div>
          )}

          {/* Werkgeverspremie — alleen zichtbaar bij Wtp */}
          {inputs.pensioenType === 'wtp' && (
            <div>
              <label className="label">Werkgeverspremie ingelegde {inputs.year - 1}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-sm">€</span>
                <input
                  type="number"
                  value={inputs.werkgeverspremie}
                  min={0} step={100}
                  onChange={e => set('werkgeverspremie', parseFloat(e.target.value) || 0)}
                  className="input-field pl-7"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bron: jaaroverzicht pensioenuitvoerder {inputs.year - 1}, totale premie ingelegde door werkgever.
              </p>
            </div>
          )}

          {/* Al ingelegd dit jaar */}
          <div className="border-t border-slate-100 pt-3">
            <label className="label">Al ingelegd dit jaar (lijfrente)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm">€</span>
              <input
                type="number"
                value={inputs.alIngelegd}
                min={0} step={100}
                onChange={e => set('alIngelegd', parseFloat(e.target.value) || 0)}
                className="input-field pl-7"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bedrag dat je klant dit jaar al heeft ingelegd bij de verzekeraar.
            </p>
          </div>

          {/* Reserveringsruimte — met modus-keuze */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <label className="label">Reserveringsruimte (onbenutte jaarruimte voorgaande jaren)</label>
            <ReserveringsruimteSectie
              rijen={inputs.reserveringsruimteRijen}
              onChange={rijen => set('reserveringsruimteRijen', rijen)}
              baseYear={inputs.year}
            />
          </div>

          <div>
            <label className="label">Notities</label>
            <textarea
              value={inputs.notities}
              onChange={e => set('notities', e.target.value)}
              rows={3}
              placeholder="Bijzonderheden, opmerkingen…"
              className="input-field resize-none"
            />
          </div>

          <button onClick={handleSave} className="btn-primary w-full justify-center">
            <Plus size={14} />
            Berekening opslaan
          </button>
        </div>
      </div>

      {/* Right: Results + Saved */}
      <div className="flex-1 space-y-5">
        {/* Results */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Resultaat {inputs.year}</h3>

          <ResultRow
            label="Jaarruimte"
            value={eur(result.jaarruimte)}
            highlight
            sub="30% × (inkomen − franchise) − 6,27 × factor A"
          />
          {result.beschikbareReserveringsruimte > 0 && (
            <ResultRow
              label="Reserveringsruimte"
              value={eur(result.beschikbareReserveringsruimte)}
              sub={`${inputs.reserveringsruimteRijen.length} jaar(en) onbenutte ruimte`}
            />
          )}
          <ResultRow
            label="Totaal beschikbaar"
            value={eur(result.totaalBeschikbaar)}
            highlight
          />

          <div className="border-t border-slate-100 pt-2 space-y-2">
            <TrackingBar alIngelegd={result.alIngelegd} totaalBeschikbaar={result.totaalBeschikbaar} />
            <ResultRow
              label="Nog in te leggen"
              value={eur(result.nogTeDoen)}
              sub={result.nogTeDoen > 0 ? `Belastingvoordeel: ${eur(result.belastingVoordeel)} (${(result.belastingTarief * 100).toFixed(2)}%)` : 'Volledig benut'}
            />
          </div>

          <InfoBox>
            {getJaarruimteParamsNote(inputs.year)}
          </InfoBox>

          {is2026 && (
            <WarningBox>
              De 2026-parameters zijn schattingen op basis van indexatie. Controleer de definitieve bedragen op belastingdienst.nl voordat je de klant adviseert.
            </WarningBox>
          )}
        </div>

        {/* Saved calculations */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Opgeslagen berekeningen
            <span className="ml-2 text-xs font-normal text-slate-400">({saved.length})</span>
          </h3>
          {saved.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Nog geen opgeslagen berekeningen</p>
              <p className="text-xs mt-1">Vul het formulier in en klik op "Berekening opslaan"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {saved.map(item => (
                <SavedCard key={item.id} item={item} onDelete={handleDelete} onLoad={handleLoad} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
