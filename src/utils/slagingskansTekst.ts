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
// Hele procenten. Tot 22 september 2026 stond hier één decimaal, terwijl de
// onzekerheid van 2.000 scenario's rond een kans van 50% ongeveer 1,1 procentpunt is
// (√(0,25 / 2000)). Een decimaal suggereerde een precisie die het getal niet heeft
// (review 22 september 2026, bevinding 7).
//
// Aan de randen geen afronding naar een getal dat niet klopt: 99,6% is niet 100%,
// want er faalt nog steeds een scenario, en 0,4% is niet 0%.
export function slagingskansPercentage(value: number): string {
  if (value > 0 && value < 1) return '< 1%'
  if (value > 99 && value < 100) return '> 99%'
  return Math.round(value).toLocaleString('nl-NL') + '%'
}

// Het percentage staat er als groot getal al boven, dus deze regel herhaalt het niet:
// dan stond hetzelfde cijfer twee keer in een kaartje van een paar centimeter
// (besluit Hendrik, 20 september 2026). Wat hier staat is alleen nog wat het getal
// erboven betekent.
export const SLAGINGSKANS_LABEL = 'Kans op halen doel'
