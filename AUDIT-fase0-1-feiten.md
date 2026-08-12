# Audit 2026-08 — Fase 0 en Fase 1: baseline en codeverificatie

> Uitvoering van `PROMPT-sonnet-sessie-1.md` §5. Alleen lezen en citeren, geen fiscale duiding,
> geen bugs gerepareerd. Branch `audit-2026-08`.

---

## Fase 0 — baseline

- **Commit-hash bij aftakken:** `36adbe3e2ae6dfe38acb9484ae04aaebc2028fee` (astro-migratie,
  "Hand-off: bug-fix campagne voor morgen", 2026-08-11 23:03:31 +0200).
- **`npm run build`:** schoon. 24 pagina's gebouwd in 9,86s. Eén waarschuwing (informatief, geen
  fout): sommige chunks zijn na minificatie groter dan 500 kB (vite-advies over dynamic import/
  code-splitting) — buiten scope van deze audit, niet als bevinding meegenomen.
- **`npm i -D @astrojs/check`:** 72 packages toegevoegd. `npm audit` meldt 2 "moderate severity"
  kwetsbaarheden in de dependency-boom — niet onderzocht, buiten scope (geen dependency-upgrades
  deze sessie behalve vitest/@astrojs/check zelf).
- **`npx astro check`:** **exit code 1, één echte fout, 24 hints.**
  - **Fout**: `src/utils/exportExcel.ts:22:33` — `Could not find a declaration file for module
    'exceljs/dist/exceljs.js'`. Dit bestond al vóór deze sessie; er was simpelweg nooit een
    typecheck in de build (`package.json` had alleen `dev`/`build`/`preview`), dus deze fout was
    onzichtbaar. Dit is zelf een datapunt voor G1: de eerste keer dat `astro check` draait, springt
    er meteen een echte fout uit.
  - **24 hints** (geen fouten, ter volledigheid): 21× `'z' is deprecated` in `src/content.config.ts`
    (Zod-versie-gerelateerd, elke schemaregel), 1× `'platform' is deprecated` in
    `src/hooks/useInstallPrompt.ts:35` (`navigator.platform`), 1× `is:inline`-hint in
    `src/layouts/BaseLayout.astro:81` (JSON-LD-script), 1× ongebruikte import `SITE` in
    `src/pages/privacy.astro:3`.
  - Geen van deze is deze sessie gerepareerd — puur vastgelegd als baseline.

---

## Fase 1 — codeverificatie

### A1 — drie kopieën van de AOW/werkgeverspensioen-onttrekkingslogica
**Bestanden:** `src/utils/pensionCalc.ts:35-50` (functie), `:199-204` (inline, yearData-lus), `:265-271` (inline, `buildIncomePhases`)

**Kopie 1 — de losse functie, `getMonthlyWithdrawal()` (regel 35-50):**
```ts
export function getMonthlyWithdrawal(
  age, desiredNetto, aowNetto, aowStartAge, employerPensionBruto, employerPensionStartAge
): number {
  const pastAow = age >= aowStartAge
  const aow = pastAow ? aowNetto : 0
  const emp = age >= employerPensionStartAge
    ? brutoToNetto(employerPensionBruto, pastAow)
    : 0
  return Math.max(0, desiredNetto - aow - emp)
}
```
Aanroepers: `requiredCapital`-lus (regel 156-159) en `monteCarlo.ts` (regel 89, 96).

**Kopie 2 — inline in de yearData-uitkeringslus (regel 197-204, binnen `calculatePension`):**
```ts
const pastAow = age >= aowStartAge
const aow = pastAow ? aowMonthlyNetto : 0
const emp = age >= employerPensionStartAge
  ? brutoToNetto(employerPension, pastAow)
  : 0
const fromCapital = Math.max(0, desiredMonthlyNetto - aow - emp)
const actualFromCapital = capital > 0 ? fromCapital : 0
```

