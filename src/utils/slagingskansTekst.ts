// Tekst onder het percentage in de slagingskansmeter (SuccessGauge in
// ResultsPanel.tsx). Los van het component getrokken zodat de "1 op de N"-breuk
// te testen is zonder een React-render: dit project heeft geen
// component-testinfrastructuur (geen React Testing Library/jsdom), alleen
// pure functies in utils/__tests__/.
//
// Bevinding Hendrik, 16 september 2026, op de live site: bij 74,1% stond hier
// vast "1 op de 3", terwijl de faalkans daar 25,9% is, dus 1 op de 4. Dat vaste
// getal klopte alleen precies bij 66,7% (1/3 faalkans) en was voor de rest van
// de band 60-80% fout. Nu berekend uit de daadwerkelijke faalkans.
export function slagingskansOordeel(value: number): string {
  if (value >= 80) return 'van de 2.000 scenario’s haalt dit'
  if (value >= 60) {
    const opDeN = Math.round(100 / (100 - value))
    return `haalt dit; 1 op de ${opDeN} niet`
  }
  return 'haalt dit; de meeste niet'
}
