# Sessie 1: feitenverzameling, testharnas en live tests

Dit is de werkopdracht voor sessie 1 van de bug-fix audit van benikfinancieelonafhankelijk.nl.
Het achterliggende auditplan staat in `HANDOFF-bugfix-audit-2026-08.md`. Lees dat eerst helemaal
door, plus `CLAUDE.md`. Dit document vertelt je wat jij in deze sessie wel en niet doet.

---

## 1. Wat deze sessie is

Je verzamelt feiten, je bouwt een testharnas, en je voert live tests uit. Je legt vast wat er is,
niet wat er zou moeten zijn.

**Je repareert in deze sessie geen enkele bug.** Ook niet als hij klein is, ook niet als de fix
voor de hand ligt, ook niet als je hem toevallig tegenkomt. De eigenaar beslist per item wat er
gefixt wordt, en die beslissing is nog niet genomen. Een gevonden bug schrijf je op, meer niet.

Er zijn precies drie uitzonderingen, alle drie expliciet goedgekeurd, en ze staan in stap 4.

---

## 2. Wat je expliciet niet doet

- **Geen fiscale cijfers opzoeken en geen uitspraak doen over welk fiscaal cijfer juist is.** Dat
  gebeurt in een aparte sessie met menselijke controle van elke bron. Dit is Wft-domein: een
  plausibel maar onjuist bedrag is een vergunningsrisico, geen schoonheidsfout. Je mag wel
  vastleggen dat twee plekken in het project elkaar tegenspreken. Je mag niet vastleggen welke van
  de twee gelijk heeft.
- Geen content in `src/content/uitleg/` wijzigen.
- Geen vormgeving of Tailwind-klassen wijzigen.
- Geen bestanden buiten `C:\Users\schak\financiele-planning` aanraken. De Claude Skill in
  `~/.claude/skills/jaarruimte-berekening/` blijft in deze sessie volledig buiten beeld, ook lezen
  hoeft niet.
- Niet pushen naar `astro-migratie`. Die branch deployt automatisch naar productie.
- Geen nieuwe functionaliteit, geen refactors "omdat het netter kan", geen dependency-upgrades.

Loop je tegen iets aan waarvan je denkt dat het echt nu gefixt moet worden: schrijf het op onder
"Nieuwe bevindingen" en ga door.

---

## 3. Werkwijze en oplevering

Maak eerst een branch:

```bash
git checkout astro-migratie && git pull && git checkout -b audit-2026-08
```

Al je werk gebeurt op `audit-2026-08`. Committen mag en moet, per stap. Pushen is optioneel en
alleen naar `audit-2026-08`.

Je levert vier dingen op:

| # | Bestand | Inhoud |
|---|---|---|
| 1 | `AUDIT-fase0-1-feiten.md` | Baseline en codeverificatie, met citaten |
| 2 | Testharnas | Vitest, golden-master-tests, scripts in `package.json` |
| 3 | `AUDIT-fase3-livetests.md` | Testlog met reproduceerbare scenario's |
| 4 | Slotbericht in de chat | Korte samenvatting plus alles wat je niet af kreeg |

Format voor elke bevinding, in beide documenten:

```
### <ID> — <korte titel>
**Bestand:** src/pad/bestand.ts:123
**Wat ik zie:** <citaat of exacte waarneming>
**Reproductie:** <alleen bij live tests: exacte invoer en wat er gebeurde>
**Status:** bevestigd / niet gereproduceerd / niet te testen, met reden
```

Gebruik de bestaande ID's uit `HANDOFF-bugfix-audit-2026-08.md`. Nieuwe bevindingen krijgen een
ID in dezelfde serie met een volgnummer, bijvoorbeeld A21, E13. Verzin geen nieuwe prefixen.

---

## 4. De drie toegestane codewijzigingen

Deze drie zijn goedgekeurd omdat de rekenkern anders niet testbaar is. Elk in een **eigen commit**
met een duidelijk bericht. Verder niets aanraken in die bestanden.

1. **Injecteerbare RNG.** Nieuw bestand `src/utils/rng.ts` met een deterministische generator
   (mulberry32 of vergelijkbaar) en signatuur `export function makeRng(seed: number): () => number`.
   In `src/utils/monteCarlo.ts`: `runMonteCarlo(inputs, opts?: { rng?: () => number })`, waarbij
   `opts?.rng ?? Math.random` wordt doorgegeven aan `sampleNormal`. Zonder `opts` moet het gedrag
   exact hetzelfde blijven.