**Kopie 3 — inline in `buildIncomePhases()` (regel 265-271):**
```ts
const pastAow = fromAge >= aowStartAge
const aow = pastAow ? aowNetto : 0
const emp = fromAge >= empStartAge
  ? brutoToNetto(employerPensionBruto, pastAow)
  : 0
const fromCapital = Math.max(0, desiredNetto - aow - emp)
```

**Zijn ze identiek?** De kernformule (`pastAow` → `aow` → `emp` → `Math.max(0, desired - aow - emp)`) is in alle drie regel-voor-regel gelijk, op variabelenamen na. **Er is één subtiel maar functioneel verschil: alleen kopie 2 heeft een extra regel** (`actualFromCapital = capital > 0 ? fromCapital : 0`) die kopie 1 en 3 niet hebben. Dat extra regel wordt gebruikt voor het weergegeven `incomeFromCapital`-veld in `yearData` (regel 212), **niet** voor de daadwerkelijke kapitaalmutatie: regel 225 (`capital = (capital + retEvent) * (1 + realPost/100) - fromCapital * 12`) gebruikt het ongeklemde `fromCapital`, niet `actualFromCapital`. Kopie 3 (`buildIncomePhases`, voedt de "Inkomen per fase"-kaarten in `ResultsPanel.tsx`) heeft geen enkele vorm van dit klem-gedrag — die toont altijd het volle `fromCapital`, ongeacht of er nog kapitaal is.

**Gevolg van dit verschil:** de jaartabel (yearData, voedt de grafiek) toont €0 "inkomen uit eigen vermogen" zodra het kapitaal op is; de fasekaarten (`incomePhases`, een aparte, niet aan `capital` gekoppelde berekening) tonen in diezelfde situatie gewoon het volle gewenste bedrag door, omdat die functie helemaal niet weet of het kapitaal al op is. Twee weergaves van in essentie dezelfde uitkomst kunnen elkaar dus tegenspreken zodra het kapitaal tijdens de uitkeringsfase opraakt.

**Status:** bevestigd (code).

---

### A5 — min/max op rendement- en volatiliteitsvelden niet gehandhaafd
**Bestand:** `src/components/PensionPlanner/InputPanel.tsx:52-87` (`NumberInput`), aanroepen op regel 305, 309, 313, 317

`NumberInput` geeft `min`/`max` door als kale HTML-attributen op het `<input>` (regel 75: `<input type="number" value={text} min={min} max={max} step={step} ...`). De twee handlers die de waarde daadwerkelijk doorgeven aan de component-state doen dat zonder enige clamping:
```ts
onChange={e => {
  setText(e.target.value)
  const parsed = parseFloat(e.target.value.replace(',', '.'))
  if (!isNaN(parsed)) onChange(parsed)     // geen Math.min/Math.max tegen de meegegeven grenzen
}}
onBlur={e => commit(e.target.value)}       // commit() (regel 65-70) vangt alleen NaN op, niet buiten-bereik
```
Concreet ingesteld op de velden waar het om gaat (`RisicoprofielSection`, regel 301-318):
- Rendement vóór pensioendatum: `step={0.5} min={0} max={20}`
- Rendement ná pensioendatum: `step={0.5} min={0} max={15}`
- Volatiliteit vóór pensioendatum: `step={1} min={0} max={40}`
- Volatiliteit ná pensioendatum: `step={1} min={0} max={30}`

**Status:** bevestigd (code). Live te bevestigen in Fase 3 (scenario A5/E6: 99% rendement, 90% volatiliteit).

---

### A8 / A9 — stille terugval op 2026-cijfers, ontbrekende jaren in de selector
**Bestand:** `src/utils/jaarruimte.ts:7-9` en `:86-88`

```ts
function getParams(year: number) {
  return JAARRUIMTE_PARAMS[year] ?? JAARRUIMTE_PARAMS[2026]
}
...
export function getAvailableYears(): number[] {
  return [2020, 2021, 2022, 2023, 2024, 2025, 2026]
}
```
`JAARRUIMTE_PARAMS` (`src/config/fiscaleParameters.ts:76-91`) bevat sleutels voor **2016 t/m 2026** (11 jaren). `getAvailableYears()` geeft er slechts 7 terug (2020-2026) — **2016, 2017, 2018 en 2019 zijn wél in de data aanwezig maar via de hoofd-jaarselector niet te kiezen.**

