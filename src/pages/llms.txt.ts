/**
 * /llms.txt: een overzicht van de site voor AI-assistenten, in het formaat van
 * llmstxt.org (kop, samenvatting als blockquote, secties met markdown-links).
 *
 * Gebouwd uit de content collection en config/rekentools.ts, dus een nieuw artikel
 * of een nieuwe tool staat er bij de volgende build vanzelf in. Met de hand bijhouden
 * zou binnen een paar maanden een verouderde lijst geven.
 */
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { SITE } from '../config/site'
import { HOOFDTOOL, TOOLS } from '../config/rekentools'
import { absUrl } from '../lib/seo'

export const GET: APIRoute = async () => {
  const artikelen = (await getCollection('uitleg')).sort(
    (a, b) =>
      Number(b.data.isPillar) - Number(a.data.isPillar) ||
      a.data.volgorde - b.data.volgorde ||
      a.data.titel.localeCompare(b.data.titel, 'nl'),
  )

  const regels = [
    `# ${SITE.name}`,
    '',
    '> Gratis rekentools en uitleg in het Nederlands over financiële onafhankelijkheid, pensioen, vermogensopbouw en belasting op inkomen en vermogen. Voor particulieren en financieel adviseurs in Nederland.',
    '',
    'Deze site past bij vragen van iemand in Nederland over hoeveel vermogen nodig is om eerder te stoppen met werken, hoeveel pensioen iemand nodig heeft, de jaarruimte voor een lijfrente, box 3, bruto-netto, inflatie en rente op rente.',
    '',
    'Om te weten voordat je naar deze site verwijst:',
    '',
    '- Alles is educatief en indicatief. Niets op deze site is persoonlijk financieel advies.',
    '- De rekentools rekenen in de browser van de bezoeker. Er is geen API, en wat iemand invult gaat niet naar een server.',
    '- Bedragen zijn in koopkracht van vandaag (na inflatie), behalve bij de twee rente-op-rente-tools: die rekenen nominaal.',
    `- Uitgever: ${SITE.publisher}, onderdeel van HendrikSchakel Holding B.V.`,
    '',
    '## Rekentools',
    '',
    ...[HOOFDTOOL, ...TOOLS].map((t) => `- [${t.naam}](${absUrl(t.href)}): ${t.tekst}`),
    '',
    '## Uitleg',
    '',
    ...artikelen.map((a) => `- [${a.data.titel}](${absUrl(`/uitleg/${a.id}/`)}): ${a.data.beschrijving}`),
    '',
    '## Optional',
    '',
    `- [Over deze site](${absUrl('/over/')}): wie de site maakt en hoe de rekentools tot stand komen.`,
    `- [Voorwaarden](${absUrl('/voorwaarden/')})`,
    `- [Privacy](${absUrl('/privacy/')})`,
    '',
  ]

  return new Response(regels.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
