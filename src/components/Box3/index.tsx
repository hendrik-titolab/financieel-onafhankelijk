import { useMemo, useState } from 'react'
import { Info, Scale } from 'lucide-react'
import {
  box3Vergelijking,
  type Box3Invoer,
  type Box3Jaar,
  type WerkelijkRendementInvoer,
} from '../../utils/box3'
import { BOX3_JAREN, BOX3_JAREN_IN_TOOL } from '../../config/fiscaleParameters'
import { modelStempel, PARAMETER_JAAR } from '../../config/modelVersie'
// Gedeeld met de FO-planner, zie InputPanel.tsx: was hier een bijna-identieke
// eigen kopie (BedragVeld), tot de code-review van 14 september 2026.
import { NumberInput } from '../PensionPlanner/InputPanel'

// ---- Presentatie-helpers (NL-notatie) ----

const eur = (n: number, dec = 0): string =>
  '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const pct = (n: number, dec = 2): string =>
  n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%'

// ---- Invoervelden ----
// Bedragveld met Nederlandse notatie: zie NumberInput in
// ../PensionPlanner/InputPanel.tsx, hier hergebruikt met prefix="€".

function Veld({ label, htmlFor, help, children }: {
  label: string; htmlFor: string; help?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {help && <p className="text-xs text-body mt-1 leading-relaxed">{help}</p>}
    </div>
  )
}

function Rij({ label, value, highlight, gedempt }: {
  label: string; value: string; highlight?: boolean; gedempt?: boolean
}) {
  return (
    <div className={`flex justify-between items-baseline gap-4 py-2 px-3 rounded-[3px] ${
      highlight ? 'bg-morning' : 'bg-canvas'
    }`}>
      <span className={`text-sm ${highlight ? 'font-medium text-ink' : 'text-body'}`}>{label}</span>
      <span className={`font-numeric tabular whitespace-nowrap ${
        highlight ? 'text-lg text-ink' : gedempt ? 'text-body' : 'text-ink'
      }`}>{value}</span>
    </div>
  )
}

// De jaren die de tool aanbiedt, doorsneden met de jaren waarvoor de rekenkern
// werkelijk cijfers heeft. Dat zijn in de gegenereerde config twee losse lijsten
// (fiscale-cijfers.json heeft er aparte velden voor, zie genereer.mjs): biedt
// BOX3_JAREN_IN_TOOL ooit een jaar aan dat in BOX3_JAREN ontbreekt, dan is
// BOX3_JAREN[jaar] undefined en klapt de tool op de eerstvolgende p.-lezing met
// een wit scherm. De `as Box3Jaar`-cast die bij de select stond verborg dat voor
// de compiler. Hier gefilterd, zodat de select geen jaar kan tonen dat de
// rekenkern niet kent (bevinding review 14 september 2026).
const BESCHIKBARE_JAREN = BOX3_JAREN_IN_TOOL.filter((j): j is Box3Jaar => j in BOX3_JAREN)

// Het jaar waarop de tool opent. Stond als los getal 2026 in de useState, waardoor
// de tool na een jaarwisseling zou blijven openen op een jaar dat niet meer het
// actuele is, ook als de cijfers er allang zijn. Nu het parameterjaar, en anders
// het laatste jaar dat de tool werkelijk kan rekenen (WP9).
const STANDAARDJAAR: Box3Jaar =
  BESCHIKBARE_JAREN.find(j => j === PARAMETER_JAAR)
  ?? BESCHIKBARE_JAREN[BESCHIKBARE_JAREN.length - 1]

// ---- Hoofdcomponent ----