`getParams()` heeft geen foutafhandeling: voor elk jaar dat niet in `JAARRUIMTE_PARAMS` staat (bijv. 2015 of eerder) geeft de functie **stil** de 2026-waarden terug — geen `undefined`, geen throw, geen console-warning. De reserveringsruimte-wizard (`Jaarruimte/index.tsx`, regel 199 en 319: `min={baseYear - 11} max={baseYear - 1}`) staat bij `baseYear` 2026 jaren tot **2015** toe, wat dus onder deze stille fallback valt. Let op: dit zijn HTML `min`/`max`-attributen op een kaal `<input type="number">` (dezelfde soort niet-afgedwongen grens als bij A5), dus zelfs jaren vóór 2015 zijn te typen.

**Status:** bevestigd (code). Live te bevestigen in Fase 3 (scenario 11: jaar vóór 2016 proberen te bereiken).

---

### A14 — `stortingen`-veld: geen actieve UI-vulling, en geen localStorage-pad dat het zou kunnen laten terugkomen
**Bestanden:** `src/utils/pensionCalc.ts:116,119`, `src/utils/monteCarlo.ts:33,42`, `src/types/index.ts:44`, `src/components/PensionPlanner/index.tsx:28`, `src/components/PensionPlanner/InputPanel.tsx:330-353`

Alle voorkomens van `stortingen` in `src/` (volledige grep):
```
pensionCalc.ts:116   stortingen = [],                         (destructuring, default leeg)
pensionCalc.ts:119   const allEvents = [...lifeEvents, ...stortingen]
monteCarlo.ts:33     stortingen = [],
monteCarlo.ts:42     const allEvents = [...lifeEvents, ...stortingen]
types/index.ts:44    stortingen: Storting[]  // extra deposits (positive) or withdrawals (negative) by year
PensionPlanner/index.tsx:28   stortingen: [],                 (in DEFAULT_INPUTS)
InputPanel.tsx:341   const saved = [...(inputs.lifeEvents ?? []), ...(inputs.stortingen ?? [])].map(...)
InputPanel.tsx:351   onChange({ lifeEvents: valid, stortingen: [] })
```
`PensionPlanner/index.tsx` initialiseert **altijd** met `DEFAULT_INPUTS` (regel 41: `useState<PensionInputs>(DEFAULT_INPUTS)`), waarin `stortingen: []`. Een "sessie afsluiten" (`PensionPlannerApp.tsx`, `closeSession`) doet niets met `localStorage` — het verhoogt alleen een React-`key` om het component opnieuw te laten mounten (regel 21-26). Er is **geen enkel localStorage-lees/schrijfpad voor `PensionInputs`** (bevestigd via de volledige localStorage-grep hieronder bij J1: alleen `fp_download_count`, `fp_install_banner_dismissed` en `jaarruimte_berekeningen` — geen van drieën bevat `PensionInputs`/`stortingen`).

**Conclusie:** de migratie-achtige code op regel 341 (die oude `stortingen` samenvoegt met `lifeEvents` bij het inladen van het formulier) heeft binnen de huidige site **geen enkel bereikbaar pad** waarlangs `inputs.stortingen` ooit iets anders dan `[]` zou kunnen zijn — er bestaat geen functie die een eerder opgeslagen of geïmporteerde `PensionInputs` met een gevulde `stortingen`-array aan dit component teruggeeft. Dit is dus geen actieve bug, maar wel dode/overbodige defensieve code gegeven de huidige architectuur.

**Status:** bevestigd (code).

---

### A16 — hardcoded simulatie-aantal in béide exportbestanden
**Bestanden:** `src/utils/exportExcel.ts:98`, `src/utils/exportPDF.ts:175`, `src/utils/monteCarlo.ts:4`