2. **Injecteerbaar basisjaar.** In `src/utils/pensionCalc.ts` en `src/utils/monteCarlo.ts` wordt
   `new Date().getFullYear()` vervangen door een optionele parameter `opts?: { currentYear?: number }`
   met `?? new Date().getFullYear()` als default. Dit is bevinding E11, maar hier alleen als
   testnaad, niet als fix.
3. **Testscripts en devDependencies** in `package.json`, zie stap 6.

Alle drie zijn niet-functionele wijzigingen. Verifieer dat expliciet: nadat je ze hebt gedaan
moet `npm run build` nog schoon draaien en moet de site in de browser identiek werken.

---

## 5. Fase 0 en 1: baseline en codeverificatie

Lever op in `AUDIT-fase0-1-feiten.md`.

**Fase 0, baseline.** Noteer bovenaan het document: commit-hash van `astro-migratie` waar je vanaf
takt, uitkomst van `npm run build` (schoon of niet, met de foutmeldingen als het niet schoon is),
en de uitkomst van `npx astro check` (installeer daarvoor `@astrojs/check` als devDependency).
G2 is al opgelost: `dist/` staat in `.gitignore`, dat hoef je niet te controleren.

**Fase 1, codeverificatie.** Per item een blok in het format hierboven. Alleen lezen en citeren,
niets wijzigen.

- **A1** Leg de drie kopieën van de onttrekkingslogica letterlijk naast elkaar:
  `pensionCalc.ts:35-50` (`getMonthlyWithdrawal`), `:199-204` en `:265-271`. Citeer alle drie en
  benoem per paar of ze regel voor regel identiek zijn of subtiel verschillen. Een subtiel verschil
  is belangrijker dan de duplicatie zelf.
- **A5** Bevestig dat de min/max op de rendement- en volatiliteitsvelden niet gehandhaafd wordt.
  Zoek `NumberInput` op in `src/components/PensionPlanner/InputPanel.tsx` en citeer de plek waar
  min en max wel als prop meegaan maar niet in de waarde worden afgedwongen.
- **A8 / A9** Citeer `getParams()` en `getAvailableYears()` in `src/utils/jaarruimte.ts`. Benoem
  exact welke jaren `JAARRUIMTE_PARAMS` bevat, welke `getAvailableYears()` teruggeeft, en wat
  `getParams()` doet bij een jaar dat niet bestaat.
- **A14** Zoek alle plekken waar `stortingen` voorkomt (`grep -rn "stortingen" src/`) en stel vast
  of de UI het veld nog vult. Let op: oude sessies in localStorage kunnen het veld nog bevatten,
  noteer of de laadcode daar tegen kan.
- **A16** Citeer `src/utils/exportExcel.ts:98` en `N_SIMULATIONS` in `src/utils/monteCarlo.ts:4`.
- **A19** Zoek alle voorkomens van `currentIncome`. Bevestig dat het nergens in een berekening
  wordt gebruikt en wel in de Excel-export terechtkomt. Citeer beide.
- **A20** Zoek alle aanroepen van `nettoToBruto`. Als er geen zijn: dode code, noteren.
- **A3, uitgebreid** Grep alle aanroepen van `eur(` in
  `src/components/PensionPlanner/ResultsPanel.tsx` en maak een lijstje: per aanroep de regel, welke
  waarde er in gaat, en of die waarde negatief kan worden. Dit bepaalt hoe groot de latere fix is.
- **E9** Werk één rekenvoorbeeld volledig uit met de hand. Neem een uitkeringsfase van 25 jaar bij
  2% reëel rendement en een onttrekking van €12.000 per jaar. Bereken de contante waarde met de
  conventie uit `pensionCalc.ts:160` (`yr + 0.5`) en met de conventie die de simulatie op regel 225
  feitelijk hanteert (onttrekking aan het eind van het jaar, dus `yr + 1`). Zet beide uitkomsten en
  het verschil in procenten in het document, met de tussenstappen.
