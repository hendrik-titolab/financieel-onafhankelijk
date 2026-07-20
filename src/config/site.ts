/**
 * Site-instellingen (niet-fiscaal).
 */

// Google Formulier voor feedback/comments (publieke invul-link).
// Zolang deze leeg is ('') wordt de feedbackknop verborgen.
export const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc5UwrImnmd8r2esjEsRnTnojGRfcszEZJnFYXMkWNSykEI4A/viewform'

// ─── Merk / SEO-basis ─────────────────────────────────────────────────────────
export const SITE = {
  name: 'Ben ik financieel onafhankelijk?',
  shortName: 'BenIkFO',
  url: 'https://benikfinancieelonafhankelijk.nl',
  description:
    'Onafhankelijke uitleg en gratis rekentools over financiële onafhankelijkheid, pensioen en vermogensopbouw. Kort, begrijpelijk en voor iedereen te gebruiken.',
  publisher: 'Titolab',
  locale: 'nl_NL',
} as const
