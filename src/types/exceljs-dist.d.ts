// De kant-en-klare browser-bundel van exceljs heeft geen eigen declaratiebestand.
// We hergebruiken de volledige typing van het hoofdpakket voor de default export,
// zodat exportExcel.ts type-veilig blijft zonder fs/stream-polyfills in de bundel
// te trekken (zie het commentaar in exportExcel.ts).
declare module 'exceljs/dist/exceljs.js' {
  import ExcelJS from 'exceljs'
  export default ExcelJS
}
