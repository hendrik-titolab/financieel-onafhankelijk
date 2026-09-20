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
// Bevinding Hendrik, 20 september 2026: bij 1,7% stond hier "haalt dit; de meeste
// niet". Feitelijk waar, maar het leest alsof het net niet lukt, terwijl bijna geen
// enkel scenario slaagt. Vandaar een eigen tekst voor de echt lage kansen.
//
// Bij het doorvoeren daarvan bleek dezelfde regel een tweede probleem te hebben.
// De band onder de 60% liep tot 0, dus bij 55% stond er ook "de meeste niet",
// terwijl 55% juist betekent dat de meeste scenario's het wél halen. Dat was geen
// ongelukkige formulering maar een onjuiste bewering. De "1 op de N"-band loopt nu
// door tot 50%, waar hij exact uitkomt op 1 op de 2.
export function slagingskansOordeel(value: number): string {
  if (value >= 80) return 'van de 2.000 scenario’s haalt dit'
  if (value >= 50) {
    const opDeN = Math.round(100 / (100 - value))
    return `haalt dit; 1 op de ${opDeN} niet`
  }
  // 10 tot 50%: de meerderheid faalt (50,1% tot 90%), dus "de meeste niet" klopt hier.
  if (value >= 10) return 'haalt dit; de meeste niet'
  return 'haalt dit; de kans is zeer klein'
}