```ts
// monteCarlo.ts:4
const N_SIMULATIONS = 2000

// exportExcel.ts:98
['Aantal simulaties', '2000'],

// exportPDF.ts:175 (binnen de assumptions-array)
`Alle bedragen in huidig koopkracht (reëel rendement). Monte Carlo: 2.000 simulaties.`
```
Beide exportbestanden hardcoden het aantal als losse tekst, geen van beide importeert of verwijst naar `N_SIMULATIONS`. Op dit moment toevallig gelijk aan de werkelijke waarde.

**Status:** bevestigd (code) — dit raakt dus twee bestanden, niet alleen Excel.

---

### A19 — `currentIncome`: nergens in de berekening, wel in de Excel-export
**Bestanden:** `src/components/PensionPlanner/InputPanel.tsx:149-154`, `src/components/PensionPlanner/index.tsx:19-20`, `src/utils/exportExcel.ts:50-51`, `src/utils/pensionCalc.ts` (geen treffer), `src/utils/monteCarlo.ts` (geen treffer)

Volledige grep op `currentIncome` in `src/`:
```
exportExcel.ts:50    ['Huidig inkomen', inputs.currentIncome],
exportExcel.ts:51    ['Inkomenstype', inputs.currentIncomeType],
types/index.ts:33-34 currentIncome: number / currentIncomeType: IncomeType
InputPanel.tsx:149-154   (het invoerveld zelf, "Huidig inkomen")
PensionPlanner/index.tsx:19-20   currentIncome: 80000, currentIncomeType: 'bruto',  (DEFAULT_INPUTS)
```
Geen enkele treffer in `pensionCalc.ts` of `monteCarlo.ts` — het veld wordt dus nergens in `calculatePension` of `runMonteCarlo` gelezen. Het wordt wel als losse regel in het Excel-exportbestand opgenomen (`exportExcel.ts:50-51`), waar het naast berekende resultaten staat zonder enige aantekening dat het niet in de berekening is meegenomen.

**Status:** bevestigd (code). Dit stond al als bekend openstaand punt in `CLAUDE.md`, maar niet eerder als los auditpunt met dit exportgevolg genoteerd.

---

### A20 — `nettoToBruto`: geëxporteerd, geen enkele aanroeper
**Bestand:** `src/utils/pensionCalc.ts:19-27`

Volledige grep op `nettoToBruto` in `src/`: **één treffer, de definitie zelf.** Geen aanroep in `pensionCalc.ts`, `monteCarlo.ts`, enig `PensionPlanner`-bestand, of elders. Ter vergelijking: `BrutoNetto/index.tsx` heeft een eigen, volledig losstaande `nettoNaarBruto()`-implementatie (regel 93-101, binaire zoektocht) die niets importeert uit `pensionCalc.ts`.

**Status:** bevestigd (code) — dode code. Zoals de opdracht zelf al aangaf: dit is ook precies de functie die nodig zou zijn om E1 (fiscale behandeling van de vermogensonttrekking) op te lossen, mocht daarvoor gekozen worden.

---

### A3, uitgebreid — alle `eur()`-aanroepen in ResultsPanel.tsx
**Bestand:** `src/components/PensionPlanner/ResultsPanel.tsx:25-27` (de formatter), plus elke aanroep

```ts
function eur(v: number): string {
  return `€ ${Math.abs(Math.round(v)).toLocaleString('nl-NL')}`   // Math.abs ALTIJD, ongeacht context
}
```

