/**
 * Typedeclaratie voor de browserbundel van exceljs.
 *
 * exportExcel.ts importeert bewust 'exceljs/dist/exceljs.js' en niet 'exceljs':
 * de Node-hoofdingang sleept fs- en stream-polyfills de build in. Die
 * dist-ingang heeft echter geen eigen typen, waardoor `npx tsc --noEmit` faalde
 * met TS7016 terwijl `astro build` gewoon slaagde. De audit van 7 september 2026
 * wees daar terecht op: de build hield een typefout niet tegen (bevinding 24).
 *
 * De vorm komt van het hoofdpakket, dat wél typen heeft. Zo blijft de
 * Workbook-API getypeerd in plaats van `any`, en houdt de nieuwe
 * CI-releasepoort betekenis.
 */
declare module 'exceljs/dist/exceljs.js' {
  import * as ExcelJS from 'exceljs'
  export = ExcelJS
}