- **J1** Lees `src/pages/privacy.astro` helemaal. Grep daarnaast alles wat naar localStorage
  schrijft (`grep -rn "localStorage" src/`). Maak twee lijstjes naast elkaar: wat de site
  daadwerkelijk opslaat, en wat de privacyverklaring zegt dat de site opslaat. Vermeld ook of
  Vercel Web Analytics genoemd wordt. Trek geen juridische conclusie, zet alleen de twee lijstjes
  naast elkaar.
- **A7, alleen intern** Citeer `src/utils/jaarruimte.ts:95-101`, `Jaarruimte/index.tsx:629` en
  `:733`, en zet er de bijbehorende waarden uit `JAARRUIMTE_PARAMS` naast. Rapporteer de interne
  tegenspraak. **Geen uitspraak over welk cijfer fiscaal juist is.**
- **A10, alleen intern** Citeer `BrutoNetto/index.tsx:326-345` en zet de losse literals naast de
  waarden in `src/config/fiscaleParameters.ts`. Reken het afbouwpunt van de arbeidskorting na uit
  de config-waarden en laat de tussenstappen zien. Vergelijk dat met het getal in de tekst.
  **Geen uitspraak over welk cijfer fiscaal juist is.**

---

## 6. G1: de testharnas

Dit is het belangrijkste blijvende resultaat van deze sessie. Zonder dit is elke latere fix in de
rekenkern een blinde ingreep.

**Installatie**

```bash
npm i -D vitest @astrojs/check
```

Scripts toevoegen aan `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"check": "astro check"
```

Het project gebruikt `astro/tsconfigs/strict` zonder path-aliassen en alle imports zijn relatief,
dus een `vitest.config.ts` is waarschijnlijk niet nodig. Blijkt het toch nodig, houd hem dan
minimaal en leg in het bestand uit waarom.

**Karakter van deze tests, neem dit letterlijk over als commentaarblok bovenin elk testbestand:**

```
// GOLDEN MASTER. Deze tests leggen het HUIDIGE gedrag vast, inclusief het gedrag waarvan
// in de audit van augustus 2026 is vastgesteld dat het waarschijnlijk fout is.
// Ze bewijzen NIET dat de berekening klopt. Ze bewijzen alleen dat een wijziging
// zichtbaar wordt in de diff. Als een fix een van deze waarden verandert: dat is de
// bedoeling, controleer de nieuwe waarde inhoudelijk en werk de fixture bij.
```

**Vorm.** Geen `toMatchSnapshot()`. Leg de verwachte uitkomsten vast in leesbare JSON-fixtures in
`src/utils/__tests__/__golden__/`, met bedragen afgerond op hele euro's en percentages op twee
decimalen. Reden: bij een latere fix moet een mens in de diff kunnen zien welk bedrag met hoeveel
verandert. Een opake snapshot maakt dat onmogelijk.

**Scenario's voor `calculatePension`** (`src/utils/__tests__/pensionCalc.golden.test.ts`). Gebruik
overal `currentYear: 2026` via de nieuwe testnaad, zodat de tests niet omvallen op 1 januari. Kies
zelf redelijke waarden voor de velden die hieronder niet genoemd worden en leg die vast in de
fixture.

1. **Basis.** 45 jaar, pensioen op 67, levensverwachting 90, vermogen €100.000, inleg €500 per
   maand, neutraal profiel, AOW alleenstaand, geen werkgeverspensioen.
2. **Werkgeverspensioen dat vóór de AOW-leeftijd start.** Zelfde als 1, plus €15.000 bruto
   werkgeverspensioen vanaf 65 en AOW vanaf 67. Dit raakt de fasegewijze belastingbehandeling.
3. **Negatief eenmalig bedrag in de opbouwfase.** Zelfde als 1, plus een bedrag van −€200.000 op
   kalenderjaar 2030. Dit is het scenario dat A3 moet aantonen.
4. **Negatief eenmalig bedrag ná de pensioendatum.** Zelfde als 1, plus −€100.000 op leeftijd 75.
   Leg vast wat `calculatePension` hiermee doet.
5. **Randgeval leeg.** Vermogen 0, inleg 0, verder als 1.
6. **Al gepensioneerd.** `currentAge` gelijk aan `retirementAge`, dus `yearsToRetirement` is 0.
7. **Extreem.** Leeftijd 18, levensverwachting 100.
8. **Bruto in plaats van netto gewenst inkomen.** `desiredRetirementIncomeType: 'bruto'`.

