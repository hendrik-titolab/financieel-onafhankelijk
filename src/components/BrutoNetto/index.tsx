import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { BOX1_PRE_AOW, HEFFINGSKORTING_PRE_AOW } from '../../config/fiscaleParameters'

// ── Fiscale parameters 2026 ───────────────────────────────────────────────────
// Alle getallen komen uit de centrale config (fiscaleParameters.ts), zodat de
// kwartaalcheck ze meeneemt. Hier alleen omgezet naar de vorm die de tool gebruikt.
const P = {
  jaar: 2026,
  schijven: [
    { tot: BOX1_PRE_AOW.schijf1Grens, tarief: BOX1_PRE_AOW.schijf1Tarief },
    { tot: BOX1_PRE_AOW.schijf2Grens, tarief: BOX1_PRE_AOW.schijf2Tarief },
    { tot: Infinity, tarief: BOX1_PRE_AOW.schijf3Tarief },
  ],
  ahk: HEFFINGSKORTING_PRE_AOW.algemeneHeffingskorting,
  ak: HEFFINGSKORTING_PRE_AOW.arbeidskorting,
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
      <h1 className="font-serif text-2xl text-ink mb-1">
        Bruto-netto calculator {P.jaar}
      </h1>
      <p className="text-sm text-body mb-4">
        Werknemer onder AOW-leeftijd, met loonheffingskorting, exclusief vakantiegeld en pensioenpremie.
      </p>

      {/* Toeslagen-disclaimer */}
      <div className="flex items-start gap-2 bg-panel border border-signal rounded-[3px] px-4 py-3 mb-5">
        <Info className="w-5 h-5 text-signal shrink-0 mt-0.5" />
        <p className="text-sm text-ink">
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
            className={`flex-1 py-2 rounded-[3px] text-sm font-medium transition ${
              richting === 'brutoNetto'
                ? 'bg-ink text-warmwhite'
                : 'bg-canvas text-body hover:bg-line'
            }`}
          >
            Bruto → netto
          </button>
          <button
            onClick={() => setRichting('nettoBruto')}
            className={`flex-1 py-2 rounded-[3px] text-sm font-medium transition ${
              richting === 'nettoBruto'
                ? 'bg-ink text-warmwhite'
                : 'bg-canvas text-body hover:bg-line'
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body pointer-events-none">€</span>
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
            <span className="text-sm text-body">{uitkomstLabel} per maand</span>
            <span className="text-3xl font-numeric text-ink tabular">{eur(uitkomstJaar / 12)}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm text-body mb-4">
            <span>{uitkomstLabel} per jaar</span>
            <span>{eur(uitkomstJaar)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-line-soft pt-4">
            <div>
              <div className="text-body text-xs mb-0.5">Bruto / jaar</div>
              <div className="font-numeric text-ink tabular">{eur(r.brutoJaar)}</div>
            </div>
            <div>
              <div className="text-body text-xs mb-0.5">Belasting / jaar</div>
              <div className="font-numeric text-ink tabular">{eur(r.teBetalen)}</div>
            </div>
            <div>
              <div className="text-body text-xs mb-0.5">Belastingdruk</div>
              <div className="font-numeric text-ink tabular">{pct(r.druk, 1)}</div>
            </div>
          </div>

          {/* Uitklapdetail */}
          <button
            onClick={() => setOpen(!open)}
            className="mt-4 w-full flex items-center justify-center gap-1 text-sm font-medium text-data-700 hover:text-ink py-2 border-t border-line-soft"
          >
            {open ? 'Verberg uitgebreide berekening' : 'Toon uitgebreide berekening'}
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {open && (
            <div className="text-sm text-body space-y-5 pt-3">
              {/* Stap 1: schijven */}
              <div>
                <h3 className="font-medium text-ink mb-2">1. Belasting per schijf (box 1)</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-body text-left">
                      <th className="py-1 font-normal">Schijf</th>
                      <th className="py-1 font-normal text-right">Grondslag</th>
                      <th className="py-1 font-normal text-right">Tarief</th>
                      <th className="py-1 font-normal text-right">Belasting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.schijfDetail.map((s, i) => (
                      <tr key={i} className="border-t border-line-soft">
                        <td className="py-1.5">{eur(s.van)} – {s.tot === Infinity ? '∞' : eur(s.tot)}</td>
                        <td className="py-1.5 text-right">{eur(s.grondslag)}</td>
                        <td className="py-1.5 text-right">{pct(s.tarief)}</td>
                        <td className="py-1.5 text-right">{eur(s.bedrag, 2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line font-medium">
                      <td className="py-1.5" colSpan={3}>Belasting vóór kortingen</td>
                      <td className="py-1.5 text-right">{eur(r.belastingBruto, 2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stap 2: kortingen */}
              <div>
                <h3 className="font-medium text-ink mb-2">2. Heffingskortingen</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Algemene heffingskorting</span>
                    <span>{eur(r.ahk, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arbeidskorting</span>
                    <span>{eur(r.ak, 2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-line pt-1.5">
                    <span>Totaal benutte kortingen</span>
                    <span>− {eur(r.kortingenBenut, 2)}</span>
                  </div>
                  {r.kortingenBenut < r.ahk + r.ak && (
                    <p className="text-body pt-1">
                      Kortingen zijn afgetopt op de verschuldigde belasting; het restant is niet verzilverbaar.
                    </p>
                  )}
                </div>
              </div>

              {/* Stap 3: resultaat */}
              <div>
                <h3 className="font-medium text-ink mb-2">3. Resultaat</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Bruto jaarsalaris</span>
                    <span>{eur(r.brutoJaar, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Te betalen belasting</span>
                    <span>− {eur(r.teBetalen, 2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-line pt-1.5">
                    <span>Netto jaarsalaris</span>
                    <span>{eur(r.nettoJaar, 2)}</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Netto per maand</span>
                    <span>{eur(r.nettoJaar / 12, 2)}</span>
                  </div>
                </div>
                {richting === 'nettoBruto' && (
                  <p className="text-body text-xs mt-2">
                    Het brutobedrag is numeriek benaderd (binair zoeken) tot op de cent.
                  </p>
                )}
              </div>

              {/* Gebruikte fiscale cijfers */}
              <div className="bg-canvas rounded-[3px] p-3">
                <h3 className="font-medium text-ink mb-2">Gebruikte fiscale cijfers {P.jaar}</h3>
                <div className="text-xs space-y-3">
                  <div>
                    <div className="font-medium mb-1">Box 1-tarieven (jonger dan AOW-leeftijd)</div>
                    <ul className="space-y-0.5 text-body">
                      <li>Schijf 1: {pct(P.schijven[0].tarief)} tot {eur(P.schijven[0].tot)}</li>
                      <li>Schijf 2: {pct(P.schijven[1].tarief)} van {eur(P.schijven[0].tot)} tot {eur(P.schijven[1].tot)}</li>
                      <li>Schijf 3: {pct(P.schijven[2].tarief)} boven {eur(P.schijven[1].tot)}</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Algemene heffingskorting</div>
                    <ul className="space-y-0.5 text-body">
                      <li>Maximum: {eur(P.ahk.max)}</li>
                      <li>Afbouw: {pct(P.ahk.afbouwPct, 3)} vanaf {eur(P.ahk.afbouwVanaf)}</li>
                      <li>Nihil vanaf {eur(P.ahk.nihilBij)}</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Arbeidskorting</div>
                    <ul className="space-y-0.5 text-body">
                      <li>Opbouw {pct(P.ak.pct1, 3)} tot {eur(P.ak.knik1)}</li>
                      <li>Opbouw {pct(P.ak.pct2, 3)} tot {eur(P.ak.knik2)}</li>
                      <li>Opbouw {pct(P.ak.pct3, 2)} tot {eur(P.ak.knik3)} (maximum {eur(P.ak.max)})</li>
                      <li>Afbouw {pct(P.ak.afbouwPct, 3)} vanaf {eur(P.ak.afbouwVanaf)}, nihil vanaf {eur(P.ak.afbouwVanaf + P.ak.max / P.ak.afbouwPct)}</li>
                    </ul>
                  </div>
                  <div className="text-body pt-1 border-t border-line">
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