| Regel | Waarde erin | Kan negatief worden? | Sign-aware in de UI? |
|---|---|---|---|
| 250 | `result.projectedCapital` ("Verwacht eindvermogen") | **Ja** — `capital` in `pensionCalc.ts` wordt na depletie niet geklemd (zie A2/E1: regel 225 gebruikt het ongeklemde `fromCapital`) | **Nee** — geen label of teken communiceert een tekort |
| 255 | `result.requiredCapital` ("Benodigd eindvermogen") | Nee — som van `Math.max(0, …)`-termen gedeeld door een positieve discontofactor | n.v.t. |
| 260 | `surplus` (Overschot/Tekort) | Ja | **Ja, indirect** — het label wisselt zelf tussen "Overschot" en "Tekort", dus het ontbrekende teken wordt door de labeltekst gecompenseerd |
| 266 | `result.requiredMonthlyContribution` ("Benodigde maandinleg") | In theorie ja (zie E10: `findRequiredPMT` doorzoekt vanaf `lo=-50000`), maar dit display-pad is alleen zichtbaar als `needsMoreContribution` (`> currentMonthlyPMT`) waar is — bij een sterk negatieve waarde en een niet-negatieve huidige inleg is die voorwaarde vrijwel nooit waar, dus in de praktijk zeldzaam bereikbaar | Nee |
| 276, 347 | `result.desiredMonthlyNetto` | Alleen bij handmatig negatief ingevoerd gewenst netto-inkomen (veld heeft geen afgedwongen ondergrens, zie A5-patroon) | Nee, maar zeer onwaarschijnlijk invoerscenario |
| 289, 300 | `phase.total` / `row.value` (inkomen per fase) | Bij normale invoer niet: elke term is zelf al `Math.max(0, …)` of een niet-negatief pensioenbedrag | n.v.t. |
| 317 | `result.surplusAtEnd` (Restkapitaal) | Ja | **Ja, expliciet** — enige plek met een handmatige `−`-workaround: `surplusAtEnd >= 0 ? eur(...) : `−${eur(Math.abs(...))}`` |
| 359 | `nominal` (nominale koopkracht-mijlpalen) | Bij normale invoer niet | n.v.t. |

**Kernbevinding:** regel 250 is de enige plek waar een realistisch-bereikbare negatieve waarde zonder enige tekstuele of teken-aanduiding wordt getoond. De code kent dit patroon al als op te lossen probleem: regel 317 heeft er al een aparte, handmatige workaround voor.

**Cross-check met de exports (extra, niet expliciet gevraagd maar relevant voor het bepalen van de omvang van een latere fix):**
- `exportExcel.ts:94` clamt `requiredMonthlyContribution` al wél: `eur(Math.max(0, result.requiredMonthlyContribution))` — de Excel-export heeft dit randgeval dus al afgedekt.
- `exportPDF.ts` heeft een **eigen, andere** `eur()`-implementatie (regel 3-5: alleen `Math.round`, **geen** `Math.abs`). Daardoor toont de PDF-export `result.projectedCapital` (regel 47) mét het juiste teken als het negatief is — de PDF heeft dus niet dezelfde bug als het scherm. Voor de surplus/tekort-metriek doet de PDF wél bewust `eur(Math.abs(surplus))` (regel 49) met een tone/label die het teken communiceert — exact hetzelfde patroon als regel 260/317 in `ResultsPanel.tsx`. Met andere woorden: het "juiste" patroon (abs + sign-communicerend label, alleen daar waar dat past) bestaat al elders in de codebase, alleen niet consistent toegepast in `ResultsPanel.tsx`'s eigen `eur()`-helper, die voor **alle** aanroepen hetzelfde ongeclausuleerde gedrag heeft.

**Status:** bevestigd (code). Live bewijs volgt in Fase 3 (scenario 1: −€200.000 in 2030).

---

### E9 — handmatig rekenvoorbeeld: twee disconteringsconventies naast elkaar
**Bestanden:** `src/utils/pensionCalc.ts:150-161` (halfjaar-conventie, `requiredCapital`), `:223-225` (eind-jaar-conventie, daadwerkelijke simulatie)

**Uitgangspunten:** uitkeringsfase van 25 jaar, reëel rendement 2%, onttrekking €12.000/jaar, geen tussentijdse life events.