Leg per scenario vast: `projectedCapital`, `requiredCapital`, `desiredMonthlyNetto`,
`requiredMonthlyContribution`, `surplusAtEnd`, het aantal rijen in `yearData`, en de eerste en
laatste rij van `yearData` volledig. Niet de hele array, dat maakt de diff onleesbaar.

**Scenario's voor `runMonteCarlo`** (`monteCarlo.golden.test.ts`). Met `makeRng(12345)`. Neem
scenario 1 en scenario 4 uit de lijst hierboven. Leg vast: `successRate`, `successRate75`, de
lengte van `percentileData`, en de vijf percentielwaarden van de eerste, de middelste en de laatste
rij. Voeg één test toe die aantoont dat twee runs met dezelfde seed identiek zijn, want dat is de
hele reden dat de seed er is.

Scenario 4 is hier extra belangrijk: dat is het bewijs voor E7. Als `runMonteCarlo` het eenmalige
bedrag na de pensioendatum negeert en `calculatePension` niet, dan leggen deze twee testbestanden
dat verschil zwart op wit vast.

**Scenario's voor `jaarruimte.ts`** (`jaarruimte.golden.test.ts`). Per pensioentype (geen, DB, Wtp)
één berekening voor de jaren 2016, 2017, 2019, 2022, 2023 en 2026, met een inkomen van €70.000 en
een factor A van €1.500 (of het werkgeverspremie-equivalent bij Wtp). Plus beide
reserveringsruimte-modi. Leg de volledige uitkomstobjecten vast.

**Bruto-netto.** De berekening zit in `src/components/BrutoNetto/index.tsx` en is daardoor niet als
losse functie importeerbaar. **Extraheer hem niet**, dat is een refactor en die valt buiten deze
sessie. Noteer in `AUDIT-fase0-1-feiten.md` als nieuwe bevinding (bijvoorbeeld A21) dat de
bruto-nettoberekening niet testbaar is zonder extractie, en sla dit testbestand over.

**Afronden.** `npm run test` en `npm run check` moeten allebei groen zijn voor je commit. Staat er
een testfout die een echte bug blootlegt: pas de fixture aan zodat hij het huidige gedrag vastlegt,
en noteer de bug. Repareer de code niet.

---

## 7. Fase 3: live tests

Start de dev-server met de preview-tools, niet met Bash. De configuratie heet `dev` en staat op
poort 4321, maar controleer de daadwerkelijke poort in de `astro dev`-uitvoer.

Lever op in `AUDIT-fase3-livetests.md`, per test met exacte invoer en waarneming. Voeg een
screenshot toe waar iets visueel is.

**Meetruis.** De simulatie is niet deterministisch in de browser. Bij 2.000 paden is de
standaardfout van een slagingskans rond 90% ongeveer 0,7 procentpunt. Een verschil onder ongeveer
1,5 procentpunt tussen twee metingen is ruis en geen bevinding. Vermeld bij elke meting van de
slagingskans dat je hem twee keer gedraaid hebt en beide waarden.

1. **A3.** Voer scenario 3 uit stap 6 in (−€200.000 in 2030). Kijk naar de KPI "Verwacht
   eindvermogen". Wordt een negatieve uitkomst als positief bedrag getoond? Screenshot.
2. **E6.** Bouw een scenario waarin het kapitaal halverwege de uitkeringsfase opraakt (hoge
   gewenste onttrekking, laag vermogen). Noteer de getoonde slagingskans en beoordeel of die
   geloofwaardig is gegeven de grafiek.
3. **E7.** Voer −€100.000 in op leeftijd 75. Noteer de slagingskans en de bandbreedte vóór en ná
   het invoeren van dat bedrag. Verwachting op basis van de code: de deterministische lijn
   verandert wel, de bandbreedte en de slagingskans niet. Bevestig of ontkracht dat.
4. **E8.** Zet het profiel op offensief. Lees het KPI-getal "Verwacht eindvermogen" af en lees de
   p50-waarde op hetzelfde leeftijdspunt af uit de grafiek. Noteer beide en het verschil in
   procenten.
5. **E4.** Neem één bruto bedrag, bijvoorbeeld €30.000 per jaar. Haal het door `/bruto-netto` en
   noteer het netto. Voer hetzelfde bedrag in de FO-planner in als werkgeverspensioen en lees af
   welk netto de planner ervan maakt (zichtbaar in de fasenlijst). Zet de twee naast elkaar.
