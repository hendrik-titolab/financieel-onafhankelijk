import { useState } from 'react'
import { Info } from 'lucide-react'
import { Matrix } from './Matrix'
import { Rekentool } from './Rekentool'
import type { VariantConfig } from './varianten'

/**
 * Eén gedeeld inlegveld voedt zowel de matrix als de rekentool. Twee losse inlegvelden op één
 * pagina is de verwarrendste optie, en zo houdt de rekentool precies drie velden: jaren, inleg
 * en rendement.
 */
export function RenteOpRenteTool({ variant }: { variant: VariantConfig }) {
  const [inleg, setInleg] = useState(variant.standaardInleg)
  const [jaren, setJaren] = useState(30)
  const [rendement, setRendement] = useState(6)

  return (
    <div className="space-y-8">
      <Matrix variant={variant} inleg={inleg} />

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-ink">Reken je eigen bedrag door</h2>
        <Rekentool
          variant={variant}
          inleg={inleg}
          onInleg={setInleg}
          jaren={jaren}
          onJaren={setJaren}
          rendement={rendement}
          onRendement={setRendement}
        />
      </section>

      <div className="flex items-start gap-2 bg-panel border border-signal rounded-[3px] px-4 py-3">
        <Info className="w-5 h-5 text-signal shrink-0 mt-0.5" />
        <div className="text-sm text-ink leading-relaxed space-y-2">
          <p>
            Alle bedragen zijn <strong>nominaal</strong>: vóór inflatie, kosten van beleggen en
            belasting in box 3. Bij 2% inflatie is € 100.000 over dertig jaar ongeveer € 55.000 aan
            koopkracht waard. Reken dat door met de{' '}
            <a href="/tools/inflatie" className="underline underline-offset-2 hover:text-data-700">
              inflatietool
            </a>{' '}
            of de{' '}
            <a href="/tools/box3/" className="underline underline-offset-2 hover:text-data-700">
              box 3-rekentool
            </a>
            .
          </p>
          <p>Rekenwijze: {variant.rekenwijze}</p>
          <p>
            Rendementen uit het verleden bieden geen garantie voor de toekomst. Deze berekening is
            educatief en indicatief, geen persoonlijk financieel advies.
          </p>
        </div>
      </div>
    </div>
  )
}
