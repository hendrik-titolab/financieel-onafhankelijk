import { defineConfig } from 'vitest/config'

// De rekenkern wordt als TypeScript geleverd en moet dus mee door de transformatie.
export default defineConfig({
  test: { server: { deps: { inline: ['rekenkern'] } } },
})