export function Box3Tool() {
  const [jaar, setJaar] = useState<Box3Jaar>(STANDAARDJAAR)
  const [fiscaalPartner, setFiscaalPartner] = useState(false)

  const [banktegoeden, setBanktegoeden] = useState(80_000)
  const [beleggingen, setBeleggingen] = useState(120_000)
  const [overigeBezittingen, setOverigeBezittingen] = useState(0)
  const [schulden, setSchulden] = useState(0)

  const [tegenbewijsAan, setTegenbewijsAan] = useState(false)
  // Wie zijn werkelijke rendement al weet, van zijn bank of zijn adviseur, hoeft
  // dat niet terug te rekenen naar zes losse velden.
  const [modus, setModus] = useState<'uitrekenen' | 'zelf'>('uitrekenen')
  const [werkelijkZelf, setWerkelijkZelf] = useState(3_000)
  const [reguliereVoordelen, setReguliereVoordelen] = useState(3_000)
  const [waardeBegin, setWaardeBegin] = useState(200_000)
  const [waardeEind, setWaardeEind] = useState(200_000)
  const [aankopen, setAankopen] = useState(0)
  const [verkopen, setVerkopen] = useState(0)
  const [renteSchulden, setRenteSchulden] = useState(0)

  const bezittingen = banktegoeden + beleggingen + overigeBezittingen
  const p = BOX3_JAREN[jaar]

  const invoer: Box3Invoer = {
    jaar, fiscaalPartner, banktegoeden, beleggingen, overigeBezittingen, schulden,
  }
  const werkelijkInvoer: WerkelijkRendementInvoer = {
    reguliereVoordelen, waardeBegin, waardeEind, aankopen, verkopen, renteSchulden,
  }

  const r = useMemo(
    () => box3Vergelijking(
      invoer,
      !tegenbewijsAan ? null : modus === 'zelf' ? { bedrag: werkelijkZelf } : werkelijkInvoer,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jaar, fiscaalPartner, banktegoeden, beleggingen, overigeBezittingen, schulden,
      tegenbewijsAan, modus, werkelijkZelf,
      reguliereVoordelen, waardeBegin, waardeEind, aankopen, verkopen, renteSchulden],
  )
  const f = r.forfait
  const tegenbewijsHelpt = r.geldt === 'werkelijk'

  const statusTekst = (s: string) => (s === 'definitief' ? 'definitief' : 'voorlopig')

  return (
    <div className="space-y-5">
      {/* ── Uitgangspunten ───────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Veld
            label="Belastingjaar"
            htmlFor="jaar"
            help="De peildatum is 1 januari van dat jaar. Wat je daarna koopt of verkoopt telt niet mee voor het forfait."
          >
            <select
              id="jaar"
              value={jaar}
              onChange={e => {
                // Geen cast: de waarde uit het DOM-event wordt getoetst aan de
                // lijst hierboven. Staat hij er niet in, dan blijft het huidige
                // jaar staan in plaats van dat er een onbekend jaar doorglipt.
                const gekozen = Number(e.target.value)
                const geldig = BESCHIKBARE_JAREN.find(j => j === gekozen)
                if (geldig !== undefined) setJaar(geldig)
              }}
              className="input-field"
            >
              {BESCHIKBARE_JAREN.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </Veld>

          <Veld
            label="Fiscaal partner"
            htmlFor="partner"
            help="Met een fiscaal partner tellen het heffingsvrije vermogen en de schuldendrempel dubbel."
          >
            <select
              id="partner"
              value={fiscaalPartner ? 'ja' : 'nee'}
              onChange={e => setFiscaalPartner(e.target.value === 'ja')}
              className="input-field"
            >
              <option value="nee">Nee</option>
              <option value="ja">Ja</option>
            </select>
          </Veld>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Veld
            label="Bank- en spaartegoeden"
            htmlFor="banktegoeden"
            help={`Eigen forfait: ${pct(p.forfaitairRendement.spaargeld * 100)} in ${jaar}.`}
          >
            <NumberInput prefix="€" id="banktegoeden" value={banktegoeden} onChange={setBanktegoeden} max={100_000_000} />
          </Veld>

          <Veld
            label="Beleggingen"
            htmlFor="beleggingen"
            help={`Aandelen, obligaties, fondsen, crypto. Forfait ${pct(p.forfaitairRendement.beleggingen * 100)}.`}
          >
            <NumberInput prefix="€" id="beleggingen" value={beleggingen} onChange={setBeleggingen} max={100_000_000} />
          </Veld>

          <Veld
            label="Overige bezittingen"
            htmlFor="overig"
            help="Tweede woning, verhuurd vastgoed, vorderingen. Hetzelfde forfait als beleggingen."
          >
            <NumberInput prefix="€" id="overig" value={overigeBezittingen} onChange={setOverigeBezittingen} max={100_000_000} />
          </Veld>

          <Veld
            label="Schulden in box 3"
            htmlFor="schulden"
            help={`De eerste ${eur(fiscaalPartner ? p.schuldendrempel.fiscaalPartnersSamen : p.schuldendrempel.alleenstaand)} telt niet mee. Een hypotheek op je eigen woning hoort hier niet bij, die zit in box 1.`}
          >
            <NumberInput prefix="€" id="schulden" value={schulden} onChange={setSchulden} max={100_000_000} />
          </Veld>
        </div>
      </div>

      {/* ── Uitkomst ─────────────────────────────────────────────────────── */}
      <div className={`card border-l-4 ${tegenbewijsHelpt ? 'border-l-data-700' : 'border-l-ink'}`}>
        <div className="flex items-start gap-3">
          <Scale className="w-6 h-6 text-ink shrink-0 mt-1" />
          <div>
            <p className="text-xl sm:text-2xl font-medium text-ink leading-snug">
              {tegenbewijsHelpt ? (
                <>Over {jaar} betaal je <span className="font-numeric text-data-700">{eur(r.belasting)}</span>{' '}
                  box 3-belasting, op basis van je werkelijke rendement. Dat is{' '}
                  <span className="font-numeric text-data-700">{eur(r.voordeelTegenbewijs)}</span> minder dan het forfait.</>
              ) : (
                <>Over {jaar} betaal je <span className="font-numeric text-ink">{eur(f.belasting)}</span>{' '}
                  box 3-belasting{fiscaalPartner ? ', voor jullie samen' : ''}.</>
              )}
            </p>
            <p className="text-sm text-body mt-2 leading-relaxed">
              {tegenbewijsAan
                ? tegenbewijsHelpt
                  ? 'Je werkelijke rendement was lager dan het forfaitaire voordeel, dus telt het werkelijke rendement. Dit is een indicatie: de Belastingdienst beoordeelt zelf of je opgaaf klopt.'
                  : 'Je werkelijke rendement was hoger dan het forfaitaire voordeel. Dan blijft het forfait gelden, en heeft tegenbewijs geen zin.'
                : 'Dit is de forfaitaire berekening. Zet het tegenbewijs hieronder aan als je een tegenvallend jaar had.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tegenbewijs ──────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-ink">Werkelijk rendement (tegenbewijs)</h2>
            <p className="text-xs text-body mt-1 leading-relaxed max-w-xl">
              Sinds de arresten van de Hoge Raad mag je aantonen dat je werkelijke rendement lager
              was dan het forfait. Dan telt het werkelijke rendement. Let op: daarbij geldt géén
              heffingsvrij vermogen, dus bij een kleiner vermogen pakt dit vaak juist ongunstiger uit.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={tegenbewijsAan}
              onChange={e => setTegenbewijsAan(e.target.checked)}
              className="w-4 h-4"
            />
            Meerekenen
          </label>
        </div>

        {tegenbewijsAan && (
          <div className="space-y-4 pt-1">
            <Veld
              label="Hoe geef je je werkelijke rendement op?"
              htmlFor="modus"
              help="Weet je het bedrag al, bijvoorbeeld van je bank of je adviseur, vul het dan rechtstreeks in."
            >
              <select
                id="modus"
                value={modus}
                onChange={e => setModus(e.target.value as 'uitrekenen' | 'zelf')}
                className="input-field"
              >
                <option value="uitrekenen">Laat de tool het uitrekenen</option>
                <option value="zelf">Ik weet het bedrag al</option>
              </select>
            </Veld>

            {modus === 'zelf' && (
              <Veld
                label="Werkelijk rendement over het jaar"
                htmlFor="werkelijkzelf"
                help="Ontvangen rente, dividend en huur plus de waardeontwikkeling, min betaalde rente over een box 3-schuld. Een negatief bedrag mag: dat wordt op € 0 gezet."
              >
                <NumberInput prefix="€"
                  id="werkelijkzelf"
                  value={werkelijkZelf}
                  onChange={setWerkelijkZelf}
                  min={-100_000_000}
                  max={100_000_000}
                />
              </Veld>
            )}

            {modus === 'uitrekenen' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Veld
                label="Ontvangen rente, dividend, huur"
                htmlFor="regulier"
                help="Alles wat je dat jaar daadwerkelijk hebt ontvangen."
              >
                <NumberInput prefix="€" id="regulier" value={reguliereVoordelen} onChange={setReguliereVoordelen} max={100_000_000} />
              </Veld>

              <Veld
                label="Rente betaald over box 3-schuld"
                htmlFor="renteschuld"
                help="Deze telt wel mee, als negatieve opbrengst. Gewone kosten zoals aan- en verkoopkosten of onderhoud niet."
              >
                <NumberInput prefix="€" id="renteschuld" value={renteSchulden} onChange={setRenteSchulden} max={100_000_000} />
              </Veld>

              <Veld
                label="Bezittingen min schulden op 1 januari"
                htmlFor="waardebegin"
                help="Het saldo, dus alles samen en je box 3-schulden eraf. Ook wat je niet verkocht hebt telt mee. Een negatief saldo (meer schuld dan bezit) mag."
              >
                <NumberInput prefix="€" id="waardebegin" value={waardeBegin} onChange={setWaardeBegin} min={-100_000_000} max={100_000_000} />
              </Veld>

              <Veld
                label="Bezittingen min schulden op 31 december"
                htmlFor="waardeeind"
                help="Ongerealiseerde waardestijging telt mee. Papieren winst is dus belast. Een negatief saldo (meer schuld dan bezit) mag."
              >
                <NumberInput prefix="€" id="waardeeind" value={waardeEind} onChange={setWaardeEind} min={-100_000_000} max={100_000_000} />
              </Veld>

              <Veld
                label="Bijgestort of bijgekocht in het jaar"
                htmlFor="aankopen"
                help="Gaat eraf: een storting is geen rendement."
              >
                <NumberInput prefix="€" id="aankopen" value={aankopen} onChange={setAankopen} max={100_000_000} />
              </Veld>

              <Veld
                label="Opgenomen of verkocht in het jaar"
                htmlFor="verkopen"
                help="Gaat erbij: anders lijkt een opname op verlies."
              >
                <NumberInput prefix="€" id="verkopen" value={verkopen} onChange={setVerkopen} max={100_000_000} />
              </Veld>
            </div>
            )}

            {modus === 'uitrekenen' && waardeBegin !== bezittingen - schulden && (
              <button
                type="button"
                onClick={() => setWaardeBegin(bezittingen - schulden)}
                className="text-xs text-data-700 underline underline-offset-2 hover:text-ink"
              >
                Neem {eur(bezittingen - schulden)} over als saldo op 1 januari, gelijk aan wat je hierboven invulde
              </button>
            )}

            <div className="space-y-2">
              {r.werkelijk.waardeontwikkeling !== null && (
                <Rij label="Waardeontwikkeling" value={eur(r.werkelijk.waardeontwikkeling)} />
              )}
              <Rij label="Werkelijk rendement" value={eur(r.werkelijk.bruto)} gedempt={r.werkelijk.opNulGezet} />
              {r.werkelijk.opNulGezet && (
                <p className="text-xs text-signal leading-relaxed px-3">
                  Je rendement was negatief. Fiscaal wordt het dan op € 0 gezet: een verlies in box 3
                  is niet verrekenbaar met een ander jaar.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── De vergelijking ──────────────────────────────────────────────── */}
      {tegenbewijsAan && (
        <div className="card space-y-2">
          <h2 className="text-sm font-medium text-body mb-1">Welke van de twee geldt</h2>
          <Rij
            label="Forfaitair voordeel uit sparen en beleggen"
            value={eur(f.voordeel)}
            highlight={r.geldt === 'forfait'}
          />
          <Rij
            label="Werkelijk rendement (geen heffingsvrij vermogen)"
            value={eur(r.werkelijk.rendement)}
            highlight={r.geldt === 'werkelijk'}
          />
          <Rij label={`Belasting, ${pct(p.tarief * 100, 0)} over het laagste bedrag`} value={eur(r.belasting)} highlight />
          <p className="text-xs text-body pt-1 leading-relaxed">
            Het werkelijke rendement komt alleen in de plaats van het forfait als het lager is dan
            het forfaitaire voordeel, dus nadat het heffingsvrije vermogen er bij het forfait al af
            is (artikel 5.25 Wet IB 2001).
          </p>
        </div>
      )}

      {/* ── De zes stappen ───────────────────────────────────────────────── */}
      <details className="card">
        <summary className="text-sm font-medium text-ink cursor-pointer">
          Zo is het forfaitaire bedrag opgebouwd, in zes stappen
        </summary>
        <div className="mt-4 space-y-2">
          <Rij label={`1a. Banktegoeden × ${pct(p.forfaitairRendement.spaargeld * 100)}`} value={eur(f.rendementBanktegoeden)} />
          <Rij label={`1b. Beleggingen en overige bezittingen × ${pct(p.forfaitairRendement.beleggingen * 100)}`} value={eur(f.rendementOverig)} />
          <Rij label={`1c. Aftrekbare schulden (${eur(f.aftrekbareSchulden)}) × ${pct(p.forfaitairRendement.schulden * 100)}`} value={'− ' + eur(f.rendementSchulden)} />
          <Rij label="1. Belastbaar rendement" value={eur(f.belastbaarRendement)} highlight />
          <Rij label="2. Rendementsgrondslag (bezittingen min aftrekbare schulden)" value={eur(f.rendementsgrondslag)} />
          <Rij label={`3. Min heffingsvrij vermogen (${eur(f.heffingsvrijVermogen)})`} value={eur(f.grondslagSparenEnBeleggen)} />
          <Rij
            label={`4. Aandeel in de rendementsgrondslag${f.personen === 2 ? ', per persoon' : ''}`}
            value={f.perPersoon.map(x => pct(x.aandeelPct)).join(' / ')}
          />
          <Rij
            label={`5. Voordeel uit sparen en beleggen${f.personen === 2 ? ' (samen)' : ''}`}
            value={eur(f.voordeel)}
          />
          <Rij label={`6. Belasting, ${pct(p.tarief * 100, 0)}`} value={eur(f.belasting)} highlight />
          <p className="text-xs text-body pt-2 leading-relaxed">
            Stap 4 is de stap die de meeste mensen niet verwachten. Het heffingsvrije vermogen wordt
            niet van je rendement afgetrokken, maar omgerekend naar een percentage van je vermogen,
            en dat percentage gaat vervolgens over je hele rendement heen. Bij een gemengd vermogen
            drukt het dus ook op het spaardeel. Dat aandeel wordt afgekapt op twee decimalen.
            {f.personen === 2 && ' Bij fiscale partners rekent deze tool met een verdeling van 50/50. Een andere verdeling verandert het totaal hooguit een euro of twee door de afronding per persoon.'}
          </p>
        </div>
      </details>

      {/* ── Gebruikte cijfers ────────────────────────────────────────────── */}
      <details className="card">
        <summary className="text-sm font-medium text-ink cursor-pointer">
          Welke cijfers gebruikt deze tool voor {jaar}?
        </summary>
        <div className="mt-4 space-y-2">
          <Rij label="Tarief" value={pct(p.tarief * 100, 0)} />
          <Rij
            label={fiscaalPartner ? 'Heffingsvrij vermogen, samen' : 'Heffingsvrij vermogen'}
            value={eur(fiscaalPartner ? p.heffingsvrijVermogen.fiscaalPartnersSamen : p.heffingsvrijVermogen.alleenstaand)}
          />
          <Rij
            label="Drempel schulden"
            value={eur(fiscaalPartner ? p.schuldendrempel.fiscaalPartnersSamen : p.schuldendrempel.alleenstaand)}
          />
          <Rij
            label={`Forfait banktegoeden (${statusTekst(p.forfaitStatus.spaargeld)})`}
            value={pct(p.forfaitairRendement.spaargeld * 100)}
          />
          <Rij
            label={`Forfait beleggingen en overige bezittingen (${statusTekst(p.forfaitStatus.beleggingen)})`}
            value={pct(p.forfaitairRendement.beleggingen * 100)}
          />
          <Rij
            label={`Forfait schulden (${statusTekst(p.forfaitStatus.schulden)})`}
            value={pct(p.forfaitairRendement.schulden * 100)}
          />
          <p className="text-xs text-body pt-2 leading-relaxed">
            Voorlopig betekent dat het percentage nog niet definitief is vastgesteld en achteraf kan
            wijzigen. Voor 2025 gebeurde die vaststelling op 12 februari 2026, ruim een jaar na de
            peildatum. De cijfers voor 2026 volgen naar verwachting begin 2027.
          </p>
          <p className="text-xs text-body leading-relaxed">{modelStempel()}</p>
        </div>
      </details>

      {/* ── Grenzen van de tool ──────────────────────────────────────────── */}
      <div className="flex items-start gap-2 bg-panel border border-signal rounded-[3px] px-4 py-3">
        <Info className="w-5 h-5 text-signal shrink-0 mt-0.5" />
        <div className="text-sm text-ink leading-relaxed space-y-2">
          <p>
            Een indicatie, geen aanslag en geen persoonlijk fiscaal advies. Zeker bij het
            tegenbewijs is dit een berekening waarmee je naar je adviseur of de Belastingdienst
            gaat, niet een uitkomst waar je op kunt vertrouwen.
          </p>
          <p>
            Twee dingen rekent deze tool bewust <strong>niet</strong> mee: de vrijstelling voor
            groene beleggingen, en de bijtelling voor het eigen gebruik van een tweede woning
            (vanaf 2026 5,06% van de WOZ-waarde). Heb je daarmee te maken, dan valt je werkelijke
            uitkomst anders uit.
          </p>
        </div>
      </div>
    </div>
  )
}
