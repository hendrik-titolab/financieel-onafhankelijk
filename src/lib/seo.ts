/**
 * SEO-helpers: bouwstenen voor structured data (schema.org / JSON-LD).
 * Wordt gebruikt door BaseLayout.astro en per-pagina.
 */
import { SITE } from '../config/site'

/** Maak een absolute URL van een pad (bijv. "/bruto-netto"). */
export function absUrl(path: string): string {
  return new URL(path, SITE.url).href
}

/** Organisatie — sitebreed. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: { '@type': 'Organization', name: SITE.publisher },
  }
}

/** Website + zoekactie — sitebreed. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'nl-NL',
  }
}

/** Artikel — voor uitleg-/contentpagina's. */
export function articleSchema(opts: {
  title: string
  description: string
  path: string
  image?: string
  datePublished?: string
  dateModified?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: absUrl(opts.path),
    image: absUrl(opts.image ?? '/og-default.png'),
    inLanguage: 'nl-NL',
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    author: { '@type': 'Organization', name: SITE.publisher },
    publisher: { '@type': 'Organization', name: SITE.publisher },
  }
}

/** FAQ — voor pagina's met een vraag-en-antwoordblok. */
export function faqSchema(items: { vraag: string; antwoord: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.vraag,
      acceptedAnswer: { '@type': 'Answer', text: i.antwoord },
    })),
  }
}

/** Kruimelpad — voor subpagina's. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  }
}

/** Lijst met items — voor hub-/overzichtspagina's (bijv. de rekentools-hub). */
export function itemListSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      url: absUrl(it.path),
    })),
  }
}