6. **A5.** Vul een rendement van 99% en een volatiliteit van 90% in. Wordt dat geaccepteerd? Wat
   doet de simulatie ermee? Let op onzinuitkomsten.
7. **A17.** Zoek met de hand een inleg waarbij het overschot vrijwel exact nul is. Kijk of de
   KPI's "Overschot" en "Benodigde maandinleg" elkaar dan tegenspreken.
8. **A18.** Voer vijf rijen bij "Eenmalige bedragen" in met verschillende bedragen. Verwijder de
   derde rij. Controleer twee dingen: kloppen de overgebleven bedragen nog, en springt de focus of
   de cursor naar een onverwacht veld?
9. **Robuustheid.** Leeftijd 18 met levensverwachting 100, vermogen 0, 20 rijen eenmalige bedragen.
   Let op consolefouten en op een vastlopende UI.
10. **D1 en D2, downloadlimiet.** Wis eerst `fp_download_count` uit localStorage. Download drie
    keer, gemengd PDF en Excel. Lees de key na elke download af in devtools en noteer de waarde.
    Doe een vierde poging. Noteer letterlijk wat er op het scherm gebeurt en wat er staat.
    **Het doel van de limiet is dat mensen contact opnemen.** Beoordeel expliciet: krijgt de
    gebruiker bij de vierde poging een zichtbare, klikbare route om contact op te nemen? Zo nee,
    dan is dat een bevinding, want dan doet het mechanisme niet waarvoor het bedoeld is. Open ook
    één PDF en controleer of de inhoud klopt en of de opmaak niet gebroken is.
11. **Jaarruimte.** Beide reserveringsruimte-modi, alle drie pensioentypes, opslaan en opnieuw
    laden via localStorage. Selecteer het jaar 2022 en maak een screenshot van de getoonde
    formuleregel, als bewijs voor A7. Probeer via de reserveringsruimte-wizard een jaar vóór 2016
    te bereiken (A8) en noteer of dat lukt en wat er dan gebeurt.
12. **Bruto-netto.** Loop het volledige rekenpad door met drie inkomens: €25.000, €50.000 en
    €140.000. Noteer de uitkomsten. Dat laatste bedrag ligt boven het afbouwpunt van de
    arbeidskorting, dus daar wordt A10 zichtbaar.
13. **Inflatie.** Functioneel doorlopen. Bevestig visueel de kleur van het signaalvlak (A11) met
    een screenshot en met de computed style via de javascript-tool.
14. **Alle 24 routes, lokaal.** Draai `npm run build` gevolgd door `npm run preview` en loop elke
    route langs. Noteer per route: rendert de pagina, en staan er consolefouten. Een tabel met 24
    regels volstaat, geen proza per route.
15. **Alle 24 routes, live.** Zelfde ronde op https://benikfinancieelonafhankelijk.nl. Live is de
    laatste deploy en lokaal is de huidige HEAD, dus verschillen zijn mogelijk. Noteer ze als ze er
    zijn.
16. **Mobiel.** Zet de viewport op 375 px breed en loop de FO-planner helemaal door, inclusief
    "Bereken" en de resultaatkolom. Er is recent mobiel werk gedaan aan deze pagina, dus dit is een
    reëel risicogebied. Screenshot van de resultaatkolom.
17. **C3.** Bevestig dat de FO-plannerpagina geen zichtbare H1 heeft en dat elke andere pagina die
    wel heeft.

**Overslaan:** het scroll-pijltje. Dat is al door de eigenaar zelf getest en goedgekeurd.

---

## 8. Slotbericht

Sluit af in de chat met, in deze volgorde:

1. De drie of vier zwaarste waarnemingen uit deze sessie, in gewone taal, zonder jargon.
2. Wat je niet af hebt gekregen, en waarom.
3. Alles wat je niet hebt kunnen testen, met de reden erbij. "Niet getest" is een prima uitkomst,
   "leek in orde" zonder bewijs is dat niet.
4. Nieuwe bevindingen die nog geen ID hadden.
5. De commits die je hebt gemaakt op `audit-2026-08`.

Verzin niets in. Als een test geen uitsluitsel gaf, schrijf dan op dat hij geen uitsluitsel gaf.