**Conventie A — `pensionCalc.ts:160`** (`annualWithdrawal / Math.pow(rPostAnnual, yr + 0.5)`, halfjaar-discontering):
```
requiredCapital_A = Σ (yr=0 t/m 24) 12.000 / 1,02^(yr+0,5)
```
**Conventie B — wat de jaar-voor-jaar-simulatie op regel 225 daadwerkelijk doet** (`capital = capital × 1,02 − 12.000×1`, dus eerst het volledige jaar rendement bijschrijven, dan pas de jaaronttrekking aftrekken — standaard eindejaars-annuïteit):
```
requiredCapital_B = 12.000 × [1 − 1,02^−25] / 0,02
```

**Uitwerking, stap voor stap:**
1. `1,02^25 = 1,640606` (dus `1,02^-25 = 0,609531`)
2. Eindejaars-annuïteitfactor: `(1 − 0,609531) / 0,02 = 0,390469 / 0,02 = 19,52345`
3. `requiredCapital_B = 12.000 × 19,52345 = € 234.281,4`
4. Halfjaar-factor: `1,02^0,5 = 1,009950`
5. `requiredCapital_A = requiredCapital_B × 1,009950 = 234.281,4 × 1,009950 = € 236.612,5`

**Verschil:** `236.612,5 − 234.281,4 = € 2.331,1`, dat is **≈ 1,00%** van `requiredCapital_B`.

**Interpretatie (zuiver rekenkundig, geen fiscale duiding):** de twee KPI's die op `requiredCapital` leunen ("Benodigd eindvermogen" én, via `findRequiredPMT`, "Benodigde maandinleg") gebruiken een doel dat ongeveer 1% hoger ligt dan wat de daadwerkelijke jaar-voor-jaar-simulatie (die de grafiek en de jaartabel voedt) nodig heeft om precies op nul uit te komen. Iemand kan dus exact het getoonde "Benodigd eindvermogen" bereiken en, volgens diezelfde simulatie, aan het einde nog een klein positief restkapitaal overhouden in plaats van precies nul — het "tekort/overschot"-oordeel (KPI-raster) en de daadwerkelijke jaartabel/grafiek kunnen elkaar dus rond het omslagpunt net tegenspreken, in het voordeel van de gebruiker (het doel ligt hoger dan strikt nodig, niet lager).

Aan de opbouwkant staat een spiegelbeeldig verschil dat hier niet apart is uitgerekend maar wel al in `HANDOFF-bugfix-audit-2026-08.md` (E9) is genoteerd: `monthlyPMT * 12` wordt in `simulateAccumulation` (regel 82) pas ná de jaarlijkse rendementsfactor bijgeschreven, terwijl de inleg feitelijk maandelijks is — dus zonder rendement over de eigen inleg in het jaar zelf.

**Status:** bevestigd (rekenwerk, met tussenstappen).

---

### J1 — localStorage: wat de site opslaat vs. wat privacy.astro zegt
**Bestanden:** `src/pages/privacy.astro` (volledig gelezen), volledige grep op `localStorage` in `src/`

**Lijst 1 — wat de site daadwerkelijk in localStorage schrijft:**
| Key | Bestand | Inhoud |
|---|---|---|
| `fp_download_count` | `src/utils/downloadLimit.ts:7` | downloadteller FO-planner, PDF+Excel gecombineerd |
| `fp_install_banner_dismissed` | `src/components/PensionPlanner/ResultsPanel.tsx:12,107,445` | of de PWA-installatiebanner is weggeklikt |
| `jaarruimte_berekeningen` | `src/components/Jaarruimte/index.tsx:6,471,516,522` | opgeslagen jaarruimteberekeningen (incl. klantnaam, adviseurnaam, notities, volledige invoer + resultaat) |

**Lijst 2 — wat `privacy.astro` zegt (paragraaf "Rekentools", regel 41-58):**
- "de jaarruimtetool onthoudt eerder opgeslagen berekeningen via de lokale opslag van je browser (localStorage)" → dekt `jaarruimte_berekeningen`.
- "bij de pensioenplanner houden we lokaal in je browser (localStorage) een simpel getal bij, hoe vaak je een Excel- of PDF-bestand hebt gedownload" → dekt `fp_download_count`.
- "als je het installatiebanner … wegklikt, onthouden we dat ook lokaal in je browser" → dekt `fp_install_banner_dismissed`.
- Vercel Web Analytics wordt apart genoemd (paragraaf "Cookies en meetgegevens") als cookieloos.

