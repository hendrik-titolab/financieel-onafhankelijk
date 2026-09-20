// Tekst onder het percentage in de slagingskansmeter (SuccessGauge in
// ResultsPanel.tsx). Los van het component getrokken zodat hij te testen is zonder
// een React-render: dit project heeft geen component-testinfrastructuur (geen React
// Testing Library/jsdom), alleen pure functies in utils/__tests__/.
//
// Geschiedenis van deze ene regel, want hij is drie keer gesneuveld op hetzelfde
// punt: er stond een interpretatie in plaats van een feit.
//
// 1. Tot 16 september 2026 stond er een vaste breuk "1 op de 3 niet" voor de hele
//    band 60-80%. Die klopte alleen precies bij 66,7%; bij 74,1% is de faalkans
//    25,9%, dus 1 op de 4 (bevinding Hendrik, op de live site).
// 2. Tot 20 september 2026 liep de band daaronder van 0 tot 60. Bij 55% stond er
//    "de meeste niet", terwijl 55% juist betekent dat de meeste scenario's het wél
//    halen. Een onjuiste bewering over precies het cijfer waar de tool om draait.
//    En bij 1,7% las "de meeste niet" alsof het net niet lukte.
// 3. Elke poging om dat met kwalificaties op te lossen ("de kans is zeer klein",
//    "klein", "50/50") liep vast op dezelfde twee bezwaren: het leest als een
//    spelfout zonder het woord scenario's erachter, en een kwalificatie is een
//    oordeel. Auditbevinding 15 (7 september 2026) had zulke oordelen juist van deze
//    meter gehaald, omdat een norm als 80% nergens onderbouwd wordt.
//
// Besluit Hendrik, 20 september 2026: gewoon schrijven hoe het is. Eén zin, hetzelfde
// over de hele schaal, zonder banden en zonder oordeel. Valt er niets meer te
// interpreteren, dan valt er ook niets meer fout te interpreteren.
//
// Nederlandse notatie, dus een komma. Het component gebruikte toFixed(1) en zette
// daarmee "14.0%" met een Engelse punt op een Nederlandse site.
export function slagingskansPercentage(value: number): string {
  return value.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

export function slagingskansTekst(value: number): string {
  return `Kans op halen doel is ${slagingskansPercentage(value)}`
}
