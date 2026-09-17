import { useId, useMemo } from 'react'
import { NumberInput } from '../PensionPlanner/InputPanel'
import { verdubbeltijd } from '../../utils/renteOpRente'
import type { VariantConfig } from './varianten'
import { eur, maalTekst, pctKort } from './format'

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 px-3 rounded-[3px] bg-canvas">
      <span className="text-sm text-body">{label}</span>
      <span className="font-numeric tabular text-ink">{value}</span>
    </div>
  )
}

export function Rekentool({
  variant,
  inleg,
  onInleg,
  jaren,
  onJaren,
  rendement,
  onRendement,
}: {
  variant: VariantConfig
  inleg: number
  onInleg: (v: number) => void
  jaren: number
  onJaren: (v: number) => void
  /** In procenten, dus 6 betekent 6%. */
  rendement: number
  onRendement: (v: number) => void
}) {
  const inlegId = useId()
  const jarenId = useId()
  const rendementId = useId()

  const r = useMemo(
    () => variant.bereken(inleg, rendement / 100, jaren),
    [variant, inleg, rendement, jaren]
  )
  const dubbel = verdubbeltijd(rendement / 100)

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={inlegId} className="label">
              {variant.inlegLabel}
            </label>
            <NumberInput
              id={inlegId}
              value={inleg}
              onChange={onInleg}
              prefix="€"
              min={0}
              max={variant.maxInleg}
            />
            <p className="text-xs text-body mt-1 leading-relaxed">{variant.inlegHelp}</p>
          </div>

          <div>
            <label htmlFor={rendementId} className="label">
              Verwacht rendement per jaar
            </label>
            <NumberInput
              id={rendementId}
              value={rendement}
              onChange={onRendement}
              suffix="%"
              min={0}
              max={25}
            />
            <p className="text-xs text-body mt-1 leading-relaxed">
              Nominaal, dus vóór inflatie, kosten en belasting.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor={jarenId} className="label mb-0">
              Aantal jaren
            </label>
            <span className="font-numeric tabular text-[17px] text-data-700">{jaren}</span>
          </div>
          <input
            id={jarenId}
            type="range"
            min={1}
            max={50}
            value={jaren}
            aria-label="Aantal jaren"
            onChange={(e) => onJaren(parseInt(e.target.value, 10))}
          />
          <div className="flex justify-between text-xs text-body">
            <span>1 jaar</span>
            <span>50 jaar</span>
          </div>
        </div>
      </div>

      <div className="card border-l-4 border-l-ink">
        <p className="label-mono mb-2">{variant.uitkomstLabel(jaren)}</p>
        <p className="font-numeric tabular text-[30px] leading-none text-ink">
          {eur(r.eindwaarde)}
        </p>
        <p className="text-sm text-body mt-2 leading-relaxed">
          Bij {pctKort(rendement)} per jaar. Daarvan is {eur(r.rendement)} rendement.
        </p>
      </div>

      <div className="card space-y-1">
        <p className="label-mono mb-2">Kerncijfers</p>
        <ResultRow label={variant.inlegRegelLabel} value={eur(r.totaalInleg)} />
        <ResultRow label="Rendement" value={eur(r.rendement)} />
        <ResultRow
          label="Eindbedrag tegenover je inleg"
          value={r.totaalInleg > 0 ? maalTekst(r.vermenigvuldiging) : '—'}
        />
        <ResultRow
          label="Verdubbelt elke"
          value={
            Number.isFinite(dubbel)
              ? `${dubbel.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} jaar`
              : 'nooit'
          }
        />
      </div>
    </div>
  )
}
