import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

// ── Fiscale parameters 2026 (Belastingdienst / Belastingplan 2026) ────────────
// !! Jaarlijks bijwerken in januari zodra de nieuwe parameters bekend zijn !!
const P = {
  jaar: 2026,
  schijven: [
    { tot: 38_883, tarief: 0.3575 },
    { tot: 78_426, tarief: 0.3756 },
    { tot: Infinity, tarief: 0.495 },
  ],
  ahk: { max: 3_115, afbouwVanaf: 29_736, afbouwPct: 0.06398, nihilBij: 78_426 },
  ak: {
    knik1: 11_965, pct1: 0.08324,
    knik2: 25_845, pct2: 0.31009,
    knik3: 45_592, pct3: 0.0195,
    afbouwVanaf: 45_593, afbouwPct: 0.0651,
    max: 5_685,
  },
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

interface SchijfDetail {
  van: number
  tot: number
  tarief: number
  grondslag: number
  bedrag: number
}

interface BerekeningResultaat {
  brutoJaar: number
  belastingBruto: number
  schijfDetail: SchijfDetail[]
  ahk: number
  ak: number
  kortingenBenut: number
  teBetalen: number
  nettoJaar: number
  druk: number
}

// ── Berekeningen ──────────────────────────────────────────────────────────────

function belastingSchijven(bruto: number): { totaal: number; detail: SchijfDetail[] } {
  let rest = bruto, vorigeGrens = 0, totaal = 0
  const detail: SchijfDetail[] = []
  for (const s of P.schijven) {
    const inSchijf = Math.max(0, Math.min(bruto, s.tot) - vorigeGrens)
    const bedrag = inSchijf * s.tarief
    if (inSchijf > 0) detail.push({ van: vorigeGrens, tot: Math.min(bruto, s.tot), tarief: s.tarief, grondslag: inSchijf, bedrag })
    totaal += bedrag
    vorigeGrens = s.tot
    rest -= inSchijf
    if (rest <= 0) break
  }
  return { totaal, detail }
}

function algemeneHeffingskorting(inkomen: number): number {
  const { max, afbouwVanaf, afbouwPct } = P.ahk
  if (inkomen <= afbouwVanaf) return max
  return Math.max(0, max - afbouwPct * (inkomen - afbouwVanaf))
}

function arbeidskorting(inkomen: number): number {
  const a = P.ak
  let k: number
  if (inkomen <= a.knik1) k = a.pct1 * inkomen
  else if (inkomen <= a.knik2) k = a.pct1 * a.knik1 + a.pct2 * (inkomen - a.knik1)
  else if (inkomen <= a.knik3) k = a.pct1 * a.knik1 + a.pct2 * (a.knik2 - a.knik1) + a.pct3 * (inkomen - a.knik2)
  else k = a.max - a.afbouwPct * (inkomen - a.afbouwVanaf)
  return Math.max(0, Math.min(a.max, k))
}

function brutoNaarNetto(brutoJaar: number): BerekeningResultaat {
  const { totaal: belasting, detail } = belastingSchijven(brutoJaar)
  const ahk = algemeneHeffingskorting(brutoJaar)
  const ak = arbeidskorting(brutoJaar)
  const kortingen = Math.min(belasting, ahk + ak)
  const teBetalen = belasting - kortingen
  return {
    brutoJaar,
    belastingBruto: belasting,
    schijfDetail: detail,
    ahk,
    ak,
    kortingenBenut: kortingen,
    teBetalen,
    nettoJaar: brutoJaar - teBetalen,
    druk: brutoJaar > 0 ? teBetalen / brutoJaar : 0,
  }
}

function nettoNaarBruto(nettoJaar: number): BerekeningResultaat {
  let lo = nettoJaar, hi = nettoJaar * 2.5 + 50_000
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (brutoNaarNetto(mid).nettoJaar < nettoJaar) lo = mid
    else hi = mid
  }
  return brutoNaarNetto((lo + hi) / 2)
}

// ── Format helpers ────────────────────────────────────────────────────────────

const eur = (n: number, dec = 0) =>
  '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const pct = (n: number, dec = 2) =>
  (n * 100).toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%'

// ── Component ─────────────────────────────────────────────────────────────────

