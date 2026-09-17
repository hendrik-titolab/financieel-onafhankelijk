// De twee tools verschillen alleen in de formule en de labels. Alles daaromheen (de matrix, de
// drie invoervelden, de uitkomstkaart, de voetnoot) is gedeeld en staat in RenteOpRenteTool.tsx.
import {
  eindwaardeMaandinleg,
  eindwaardeEenmaligeInleg,
  matrixMaandinleg,
  matrixEenmaligeInleg,
  type Eindwaarde,
  type Matrix,
  type MatrixCel,
} from '../../utils/renteOpRente'
import { eur, maalTekst } from './format'

export interface VariantConfig {
  id: 'maandelijks' | 'eenmalig'
  bereken: (inleg: number, jaarrendement: number, jaren: number) => Eindwaarde
  bouwMatrix: (inleg: number) => Matrix
  standaardInleg: number
  maxInleg: number
  /** Label boven het inlegveld. */
  inlegLabel: string
  /** Hulpregel onder het inlegveld. */
  inlegHelp: string
  /** Toelichting boven de matrix, legt uit wat er in de cellen staat. */
  matrixUitleg: string
  /** Toegankelijke omschrijving van de tabel, alleen voor schermlezers. */
  tabelBijschrift: string
  /** Tweede regel onder een kolomkop: wat je in die looptijd in totaal inlegt. */
  kolomSubregel: (jaren: number, inleg: number) => string
  /** Tweede regel in een cel. */
  celSubregel: (cel: MatrixCel) => string
  /** Label boven het grote bedrag in de uitkomstkaart. */
  uitkomstLabel: (jaren: number) => string
  /** Label van de eigen-inlegregel onder de uitkomst. */
  inlegRegelLabel: string
  /** De rekenwijze, onderaan de pagina. */
  rekenwijze: string
}

export const MAANDELIJKS: VariantConfig = {
  id: 'maandelijks',
  bereken: eindwaardeMaandinleg,
  bouwMatrix: matrixMaandinleg,
  standaardInleg: 250,
  maxInleg: 25_000,
  inlegLabel: 'Inleg per maand',
  inlegHelp: 'Elke maand hetzelfde bedrag, zonder tussentijds op te nemen.',
  matrixUitleg:
    'Per combinatie van rendement en looptijd het eindbedrag, met daaronder hoe vaak dat je eigen inleg is.',
  tabelBijschrift:
    'Eindbedrag van een vaste maandelijkse inleg, per jaarrendement (rijen) en looptijd (kolommen).',
  kolomSubregel: (jaren, inleg) => `inleg ${eur(inleg * 12 * jaren)}`,
  celSubregel: (cel) => `${maalTekst(cel.vermenigvuldiging)} de inleg`,
  uitkomstLabel: (jaren) => `Na ${jaren} jaar inleggen staat er`,
  inlegRegelLabel: 'Zelf ingelegd',
  rekenwijze:
    'De inleg gaat aan het begin van elke maand. Het opgegeven percentage is een effectief jaarrendement, waaruit een maandrendement volgt van (1 + rendement) tot de macht een twaalfde. Er wordt niets tussentijds opgenomen en de inleg gaat niet omhoog. De FO-planner op deze site rekent de jaarinleg met een jaarbenadering en komt daardoor enkele tienden van een procent lager uit.',
}

export const EENMALIG: VariantConfig = {
  id: 'eenmalig',
  bereken: eindwaardeEenmaligeInleg,
  bouwMatrix: matrixEenmaligeInleg,
  standaardInleg: 10_000,
  maxInleg: 5_000_000,
  inlegLabel: 'Eenmalige inleg',
  inlegHelp: 'Eén bedrag dat je wegzet en verder niet aanraakt.',
  matrixUitleg:
    'Per combinatie van rendement en looptijd het eindbedrag, met daaronder hoe vaak je inleg zich vermenigvuldigt.',
  tabelBijschrift:
    'Eindbedrag van een eenmalige inleg, per jaarrendement (rijen) en looptijd (kolommen).',
  kolomSubregel: () => '',
  celSubregel: (cel) => maalTekst(cel.vermenigvuldiging),
  uitkomstLabel: (jaren) => `Na ${jaren} jaar is dat`,
  inlegRegelLabel: 'Je inleg',
  rekenwijze:
    'Eindbedrag = inleg × (1 + rendement) tot de macht het aantal jaren. Er wordt niets bijgelegd of opgenomen, en het rendement is elk jaar gelijk. In werkelijkheid schommelen rendementen van jaar tot jaar, ook als het gemiddelde uitkomt op wat je hier invult.',
}
