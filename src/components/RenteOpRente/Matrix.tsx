import { useMemo } from 'react'
import { verdubbeltijd, HEAT_STAPPEN } from '../../utils/renteOpRente'
import type { VariantConfig } from './varianten'
import { eur, pctKort } from './format'

/**
 * Tintstap naar een klasse. Als letterlijke strings, want Tailwind scant de broncode en vindt
 * een klassenaam niet als die uit stukjes wordt samengesteld.
 *
 * data-300 en niet zand: DESIGN_SYSTEM.md houdt zand bij de menselijke laag en niet bij het
 * rekenblad. De tint stopt op 75% dekking, want daarboven zakt de leesbaarheid van de celtekst
 * door de contrasteis. Zie de notitie bij de datatokens in DESIGN_SYSTEM.md.
 */
const TINT = [
  '',
  'bg-data-300/15',
  'bg-data-300/30',
  'bg-data-300/45',
  'bg-data-300/60',
  'bg-data-300/75',
]

export function Matrix({ variant, inleg }: { variant: VariantConfig; inleg: number }) {
  const matrix = useMemo(() => variant.bouwMatrix(inleg), [variant, inleg])

  return (
    <div className="space-y-2">
      <p className="text-sm text-body leading-relaxed">{variant.matrixUitleg}</p>

      {/* Betekenis loopt niet alleen via de tint: het bedrag staat voluit in elke cel en de
          subregel geeft dezelfde ordening in tekst. De legenda maakt de tint zelf leesbaar. */}
      <div className="flex items-center gap-2 text-xs text-body">
        <span>minder</span>
        <span className="flex gap-px" aria-hidden="true">
          {TINT.map((klasse, i) => (
            <span key={i} className={`w-5 h-3 border border-line-soft ${klasse}`} />
          ))}
        </span>
        <span>meer</span>
      </div>

      <p className="text-xs text-body sm:hidden">Veeg opzij voor langere looptijden.</p>

      {/*
        Scrollbaar vlak moet met het toetsenbord bereikbaar zijn, vandaar tabIndex en de
        region-rol. border-separate en niet border-collapse: bij border-collapse verdwijnen de
        randen van de vastgezette eerste kolom onder de cellen die eronderdoor scrollen.
      */}
      <div
        className="overflow-x-auto border border-line rounded-[3px]"
        role="region"
        aria-label={variant.tabelBijschrift}
        tabIndex={0}
      >
        <table className="w-full min-w-[820px] border-separate border-spacing-0 bg-panel">
          <caption className="sr-only">{variant.tabelBijschrift}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 bg-ink text-left align-bottom px-3 py-2 border-r border-line"
              >
                <span className="label-mono text-on-dark">Rendement per jaar</span>
              </th>
              {matrix.looptijden.map((jaren) => {
                const sub = variant.kolomSubregel(jaren, inleg)
                return (
                  <th key={jaren} scope="col" className="bg-ink text-right align-bottom px-2 py-2">
                    <span className="label-mono text-on-dark">{jaren} jaar</span>
                    {sub && (
                      <span className="block mt-1 font-numeric tabular text-[11px] text-stone whitespace-nowrap">
                        {sub}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.rijen.map((rij, ri) => (
              <tr key={matrix.rendementen[ri]}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-panel text-left px-3 py-2 border-r border-line border-t border-t-line-soft whitespace-nowrap"
                >
                  <span className="block font-numeric tabular text-[18px] text-ink leading-tight">
                    {pctKort(matrix.rendementen[ri] * 100)}
                  </span>
                  <span className="block text-[11px] text-body">
                    verdubbelt elke{' '}
                    {verdubbeltijd(matrix.rendementen[ri]).toLocaleString('nl-NL', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}{' '}
                    jaar
                  </span>
                </th>
                {rij.map((cel) => (
                  <td
                    key={cel.jaren}
                    className={`px-2 py-2 text-right whitespace-nowrap border-t border-line-soft ${
                      TINT[Math.min(HEAT_STAPPEN, cel.heat)]
                    }`}
                  >
                    {/* Alle celtekst in text-ink, ook de subregel: in text-body zakt die op de
                        donkerste tint onder de contrasteis van 4,5:1. */}
                    <span className="block font-numeric tabular text-[15px] text-ink">
                      {eur(cel.eindwaarde)}
                    </span>
                    <span className="block font-numeric tabular text-[11px] text-ink opacity-70">
                      {variant.celSubregel(cel)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