export function BrutoNettoCalculator() {
  const [richting, setRichting] = useState<'brutoNetto' | 'nettoBruto'>('brutoNetto')
  const [periode, setPeriode] = useState<'maand' | 'jaar'>('maand')
  const [invoer, setInvoer] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const prevTitle = document.title
    document.title = `Bruto netto berekenen ${P.jaar} | Financiële Planning`

    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = metaDesc?.getAttribute('content') ?? ''
    const newDesc = `Bereken gratis je netto salaris uit je bruto loon (of andersom) voor ${P.jaar}. Inclusief alle belastingschijven, algemene heffingskorting en arbeidskorting.`
    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc)
    } else {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      metaDesc.content = newDesc
      document.head.appendChild(metaDesc)
    }

    return () => {
      document.title = prevTitle
      if (metaDesc) metaDesc.setAttribute('content', prevDesc)
    }
  }, [])

  const bedrag = parseFloat(invoer.replace(',', '.')) || 0
  const jaarBedrag = periode === 'maand' ? bedrag * 12 : bedrag

  const r = useMemo<BerekeningResultaat | null>(() => {
    if (jaarBedrag <= 0) return null
    return richting === 'brutoNetto' ? brutoNaarNetto(jaarBedrag) : nettoNaarBruto(jaarBedrag)
  }, [jaarBedrag, richting])

  const uitkomstJaar = r ? (richting === 'brutoNetto' ? r.nettoJaar : r.brutoJaar) : 0
  const uitkomstLabel = richting === 'brutoNetto' ? 'Netto' : 'Bruto'

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        Bruto-netto calculator {P.jaar}
      </h1>
      <p className="text-sm text-slate-500 mb-4">
        Werknemer onder AOW-leeftijd, met loonheffingskorting, exclusief vakantiegeld en pensioenpremie.
      </p>

      {/* Toeslagen-disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-5">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">
          <strong>Toeslagen blijven buiten beschouwing.</strong> Huurtoeslag, zorgtoeslag,
          kinderopvangtoeslag en kindgebonden budget zitten níét in deze berekening. Je
          werkelijke besteedbare inkomen kan daardoor afwijken.
        </p>
      </div>

      {/* Invoer */}
      <div className="card mb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setRichting('brutoNetto')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              richting === 'brutoNetto'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bruto → netto
          </button>
          <button
            onClick={() => setRichting('nettoBruto')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              richting === 'nettoBruto'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Netto → bruto
          </button>
        </div>

        <label className="label">
          {richting === 'brutoNetto' ? 'Bruto salaris' : 'Netto salaris'}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">€</span>
            <input
              type="text"
              inputMode="decimal"
              value={invoer}
              onChange={(e) => setInvoer(e.target.value)}
              placeholder="0"
              className="input-field pl-8 text-lg"
            />
          </div>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value as 'maand' | 'jaar')}
            className="input-field w-auto"
          >
            <option value="maand">per maand</option>
            <option value="jaar">per jaar</option>
          </select>
        </div>
      </div>

      {/* Uitkomst */}
      {r && (
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm text-slate-500">{uitkomstLabel} per maand</span>
            <span className="text-3xl font-semibold text-slate-900">{eur(uitkomstJaar / 12)}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm text-slate-500 mb-4">
            <span>{uitkomstLabel} per jaar</span>
            <span>{eur(uitkomstJaar)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-slate-100 pt-4">
            <div>
              <div className="text-slate-400 text-xs mb-0.5">Bruto / jaar</div>
              <div className="font-medium text-slate-800">{eur(r.brutoJaar)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-0.5">Belasting / jaar</div>
              <div className="font-medium text-slate-800">{eur(r.teBetalen)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-0.5">Belastingdruk</div>
              <div className="font-medium text-slate-800">{pct(r.druk, 1)}</div>
            </div>
          </div>

          {/* Uitklapdetail */}
          <button
            onClick={() => setOpen(!open)}
            className="mt-4 w-full flex items-center justify-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 py-2 border-t border-slate-100"
          >
            {open ? 'Verberg uitgebreide berekening' : 'Toon uitgebreide berekening'}
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {open && (
            <div className="text-sm text-slate-700 space-y-5 pt-3">
              {/* Stap 1: schijven */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">1. Belasting per schijf (box 1)</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 text-left">
                      <th className="py-1 font-normal">Schijf</th>
                      <th className="py-1 font-normal text-right">Grondslag</th>
                      <th className="py-1 font-normal text-right">Tarief</th>
                      <th className="py-1 font-normal text-right">Belasting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.schijfDetail.map((s, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5">{eur(s.van)} – {s.tot === Infinity ? '∞' : eur(s.tot)}</td>
                        <td className="py-1.5 text-right">{eur(s.grondslag)}</td>
                        <td className="py-1.5 text-right">{pct(s.tarief)}</td>
                        <td className="py-1.5 text-right">{eur(s.bedrag, 2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-medium">
                      <td className="py-1.5" colSpan={3}>Belasting vóór kortingen</td>
                      <td className="py-1.5 text-right">{eur(r.belastingBruto, 2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stap 2: kortingen */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">2. Heffingskortingen</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Algemene heffingskorting</span>
                    <span>{eur(r.ahk, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arbeidskorting</span>
                    <span>{eur(r.ak, 2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-slate-200 pt-1.5">
                    <span>Totaal benutte kortingen</span>
                    <span>− {eur(r.kortingenBenut, 2)}</span>
                  </div>
                  {r.kortingenBenut < r.ahk + r.ak && (
                    <p className="text-slate-400 pt-1">
                      Kortingen zijn afgetopt op de verschuldigde belasting; het restant is niet verzilverbaar.
                    </p>
                  )}
                </div>
              </div>

              {/* Stap 3: resultaat */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">3. Resultaat</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Bruto jaarsalaris</span>
                    <span>{eur(r.brutoJaar, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Te betalen belasting</span>
                    <span>− {eur(r.teBetalen, 2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-slate-200 pt-1.5">
                    <span>Netto jaarsalaris</span>
                    <span>{eur(r.nettoJaar, 2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Netto per maand</span>
                    <span>{eur(r.nettoJaar / 12, 2)}</span>
                  </div>
                </div>
                {richting === 'nettoBruto' && (
                  <p className="text-slate-400 text-xs mt-2">
                    Het brutobedrag is numeriek benaderd (binair zoeken) tot op de cent.
                  </p>
                )}
              </div>

              {/* Gebruikte fiscale cijfers */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="font-semibold text-slate-900 mb-2">Gebruikte fiscale cijfers {P.jaar}</h3>
                <div className="text-xs space-y-3">
                  <div>
                    <div className="font-medium mb-1">Box 1-tarieven (jonger dan AOW-leeftijd)</div>
                    <ul className="space-y-0.5 text-slate-600">
                      <li>Schijf 1: 35,75% tot {eur(38_883)}</li>
                      <li>Schijf 2: 37,56% van {eur(38_883)} tot {eur(78_426)}</li>
                      <li>Schijf 3: 49,50% boven {eur(78_426)}</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Algemene heffingskorting</div>
                    <ul className="space-y-0.5 text-slate-600">
                      <li>Maximum: {eur(3_115)}</li>
                      <li>Afbouw: 6,398% vanaf {eur(29_736)}</li>
                      <li>Nihil vanaf {eur(78_426)}</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Arbeidskorting</div>
                    <ul className="space-y-0.5 text-slate-600">
                      <li>Opbouw 8,324% tot {eur(11_965)}</li>
                      <li>Opbouw 31,009% tot {eur(25_845)}</li>
                      <li>Opbouw 1,95% tot {eur(45_592)} (maximum {eur(5_685)})</li>
                      <li>Afbouw 6,510% vanaf {eur(45_593)}, nihil vanaf ± {eur(132_290)}</li>
                    </ul>
                  </div>
                  <div className="text-slate-400 pt-1 border-t border-slate-200">
                    Bron: Belastingdienst (Nieuwsbrief Loonheffingen {P.jaar}) en Belastingplan {P.jaar}.
                    Peildatum: juni {P.jaar}. Vereenvoudigde berekening: geen pensioenpremie,
                    vakantiegeld, bijzondere beloningen, aftrekposten of toeslagen. Aan deze
                    tool kunnen geen rechten worden ontleend.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