**Constatering (geen juridische conclusie, puur de twee lijsten naast elkaar):** alle drie de localStorage-keys die in de code voorkomen, worden ook expliciet en specifiek benoemd in `privacy.astro`. Geen vierde key gevonden die niet genoemd wordt, en geen genoemde uitzondering die niet in de code bestaat.

**Status:** bevestigd (code + tekst).

---

### A7, alleen intern — de drie plekken naast `JAARRUIMTE_PARAMS`
**Bestanden:** `src/utils/jaarruimte.ts:95-101`, `src/components/Jaarruimte/index.tsx:629`, `:733`, `:758`; ter vergelijking `src/config/fiscaleParameters.ts:76-91`

```ts
// jaarruimte.ts:95-101
export function getJaarruimteParamsNote(year: number): string {
  const p = getParams(year)
  const isOld = isPreWtp(year)          // isPreWtp: year < 2023
  const pct = isOld ? '13,3%' : '30%'
  const factor = isOld ? '7,44' : '6,27'
  return `Franchise €${p.franchise...} · Max inkomen €${p.maxInkomen...} · ${pct} − ${factor} × factor A`
}
```
Live gerenderd op `Jaarruimte/index.tsx:758` (`<InfoBox>{getJaarruimteParamsNote(inputs.year)}</InfoBox>`) — dit is dus geen ongebruikte functie.

```ts
// Jaarruimte/index.tsx:629 (alleen zichtbaar bij pensioenType 'db')
{isPreWtp(inputs.year) ? ' Formule: 13,3% × grondslag − 7,44 × factor A.' : ' Formule: 30% × grondslag − 6,27 × factor A.'}

// Jaarruimte/index.tsx:733 (ResultRow "Jaarruimte", altijd zichtbaar, ongeacht jaar én pensioenType)
sub="30% × (inkomen − franchise) − 6,27 × factor A"
```

**Waarden uit `JAARRUIMTE_PARAMS` (fiscaleParameters.ts:76-91) ernaast:**
| Jaar | `percentage` in data | `factorMultiplier` in data | Wat de drie tekstplekken tonen |
|---|---|---|---|
| 2016 | 0,133 (13,3%) | 6,50 | regel 95-101/629: "13,3% − 7,44"; regel 733: "30% − 6,27" |
| 2017 | 0,138 (**13,8%**) | 6,50 | idem — toont "13,3%", niet "13,8%" |
| 2018 | 0,133 | 6,50 | idem |
| 2019 | 0,133 | 6,27 | idem — factor klopt hier toevallig wel |
| 2020 | 0,133 | 6,27 | idem — factor klopt toevallig wel |
| 2021 | 0,133 | 6,27 | idem — factor klopt toevallig wel |
| 2022 | 0,133 | **7,44** | idem — dit is het enige jaar waar "7,44" overeenkomt met de data |
| 2023-2026 | 0,30 | 6,27 | regel 95-101/629: "30% − 6,27" (klopt met de data); regel 733: "30% − 6,27" (klopt, maar ook getoond bij Wtp/geen-pensioentype waar deze formule niet van toepassing is, zie hieronder) |

**Interne tegenspraak, drie soorten:**
1. Regel 95-101 en 629 hardcoden "7,44" voor **elk** jaar vóór 2023, terwijl de eigen data (`factorMultiplier`) voor die jaren 6,50 (2016-2018) of 6,27 (2019-2021) bevat — alleen 2022 komt overeen.
2. Regel 95-101 en 629 hardcoden ook "13,3%" voor elk jaar vóór 2023, terwijl 2017 in de data 13,8% heeft.
3. Regel 733 is niet-conditioneel: dezelfde tekst "30% × … − 6,27 × factor A" verschijnt ongeacht het gekozen jaar én ongeacht `pensioenType`, dus ook wanneer `pensioenType === 'wtp'` (waar de formule `− werkgeverspremie` is, geen factor A) of `pensioenType === 'geen'` (geen aftrek) — en ook wanneer het jaar vóór 2023 valt.

