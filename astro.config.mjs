// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import pwa from './src/integrations/pwa.mjs'

// https://astro.build/config
export default defineConfig({
  site: 'https://benikfinancieelonafhankelijk.nl',
  integrations: [react(), mdx(), sitemap(), pwa()],
  devToolbar: { enabled: false },
})
