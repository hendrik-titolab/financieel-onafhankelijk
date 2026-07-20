import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * "uitleg" — de content-collectie voor pillar- en clusterpagina's.
 * Elk artikel beantwoordt één zoekvraag (answer-first), met FAQ en bronnen.
 * Markdown-bestanden staan in src/content/uitleg/.
 */
const uitleg = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/uitleg' }),
  schema: z.object({
    // De vraag = H1 en basis voor de SEO-title
    titel: z.string(),
    // Meta description
    beschrijving: z.string(),
    // Kort antwoord bovenaan de pagina (wat zoekmachines/LLM's citeren)
    samenvatting: z.string(),
    // Slug van de pillar waaronder dit cluster valt (leeg voor de pillar zelf)
    pillar: z.string().optional(),
    isPillar: z.boolean().default(false),
    // Sorteervolgorde binnen een cluster / op de hub
    volgorde: z.number().default(0),
    // Laatst inhoudelijk gecontroleerd (ISO-datum)
    bijgewerkt: z.string(),
    // Optionele call-to-action naar een rekentool
    tool: z.object({ label: z.string(), href: z.string() }).optional(),
    // Veelgestelde vragen -> FAQPage structured data
    faq: z.array(z.object({ vraag: z.string(), antwoord: z.string() })).default([]),
    // Bronvermelding (naam + stabiele URL)
    bronnen: z.array(z.object({ titel: z.string(), url: z.string() })).default([]),
  }),
})

export const collections = { uitleg }