**Geen uitspraak over welk cijfer fiscaal juist is — alleen vastgesteld dat drie plekken in de site elkaar tegenspreken over exact dezelfde vraag.**

**Status:** bevestigd (code, interne tegenspraak). Live schermbewijs volgt in Fase 3 (jaar 2020/2021/2022 selecteren).

---

### A10, alleen intern — BrutoNetto-toelichtingsblok vs. `fiscaleParameters.ts`
**Bestanden:** `src/components/BrutoNetto/index.tsx:319-355` (toelichtingsblok, literals), `:64-71` (de daadwerkelijke `arbeidskorting()`-berekening, gebruikt wél de config), `src/config/fiscaleParameters.ts:46-52`

De berekening zelf (`arbeidskorting()`, regel 64-71) gebruikt correct `HEFFINGSKORTING_PRE_AOW.arbeidskorting` uit de centrale config. Het uitgeklapte tekstblok "Gebruikte fiscale cijfers" (regel 319-355) herhaalt dezelfde cijfers als **losse hardcoded literals**, niet als verwijzing naar `P.ak`/`P.ahk`:
```tsx
<li>Afbouw 6,510% vanaf {eur(45_593)}, nihil vanaf ± {eur(132_290)}</li>
```

**Navrekening van het afbouwpunt uit de config-waarden zelf** (`fiscaleParameters.ts:46-51`: `afbouwVanaf: 45_593, afbouwPct: 0.0651, max: 5_685`), met tussenstappen:
```
arbeidskorting = 0  wanneer:  max − afbouwPct × (inkomen − afbouwVanaf) = 0
                    5.685 − 0,0651 × (inkomen − 45.593) = 0
                    0,0651 × (inkomen − 45.593) = 5.685
                    inkomen − 45.593 = 5.685 / 0,0651 = 87.327,19
                    inkomen = 45.593 + 87.327,19 = 132.920,19
```
**Uitkomst van de navrekening op basis van de eigen config: € 132.920.** De tekst in de UI toont "± € 132.290" — een verschil van € 630. Opvallend: de cijferreeksen "29290" en "29920" bevatten dezelfde vier cijfers (1-3-2-2-9-0 vs. 1-3-2-9-2-0) in een andere volgorde — een verwisseling van de honderdtallen/duizendtallen-positie is een plausibele mechanische verklaring, maar dit is een observatie over het patroon van het verschil, geen vaststelling van de oorzaak.

**Geen uitspraak over welk cijfer fiscaal juist is — alleen vastgesteld dat de UI-tekst niet overeenkomt met wat uit de eigen config-waarden volgt.**

**Status:** bevestigd (code, interne navrekening).

---

### A21 (nieuw) — Bruto-netto-berekening niet testbaar zonder extractie
**Bestand:** `src/components/BrutoNetto/index.tsx:43-101` (`belastingSchijven`, `algemeneHeffingskorting`, `arbeidskorting`, `brutoNaarNetto`, `nettoNaarBruto`)

De volledige rekenlogica van de Bruto-netto-tool staat als losse, niet-geëxporteerde functies binnen het componentbestand zelf — geen apart `src/utils/brutoNetto.ts` zoals bij de andere drie tools. Daardoor is deze berekening niet los te importeren in een testbestand zonder het component te renderen. Extractie naar een eigen utility-module is een refactor en valt buiten de grenzen van deze sessie ("geen refactors 'omdat het netter kan'"); daarom is er **geen** `brutoNetto.golden.test.ts` — A10's navrekening (hierboven) dekt de belangrijkste cijfers wel, maar niet als geautomatiseerde regressietest.

**Status:** nieuwe bevinding, geen actie ondernomen. Genoteerd voor een eventuele latere sessie: als G1-achtige testdekking voor deze tool gewenst is, is extractie van de vier functies naar `src/utils/brutoNetto.ts` de eerste stap.


