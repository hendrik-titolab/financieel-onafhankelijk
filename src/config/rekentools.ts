/**
 * De zeven rekentools op één plek. Gelezen door de tools-hub, de 404-pagina,
 * /llms.txt en de WebApplication-structured data per toolpagina, zodat die
 * vier niet uit elkaar kunnen lopen.
 */

export interface Rekentool {
  href: string
  naam: string
  /** Korte omschrijving, ook gebruikt als description in de structured data. */
  tekst: string
}

export const HOOFDTOOL = {
  href: '/ben-ik-financieel-onafhankelijk/',
  naam: 'Rekentool financieel onafhankelijk?',
  tekst: 'Reken eenvoudig uit wat er voor jou nodig is om financieel onafhankelijk te zijn.',
  onderschrift:
    'Vul je pensioen, je vermogen, het gewenste inkomen en spaargedrag in en check met welke aannames je wilt rekenen. Je krijgt als resultaat een uitgebreide kansverdeling voor het wel of niet kunnen halen van je financiële doelen.',
} as const

export const TOOLS: (Rekentool & { label: string })[] = [
  {
    href: '/bruto-netto/',
    naam: 'Bruto-netto berekenen',
    label: 'Salaris',
    tekst:
      'Zie wat je van je brutosalaris netto overhoudt (of andersom), inclusief belastingschijven en heffingskortingen voor 2026.',
  },
  {
    href: '/tools/jaarruimte/',
    naam: 'Jaarruimte berekenen',
    label: 'Pensioen',
    tekst:
      'Bereken hoeveel je fiscaal aftrekbaar mag inleggen voor extra pensioen om een pensioentekort aan te vullen.',
  },
  {
    href: '/tools/inflatie/',
    naam: 'Inflatie & spaargeld',
    label: 'Inflatie',
    tekst:
      'Zie hoe snel inflatie de koopkracht van je spaargeld uitholt, ook als het rente oplevert.',
  },
  {
    href: '/tools/box3/',
    naam: 'Box 3 berekenen',
    label: 'Vermogen',
    tekst:
      'Bereken de belasting over je spaargeld en beleggingen, met het forfait en het tegenbewijs naast elkaar.',
  },
  {
    href: '/tools/maandelijks-beleggen/',
    naam: 'Maandelijks beleggen',
    label: 'Vermogensopbouw',
    tekst:
      'Zie wat een vaste maandelijkse inleg oplevert bij verschillende rendementen en looptijden.',
  },
  {
    href: '/tools/rente-op-rente/',
    naam: 'Rente op rente',
    label: 'Rendement',
    tekst:
      'Start met één bedrag en zie hoe snel het groeit. En hoelang duurt het voordat het bedrag verdubbelt?',
  },
]

/** Zoek een tool op pad, voor de structured data op de toolpagina zelf. */
export function rekentool(href: string): Rekentool {
  const t = [HOOFDTOOL, ...TOOLS].find((x) => x.href === href)
  if (!t) throw new Error(`Onbekende rekentool: ${href}`)
  return t
}
