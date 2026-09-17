# Implementatieplan WP9: belastingmotor per jaar

**Status:** afgerond. Geschreven 14 september 2026, alle zes vragen uit sectie 8
beantwoord op 16 september, zie de voortgangstabel hieronder. Fase 4 en 5 zijn met
Hendriks akkoord bewust komen te vervallen; fase 6 wacht op een echte jaargrens.

Gebaseerd op onderzoek van de rekenkern op 14 september 2026, branch `vervolg-2026-09`.
Bestand:regel-verwijzingen hieronder zijn een momentopname van die dag; controleer ze
opnieuw als er intussen aan de rekenkern is gewerkt.

---

## Voortgang (bijgewerkt 16 september 2026)

Hendrik beantwoordde op 16 september alle zes de vragen uit sectie 8: optie B, `opts`,
historisch cijfermateriaal opzoeken en toevoegen, alleen het label repareren, het
versieveld toevoegen, en opruimen pas na een jaargrens.

| Onderdeel | Staat |
|---|---|
| **Fase 1, `box3.ts`** | **Klaar** (15 september). De drie FO-plannerfuncties lezen `BOX3_JAREN[belastingjaar]`. |
| **Twee hardgecodeerde jaartallen** | **Klaar** (15 september). `P.jaar` en de startwaarde van de box 3-tool volgen `PARAMETER_JAAR`. |
| **Vraag 3, historische cijfers** | **Klaar.** 2021 tot en met 2025 opgezocht bij de Belastingdienst en toegevoegd aan `fiscale-cijfers.json`, met bron per jaar. Alleen pre-AOW, zie de afbakening hieronder. |
| **Fase 0, `FISCAAL`** | **Klaar.** Nieuw blok `belastingjaren` in de bron, generator emit `FISCAAL` met 2021 tot en met 2026. Puur additief: de platte exports en elke bestaande rekenroute bleven ongewijzigd. |
| **Fase 2, `brutoNetto.ts`** | **Klaar.** `belastingBox1()` neemt een `belastingjaar`, standaard `PARAMETER_JAAR`. Geen uitkomst veranderd. |
| **Fase 3, `jaarruimte.ts`** | **Klaar.** Het belastingvoordeel wordt geschat met het tarief van het aftrekjaar. Dit verandert wel uitkomsten, zie hieronder. `MODEL_VERSIE` naar 2026.09.4. |
| **Vraag 5, opslag** | **Klaar.** Een opgeslagen jaarruimteberekening draagt model en parameterjaar mee en toont ze. |
| **Fase 4 en 5, `pensionCalc` en `monteCarlo`** | **Bewust niet gedaan.** Hendrik ging op 16 september akkoord met het voorstel om ze te laten liggen. Zie de afweging hieronder; de notitie in `pensionCalc.ts` stond er al. |
| **Fase 6, opruimen** | **Wacht op een jaargrens**, zoals afgesproken bij vraag 6. Het platte `BOX3` wordt al nergens meer geïmporteerd. |
| **Fase 7, jaarselector bruto-netto** | **Vervalt.** Bij vraag 4 gekozen voor alleen het label; dat is klaar. |

### Wat fase 3 concreet veranderde

In de golden-fixture stond voor 2022, 2023 en 2026 hetzelfde effectieve tarief van
43,96%. Dat is het tarief van 2026, ongeacht het aftrekjaar. Alleen
`belastingVoordeel` en `belastingTariefPct` verschuiven; de jaarruimte zelf, de
reserveringsruimte en elk ander veld blijven in alle fixtures gelijk. Beide nieuwe
waarden zijn onafhankelijk nagerekend met een script zonder projectcode:

| Aftrekjaar | Voordeel oud | Voordeel nieuw | Tarief oud | Tarief nieuw |
|---|---|---|---|---|
| 2022 | € 3.342 | € 3.313 | 43,96% | 43,58% |
| 2023 | € 7.432 | € 7.274 | 43,96% | 43,02% |

### Afbakening: alleen pre-AOW historisch

`FISCAAL` dekt voor 2021 tot en met 2025 alleen de cijfers van vóór de AOW-leeftijd.
De jaarruimtetool rekent het belastingvoordeel altijd met `pastAow: false`, en de
FO-planner rekent altijd op het huidige jaar. Historische post-AOW-cijfers zouden dus
vandaag geen enkele gebruiker hebben, terwijl het er ruim honderd extra zijn die elk
een vergunningsrisico dragen. Vragen om post-AOW voor een jaar dat het niet heeft
levert een leesbare fout op, geen stille terugval.

### Waarom fase 4 en 5 beter kunnen blijven liggen

**Besloten.** Dit wijkt af van het oorspronkelijke plan; Hendrik ging op 16 september
akkoord met onderstaande afweging.

De planner heeft geen jaarkeuze in de UI en krijgt die volgens dit plan ook niet.
Hij projecteert bovendien tientallen jaren vooruit op één vast tariefanker, en er is
geen scenario waarin je daarvoor een ouder jaar zou willen kiezen: voor een
toekomstprojectie wil je altijd de meest actuele cijfers. De winst is dus nul
vandaag.

Zwaarder weegt dit. `aowNettoNaarBruto()` en `aowVakantiegeldFactor()` leunen op
`ZVW` en `AOW_*_MAAND`, en die staan niet per jaar in de bron. Een
`belastingjaar`-parameter op `calculatePension()` zou dus alleen de box 1-helft
sturen en de Zvw- en AOW-helft stil op het huidige jaar laten. Dat is precies de
halve migratie die dit plan bij `box3.ts` zelf aanwijst als probleem: het oogt
jaarbewust en is het niet. Liever geen parameter dan een parameter die de helft van
de berekening niet raakt.

Fase 4 en 5 pas oppakken als er een aanleiding is, namelijk een jaarkeuze in de
planner-UI of Zvw- en AOW-cijfers per jaar in de bron. Tot die tijd staat er in
`pensionCalc.ts`, direct boven `calculatePension()`, een notitie dat de planner
bewust op `PARAMETER_JAAR` rekent en waarom.

---

## Samenvatting

**Wat.** `belastingBox1()`, de rest van `brutoNetto.ts`, en alle fiscale constanten die
`pensionCalc.ts` en `monteCarlo.ts` gebruiken, kennen vandaag precies één belastingjaar:
wat er toevallig in `src/config/fiscaleParameters.ts` staat. Dit plan voegt een nieuwe,
jaargebonden structuur `FISCAAL[jaar]` toe (naar het voorbeeld van `BOX3_JAREN`/
`JAARRUIMTE_PARAMS`, die dit patroon al bewijzen), geeft de rekenkernfuncties een
`belastingjaar`-parameter die standaard op `PARAMETER_JAAR` valt, en zet de golden tests
om naar een expliciet bevroren 2026-snapshot.

**Waarom.** Zodra de cijfers van 2027 worden toegevoegd, verschuiven vandaag ALLE
golden-waarden tegelijk en is een berekening van vóór de jaarwisseling niet meer te
reproduceren. Twee concrete bewijzen dat dit nu al pijn doet:
- `jaarruimte.ts:203-208` waarschuwt de gebruiker al expliciet dat het geschatte
  belastingvoordeel "rekent met de schijven en heffingskortingen van {PARAMETER_JAAR}",
  ook als de gebruiker een ander aftrekjaar heeft gekozen, precies omdat `belastingBox1()`
  geen jaar kent.
- `box3.ts` oogt als het bewezen patroon, maar is dat maar voor de helft: `box3Forfait()`/
  `box3Vergelijking()` gebruiken terecht `BOX3_JAREN[invoer.jaar]`, terwijl de drie
  functies die de FO-planner en Monte Carlo voeden (`box3HeffingPerJaar`,
  `geschatteBox3Druk`, `box3DrukAfgerond`) nog altijd het platte, jaarloze `BOX3`-object
  gebruiken (`box3.ts:33-44`).

**Hoe groot.** Geen kleine klus. Raakt 5 bestanden in de rekenkern van deze repo, 1-2
bestanden in de aparte `fiscale-bron`-repo, 5 testbestanden met samen ~100+ aanroepen
zonder jaar, en minstens 15-18 functiesignaturen. Realistische inschatting: **5 tot 7
losse bouwmomenten**, eventueel te bundelen tot 3-4 langere sessies (zie sectie 7). Het
plan is zo gefaseerd dat elke fase op zichzelf een groene, deploybare staat oplevert.

---

## 1. Onderzoeksbevindingen

### 1.1 `src/config/fiscaleParameters.ts`: wat is wel/niet jaargebonden

| Export | Jaargebonden? | Regels |
|---|---|---|
| `BOX1_PRE_AOW`, `BOX1_POST_AOW` | Nee: plat object | `:18-24`, `:26-32` |
| `HEFFINGSKORTING_PRE_AOW`, `HEFFINGSKORTING_POST_AOW` | Nee: plat object | `:35-49`, `:55-76` |
| `ZVW` | Nee: plat object | `:80-84` |
| `BOX3` | Nee: plat object, hoewel de generator hem al afleidt uit `jaren[belastingjaar]` (zie 1.2) | `:91-102` |
| `BOX3_TOEREKENING` | Nee, maar dit is een **afrondingsmethodiek**, geen tarief (zie aanbeveling hieronder) | `:131-134` |
| `LIJFRENTE` | Nee: plat object | `:140-143` |
| `AOW_NETTO_MAAND`, `AOW_BRUTO_MAAND`, `AOW_VAKANTIEGELD_BRUTO_MAAND`, `AOW_ZVW_BIJDRAGE_MAAND` | Nee: platte objecten | `:148-171` |
| `AOW_LEEFTIJD` | Nee: los getal (67). **Nergens elders in `src/` geïmporteerd**, vandaag een dode export | `:173` |
| `BOX3_JAREN` + `BOX3_JAREN_IN_TOOL` | **Ja: het bewezen patroon** | `:107-125` |
| `JAARRUIMTE_PARAMS` + `JAARRUIMTE_BELASTINGJAREN` | **Ja: het bewezen patroon** | `:200-216` |
| `RESERVERINGSRUIMTE_TERUGKIJK`, `RESERVERINGSRUIMTE_PCT_VOOR_2023` | Nee, maar dit zijn **regimegrenzen** (vóór/vanaf 2023), geen jaarlijkse cijfers | `:221-226` |

Twee exports zijn bewust buiten de migratie gehouden: `BOX3_TOEREKENING` is een
afrondingsmethodiek afgeleid uit de rekenvoorbeelden van de Belastingdienst, geen tarief
dat jaarlijks verandert; `RESERVERINGSRUIMTE_TERUGKIJK`/`_PCT_VOOR_2023` coderen een
regimeovergang (vóór/vanaf 2023), geen jaarcijfer. Een wijziging daarin is een
methodiekwijziging die sowieso code-review vraagt, niet een jaarwisseling-update.

### 1.2 `genereer.mjs`: hoe het vandaag werkt

Bestand: `C:\Users\schak\Documents\Fiscale bron\genereer.mjs` (staat vandaag nog in de
aparte repo, WP7 (verhuizing naar deze repo) is niet uitgevoerd).

- Leest `fiscale-cijfers.json`. Daarin zijn `box3.jaren` en `jaarruimte.jaren` al
  dictionaries per jaar; `box1`, `heffingskortingenPreAow`, `heffingskortingenPostAow`,
  `zvw`, `aow`, `lijfrente` zijn nog platte, single-year top-level blokken in de BRON
  zelf, niet alleen in de output.
- `tsBestand()` (`genereer.mjs:298-551`) bouwt `fiscaleParameters.ts` als één
  template-string. Belangrijk precedent: `BOX3` (het platte export) wordt al NIET met de
  hand gekopieerd, maar afgeleid met `const box3Huidig = D.box3.jaren[D.belastingjaar]`
  (`genereer.mjs:306`, sinds 14 september 2026) en vervolgens weggeschreven (`:437-448`).
  `BOX3_JAREN` zelf wordt generiek geëmit door over `Object.entries(D.box3.jaren)` te
  itereren (`:307-315`, gebruikt in `:453-455`). `JAARRUIMTE_PARAMS` volgt exact hetzelfde
  stramien (`:317-343`, gebruikt in `:533-535`).
- Dit betekent: de generator heeft **al twee keer** de precieze bouwsteen die WP9 nodig
  heeft (itereer over een per-jaar-dictionary, emit een `Record<number, X>`), en **al één
  keer** de truc om een plat "huidig-jaar"-export af te leiden van een per-jaar-dictionary
  in plaats van het apart te onderhouden.

### 1.3 `pensionCalc.ts`: afhankelijkheden

- Directe import: `AOW_NETTO_MAAND, AOW_BRUTO_MAAND, AOW_VAKANTIEGELD_BRUTO_MAAND, ZVW`
  (`pensionCalc.ts:2`).
- `AOW_NETTO_MAAND` → hergeëxporteerd als `AOW_NETTO` (`:7-10`), gebruikt als
  planner-defaults.
- `AOW_BRUTO_MAAND`/`AOW_VAKANTIEGELD_BRUTO_MAAND` → `aowVakantiegeldFactor()`
  (`:173-178`).
- `ZVW` → `aowNettoNaarBruto()` (`:148-150`) en de private `zvwBijdrage()` (`:180-183`).
- Indirecte afhankelijkheid: `nettoJaarinkomen()` (`:186-191`) roept `belastingBox1()` aan
  (uit `brutoNetto.ts`, geïmporteerd op `:3`). Dus alles wat via `nettoJaarinkomen` loopt
  (`brutoMaandNaarNettoMaand` `:215-222`, `marginaalTarief` `:233-238`, `persoonNettoInkomen`
  `:259-299`, `getIncomeBreakdown` `:309-326`) hangt transitief af van `BOX1_PRE_AOW`/
  `BOX1_POST_AOW`/`HEFFINGSKORTING_PRE_AOW`/`HEFFINGSKORTING_POST_AOW` zonder die zelf te
  importeren.
- Indirecte afhankelijkheid: `calculatePension()` roept `box3HeffingPerJaar()` aan
  (`:555-557`, uit `box3.ts:4`) → transitief afhankelijk van het platte `BOX3`.
- `calculatePension(inputs, opts?: { currentYear?: number })` (`:510`) heeft al een
  optioneel `opts`-object met een jaar erin, maar `currentYear` is het **kalenderjaar**
  voor de simulatietijdlijn (wanneer is "nu"), niet het **belastingjaar** voor de
  tarieven. Die twee mogen niet door elkaar gehaald worden, ook al staat in alle tests
  toevallig `{ currentYear: 2026 }`.

### 1.4 `monteCarlo.ts` en `brutoNetto.ts`

**`monteCarlo.ts`**: importeert `nettoNominaalRendement, box3HeffingPerJaar` uit
`box3.ts` (`:4`, afhankelijk van het platte `BOX3`) en `brutoMaandNaarNettoMaand,
getMonthlyWithdrawal, controleerLeeftijden` uit `pensionCalc.ts` (`:2`, dus alles uit 1.3
erft door). `runMonteCarlo(inputs, opts?: { rng?, currentYear? })` (`:74`) heeft hetzelfde
`opts.currentYear`-precedent en dezelfde valkuil als `calculatePension`.

**`brutoNetto.ts`**: de meest directe afhankelijkheid van alle kernbestanden. Importeert
`BOX1_PRE_AOW, BOX1_POST_AOW, HEFFINGSKORTING_PRE_AOW, HEFFINGSKORTING_POST_AOW`
rechtstreeks (`:1-4`). Twee lagen:
- De module-constante `P = { jaar: 2026, schijven: [...], ahk: ..., ak: ... }`
  (`:18-27`): **`jaar: 2026` is hier letterlijk hard getypt**, niet afgeleid van
  `PARAMETER_JAAR`. `P` wordt direct gebruikt in de UI: `src/components/BrutoNetto/index.tsx`
  toont `P.jaar` op twee plekken (titel "Bruto-netto calculator {P.jaar}", regel 38; en
  het paneel "Gebruikte fiscale cijfers {P.jaar}" met de losse schijf/AHK/
  arbeidskorting-cijfers, regels 226-255). Dit label wordt dus **stil verkeerd** zodra er
  ooit een jaarbewuste berekening naast bestaat maar dit label blijft hangen op 2026.
- `schijvenVoor(pastAow)` (`:140-147`) en `belastingBox1(brutoJaar, opties)`
  (`:158-193`, de huidige, fase-bewuste rekenmotor die overal elders wordt gebruikt)
  lezen de platte constanten pas **bij aanroep**, niet bij module-load. Dat is goed
  nieuws: dit is de plek waar een `belastingjaar`-parameter het makkelijkst ingebracht
  kan worden.
- `brutoNaarNetto()` (`:196-198`) en `nettoNaarBruto()` (`:200-208`) zijn dunne wrappers
  rond `belastingBox1()`, geen eigen logica.

### 1.5 `box3.ts` en `jaarruimte.ts`: het bewezen patroon

**`box3.ts`**: `Box3Jaar = keyof typeof BOX3_JAREN` (`:110`). `Box3Invoer.jaar: Box3Jaar`
is een **verplicht veld** op het invoerobject, geen optioneel/default parameter (`:141`).
`box3Forfait()` doet simpelweg `const p = BOX3_JAREN[invoer.jaar]` (`:196`): geen
runtime-guard nodig, want TypeScript dwingt via het `Box3Jaar`-type al af dat alleen een
bekend jaar kan worden doorgegeven. `box3Vergelijking()` leest hetzelfde patroon
(`:386`). De UI-default zit in `Box3/index.tsx:118`: `useState<Box3Jaar>(2026)`, **ook
hard getypt**, niet afgeleid van `PARAMETER_JAAR` of het laatste jaar in
`BOX3_JAREN_IN_TOOL`.

**`jaarruimte.ts`**: `getParams(year)` (`:12-20`) is een eigen, lokale lookup-helper die
een `Error` gooit bij een onbekend jaar (`year: number`, geen restrictief type:
runtime-guard in plaats van compile-time). `calculateJaarruimte(inputs: JaarruimteInputs)`
heeft `inputs.year: number` als **verplicht veld**, geen default. De aanroeper (de
wizard-component) kiest het jaar via `standaardBelastingjaar()` (`Jaarruimte/index.tsx:41-45`):
pakt `new Date().getFullYear()` als dat in `getAvailableYears()` zit, anders het hoogste
bekende jaar, een bewust gebouwde, gedocumenteerde fallback (audit-bevinding 20) die
**niet** simpelweg `PARAMETER_JAAR` gebruikt.

De duidelijkste illustratie waaróm WP9 nodig is, staat al in dit bestand:
`controleerJaarruimteInvoer()` waarschuwt expliciet zodra `inputs.year !== PARAMETER_JAAR`
(`:203-208`), omdat de twee `belastingBox1()`-aanroepen in `calculateJaarruimte()`
(`:291`, `:294`) **geen jaar kunnen meekrijgen** en dus altijd de huidige schijven
gebruiken, ongeacht welk aftrekjaar de gebruiker koos.

### 1.6 Golden tests: aanroepen zonder expliciet jaar

Zeven testbestanden, 191 `it()`-blokken in totaal; `bedrag.test.ts` (13 blokken) is
ongerelateerd (bedragformattering). Van de resterende 178:

| Bestand | `it()`-blokken | Jaar-status |
|---|---|---|
| `brutoNetto.golden.test.ts` | 13 | **Volledig impliciet**: `brutoNaarNetto()`, `nettoNaarBruto()`, `belastingBox1()` hebben vandaag geen jaarparameter om expliciet te maken |
| `pensionCalc.golden.test.ts` | 51 | `currentYear: 2026` altijd expliciet (kalenderjaar), belastingjaar bestaat niet als concept |
| `monteCarlo.golden.test.ts` | 15 | Zelfde als hierboven |
| `box3.test.ts` | 68 | Gemengd: `box3Forfait`/`box3Vergelijking`-tests geven `jaar` altijd expliciet mee (goed patroon, geen migratie nodig); circa 17 aanroepen van `box3HeffingPerJaar`/`geschatteBox3Druk`/`box3DrukAfgerond` zijn **impliciet** (`:25-141`, `:626`, `:673`) |
| `jaarruimte.golden.test.ts` | 30 | `inputs.year` altijd expliciet, al goed op testniveau, al blijft de interne `belastingBox1`-aanroep binnen `calculateJaarruimte` impliciet |
| `jaarruimte.formuletekst.test.ts` | 1 | Expliciet, geen migratie nodig |

Kortom: vrijwel alles dat `pensionCalc.ts`, `monteCarlo.ts`, `brutoNetto.ts` of de vier
FO-planner-gerichte functies in `box3.ts` raakt, moet gemigreerd worden, niet omdat een
test een bestaand jaar-argument vergeet, maar omdat dat argument vandaag simpelweg niet
bestaat.

### 1.7 `modelVersie.ts` / `PARAMETER_JAAR`

`PARAMETER_JAAR = 2026` (`modelVersie.ts:16`) bestaat al als "huidig jaar"-pointer en
wordt vandaag al gebruikt als default/vergelijkingswaarde op vijf plekken:
`jaarruimte.ts:203`, `InputPanel.tsx:737,756`, `PensionPlanner/index.tsx:173`
(opgeslagen in `BerekeningsSet.parameterJaar`), `Jaarruimte/index.tsx:599,616,910`,
`box3.astro:12`. Dit is de logische default voor elke nieuwe `belastingjaar?`-parameter,
geen nieuwe aanname, alleen consistente toepassing van een patroon dat al bestaat.

### 1.8 Opslag zonder belastingjaar

Twee plekken bewaren een berekening; ze zitten niet in dezelfde staat:

- **`BerekeningsSet`** (FO-planner, `src/types/index.ts:367-377`): **al goed**. Bevat al
  `modelVersie: string` en `parameterJaar: number` ("Belastingjaar van de gebruikte
  fiscale parameters", `:376`), gevuld bij elke berekening
  (`PensionPlanner/index.tsx:172-173`). Dit is geen localStorage-opslag maar het object
  achter export/scherm; het probleem dat item 8 aankaart is hier al opgelost, ruim vóór
  WP9.
- **`SavedJaarruimte`** (`src/types/index.ts:343-352`, localStorage-persistent,
  `Jaarruimte/index.tsx:563-576`): **niet goed**. Bevat wel `year` (het aftrekjaar dat
  de gebruiker koos, al reproduceerbaar voor franchise/percentage), maar geen veld dat
  vastlegt met welke schijven/heffingskortingen (dus welk `PARAMETER_JAAR`/
  `MODEL_VERSIE`) het opgeslagen `result.belastingVoordeel` destijds is berekend. Na een
  jaarwisseling is dus niet meer te zien waaróm een oud opgeslagen belastingvoordeel een
  bepaald bedrag toont. Het bestand heeft al een gevestigd migratiepatroon voor precies
  dit soort gevallen: de `useEffect` bij het laden (`:511-543`) vult ontbrekende velden
  van oudere opslagformaten aan met `??`-fallbacks. Een nieuw optioneel veld toevoegen
  past in dat patroon.

---

## 2. Doelstructuur

### Voorstel

```ts
export interface FiscaalJaar {
  box1PreAow: { schijf1Grens: number; schijf2Grens: number; schijf1Tarief: number; schijf2Tarief: number; schijf3Tarief: number }
  box1PostAow: { /* zelfde vorm */ }
  heffingskortingPreAow: { algemeneHeffingskorting: {...}; arbeidskorting: {...} }
  heffingskortingPostAow: { algemeneHeffingskorting: {...}; ouderenkorting: {...}; alleenstaandeouderenkorting: number; arbeidskorting: {...} }
  zvw: { lageBijdrage: number; hogeBijdrage: number; maximumBijdrageInkomen: number }
  lijfrente: { maxJaaruitkeringTijdelijkeOudedagslijfrente: number; maxJaaruitkeringOverbruggingslijfrente: number }
  aow: { nettoMaand: {...}; brutoMaand: {...}; vakantiegeldBrutoMaand: {...}; zvwBijdrageMaand: {...}; leeftijd: number }
}

export const FISCAAL: Record<number, FiscaalJaar> = {
  2026: { /* ... */ },
}
```

### Aanbeveling: `FISCAAL` als NIEUWE, aparte structuur naast `BOX3_JAREN`/`JAARRUIMTE_PARAMS` (niet samenvoegen)

Dit is een echte ontwerpkeuze met twee opties:

**Optie A: alles samenvoegen.** `BOX3_JAREN` en `JAARRUIMTE_PARAMS` worden
`FISCAAL[jaar].box3` en `FISCAAL[jaar].jaarruimte`. Eén samenhangende structuur,
makkelijker te vinden. Nadeel: dwingt een naam/pad-wijziging af in `box3.ts` en
`jaarruimte.ts`, de twee bestanden die vandaag **al correct en getest** zijn (box3 tegen
de vijf gepubliceerde Belastingdienst-voorbeelden, jaarruimte tegen 30 golden tests). Dat
vergroot de kans op een regressie in precies het deel dat al goed staat, zonder dat er
een bug wordt opgelost.

**Optie B: `FISCAAL` als aparte, vierde structuur (aanbeveling).** `FISCAAL[jaar]` dekt
alleen de groepen die vandaag plat zijn (box1, heffingskortingen, zvw, lijfrente, aow).
`BOX3_JAREN` en `JAARRUIMTE_PARAMS` blijven letterlijk ongewijzigd. Nadeel: drie los
benoemde per-jaar-structuren in plaats van één, een kleine ontdekbaarheidskost, maar
elke naam is zelfverklarend en al gedocumenteerd.

Aanbeveling: optie B: kleinste blast radius, nul regressierisico voor
`box3.ts`/`jaarruimte.ts`, en het is ook de letterlijke lezing van WP9's eigen tekst:
"naar het **voorbeeld van**" suggereert een sjabloon volgen, niet per se samenvoegen. Dit
is echter Hendriks keuze; zie sectie 8, vraag 1.

---

## 3. Functiesignaturen per bestand

Doorgaande conventie: een nieuwe, optionele parameter `belastingjaar?: number`, default
`PARAMETER_JAAR`. Eén gedeelde lookup-helper (nieuw, klein, **handgeschreven**, niet in
het gegenereerde `fiscaleParameters.ts`, naar het precedent van `getParams()` in
`jaarruimte.ts` dat ook niet in de config zelf staat):

```ts
// bijv. src/utils/fiscaalJaar.ts
export function getFiscaalJaar(belastingjaar: number = PARAMETER_JAAR): FiscaalJaar {
  const f = FISCAAL[belastingjaar]
  if (!f) throw new Error(`Geen fiscale parameters bekend voor ${belastingjaar}.`)
  return f
}
```

### `brutoNetto.ts`
- `schijvenVoor(pastAow, fiscaal: FiscaalJaar)`: interne helper, krijgt het
  al-opgezochte object (wordt maar één keer per aanroep opgezocht).
- `belastingBox1(brutoJaar: number, opties: BelastingOpties)` → `BelastingOpties`
  (`:127-138`) krijgt `belastingjaar?: number`. Dit is de sleutelwijziging: vrijwel alles
  hierboven loopt hierdoorheen.
- `brutoNaarNetto(brutoJaar: number, belastingjaar?: number)`,
  `nettoNaarBruto(nettoJaar: number, belastingjaar?: number)`.
- `P` (`:18-27`): blijft bestaan voor `BrutoNetto/index.tsx`, maar `P.jaar` wordt
  `PARAMETER_JAAR` in plaats van het hardgecodeerde getal 2026. Anders toont de tool
  straks een label dat niet meer klopt met wat er daadwerkelijk berekend wordt. Een
  echte jaarselector voor deze tool is een aparte, optionele stap (zie sectie 6).

### `pensionCalc.ts`
- `aowNettoNaarBruto(nettoMaand: number, belastingjaar?: number)`
- `aowVakantiegeldFactor(woonsituatie: Woonsituatie, belastingjaar?: number)`
- `nettoJaarinkomen(brutoJaar, pastAow, alleenstaand, belastingjaar?: number)`
- `brutoMaandNaarNettoMaand(brutoMaand, pastAow, alleenstaand, belastingjaar?: number)`
- `marginaalTarief(brutoJaar, pastAow, alleenstaand, belastingjaar?: number)`
- `persoonNettoInkomen(p, woonsituatie?, aowVakantiegeld?, belastingjaar?: number)`:
  vierde positionele parameter, consistent met de bestaande stijl van deze functie.
- `HuishoudInvoer` (`:112-132`) krijgt `belastingjaar?: number` als nieuw veld. Dit is
  het natuurlijke doorgeefpunt naar `getIncomeBreakdown`/`getMonthlyWithdrawal`, die al
  één invoerobject nemen.
- `calculatePension(inputs, opts?: { currentYear?: number; belastingjaar?: number })`:
  **niet** op `PensionInputs` zelf, zie sectie 8, vraag 2 voor de afweging.

### `monteCarlo.ts`
- `runMonteCarlo(inputs, opts?: { rng?; currentYear?; belastingjaar? })`: zelfde
  behandeling als `calculatePension`, om de twee synchroon te houden (ze worden vaak
  side-by-side op dezelfde invoer aangeroepen, zie `box3.test.ts:72-96`).

### `box3.ts`: subtielere wijziging dan hij lijkt
- `box3Forfait`/`box3Vergelijking`: **ongewijzigd**. Al correct.
- `box3HeffingPerJaar(vermogen, woonsituatie, belastingjaar?: number = PARAMETER_JAAR)`
  leest voortaan `BOX3_JAREN[belastingjaar]` in plaats van het platte `BOX3`, waarmee
  het platte `BOX3`-export overbodig wordt (zie fase 6). `geschatteBox3Druk`/
  `box3DrukAfgerond` erven dit door.
- **Belangrijke beperking, met opzet**: dit betekent NIET dat elke gesimuleerde
  kalenderjaar (`simulateAccumulation`/`simulateRetirementPath` in `pensionCalc.ts`
  lopen tientallen jaren vooruit, bijv. 2026 t/m 2090) een eigen jaartarief krijgt. Dat
  kán ook niet, want toekomstige box 3-tarieven zijn niet gepubliceerd. `belastingjaar`
  kiest hier alleen WELK gepubliceerd jaar als vast anker voor de hele projectie dient,
  precies zoals de code vandaag al bewust doet (zie het commentaar in
  `pensionCalc.ts:549-553` over waarom het heffingsvrije vermogen constant wordt
  verondersteld). Geen gedragswijziging, alleen een parametriseerbare keuze.
- `nettoNominaalRendement()` (`:84-90`) heeft **geen** jaar nodig: pure rekenkunde op
  al-opgegeven percentages, geen `BOX3`-afhankelijkheid.

### `jaarruimte.ts`: kleinste, laagste-risico wijziging
- `calculateJaarruimte()` heeft al `inputs.year`. De enige wijziging: de twee
  `belastingBox1(...)`-aanroepen (`:291`, `:294`) krijgen `belastingjaar: inputs.year`:
  hergebruik van een veld dat al bestaat, geen nieuw invoerveld nodig.
- **Reëel probleem hierbij**: `JAARRUIMTE_BELASTINGJAREN` biedt 2021-2026 aan; `FISCAAL`
  dekt (per WP9's eigen tekst) alleen 2026/2027. Voor `inputs.year` in 2021-2025 bestaat
  er dus geen `FISCAAL[jaar]`. Zie sectie 8, vraag 3: dit is een echte, niet-triviale
  keuze, geen implementatiedetail.

---

## 4. Generator-aanpassing (beschrijvend: andere repo, niet hier uitvoeren)

In `C:\Users\schak\Documents\Fiscale bron\`:

1. **`fiscale-cijfers.json`**: `box1`, `heffingskortingenPreAow`,
   `heffingskortingenPostAow`, `zvw`, `aow`, `lijfrente` worden per-jaar dictionaries
   (`jaren: { "2026": {...} }`), naar het voorbeeld van hoe `box3.jaren` en
   `jaarruimte.jaren` er al uitzien. Dit is een herstructurering van brondata in de
   andere repo: puur beschrijven hier, niet aanraken.
2. **`genereer.mjs` / `tsBestand()`** (`:298-551`):
   - Nieuw blok dat, net als de bestaande `box3JaarRegels`/`jaarRegels` (`:307-315`,
     `:317-343`), over de nieuwe per-jaar-dictionaries itereert en één
     `FISCAAL: Record<number, FiscaalJaar> = { ... }` plus de bijbehorende
     `FiscaalJaar`-interface emit (naar het voorbeeld van hoe `JaarruimteJaar` als
     interface wordt geëmit, `:511-531`).
   - De bestaande platte exports (`BOX1_PRE_AOW` etc.) blijven **voorlopig** bestaan,
     maar worden herschreven als directe lezingen uit `FISCAAL[D.belastingjaar]`, exact
     dezelfde truc die de generator vandaag al toepast op `BOX3`
     (`box3Huidig = D.box3.jaren[D.belastingjaar]`, `:306`). Zo kunnen de oude en nieuwe
     vorm nooit uit elkaar lopen tijdens de overgangsperiode.
   - Pas in de opruimfase (fase 6) stopt de generator met het emitten van de platte
     exports.
3. `D.belastingjaar` (in de JSON) blijft de generator-pointer voor "welk jaar is nu
   'huidig'" voor de afgeleide platte exports, en moet in de pas blijven lopen met
   `PARAMETER_JAAR` in `modelVersie.ts`: dit is vandaag al een handmatig
   synchronisatiepunt en blijft dat; het is precies waar WP8 (versiecheck in CI, al
   gebouwd op 14 september 2026) op zou moeten controleren. Geen WP9-scope, alleen een
   afhankelijkheid om te kennen.
4. **Locatie-voorbehoud**: dit plan gaat uit van de bevestigde situatie van vandaag
   (generator nog in de aparte repo). Als WP7 (verhuizing naar `fiscaal/` in deze repo)
   eerder wordt uitgevoerd, verandert alleen het pad van `genereer.mjs`. De inhoud van
   deze stap blijft identiek.

---

## 5. Golden-testmigratie

**Kernprincipe.** Een nieuwe, optionele parameter met een default die het huidige gedrag
reproduceert, is onzichtbaar voor elke bestaande aanroep die hem niet meegeeft. Dat
betekent: geen van de 178 relevante `it()`-blokken hoeft te falen zodra de signaturen
veranderen: ze blijven vanzelf identiek gedrag testen via de default.

**Maar** WP9's eigen doel is expliciet een **bevroren** 2026-snapshot, niet "blijft
toevallig werken via de default". Dus moet elke test die een fiscale functie aanroept,
`belastingjaar: 2026` (of het jaartal-equivalent) er **expliciet** bij krijgen, exact
zoals `pensionCalc.golden.test.ts` en `monteCarlo.golden.test.ts` vandaag al overal
`{ currentYear: 2026 }` expliciet meegeven in plaats van op de default
(`new Date().getFullYear()`) te vertrouwen. Geen nieuw patroon, alleen consequent
toepassen van een patroon dat al in de repo staat.

Per bestand:
- **`brutoNetto.golden.test.ts`** (13 `it`-blokken): elke `brutoNaarNetto(b)` →
  `brutoNaarNetto(b, 2026)`, elke `belastingBox1(i, {...})` → `belastingjaar: 2026`
  toevoegen aan het optie-object. Geen fixture-wijziging verwacht.
- **`box3.test.ts`**: de ~17 aanroepen van `box3HeffingPerJaar`/`geschatteBox3Druk`/
  `box3DrukAfgerond` krijgen `2026` als extra argument. De `box3Forfait`/
  `box3Vergelijking`-tests blijven ongewijzigd (al expliciet per voorbeeld).
- **`pensionCalc.golden.test.ts`** / **`monteCarlo.golden.test.ts`**: hangt af van
  sectie 8, vraag 2. Bij `opts.belastingjaar`: elke bestaande `{ currentYear: 2026 }`
  krijgt er `belastingjaar: 2026` naast. Bij een veld op `PensionInputs`: één wijziging
  in `fixtures.ts`'s `baseInputs()` (`:6-56`) dekt alle 66 tests in één keer.
- **`jaarruimte.golden.test.ts`**: waarschijnlijk geen wijziging, want `inputs.year` is
  al overal expliciet. Alleen als de aanpak voor jaren buiten `FISCAAL`'s dekking
  (vraag 3) een nieuwe waarschuwingstekst oplevert, moet de bijbehorende test (rond
  `:203-208`'s gedrag) mee.

**Harde eis, letterlijk uit WP9's eigen tekst**: dit mag **geen enkele rekenuitkomst
veranderen**. Elke waarde in `src/utils/__tests__/__golden__/*.json` blijft byte-voor-byte
gelijk. Verandert er tijdens deze migratie ooit een fixture-waarde, dan is dat een
signaal om te STOPPEN en de oorzaak te vinden, niet om de fixture bij te werken.

---

## 6. Volgorde/fasering en effect op UI

Elke fase eindigt met `npx tsc --noEmit && npx vitest run` groen, zonder
fixture-wijziging, en is los te committen. Een bouw-sessie kan na elke fase stoppen
zonder kapotte staat achter te laten.

| Fase | Wat | Risico |
|---|---|---|
| **0. Voorbereiding** | In de fiscale-bron-repo: JSON herstructureren, generator breidt uit met `FISCAAL` (naast de bestaande platte exports, die voortaan van `FISCAAL[D.belastingjaar]` worden afgeleid). Genereren, `fiscaleParameters.ts` hier committen. Op dit punt gebruikt nog niemand `FISCAAL`: alle bestaande tests moeten ongewijzigd groen blijven, zonder dat er één test is aangepast. | Laag: puur additief |
| **1. `box3.ts`** | `box3HeffingPerJaar`/`geschatteBox3Druk`/`box3DrukAfgerond` krijgen `belastingjaar`, lezen `BOX3_JAREN` i.p.v. het platte `BOX3`. ~17 testaanroepen bijwerken. | Laag: `BOX3_JAREN` bestaat en is al bewezen |
| **2. `brutoNetto.ts`** | `getFiscaalJaar()`-helper, `belastingBox1`/`brutoNaarNetto`/`nettoNaarBruto` krijgen `belastingjaar`. `P.jaar` → `PARAMETER_JAAR`. 13 testaanroepen bijwerken. | Middel: kernmotor, veel afhankelijken |
| **3. `jaarruimte.ts`** | Twee `belastingBox1`-aanroepen krijgen `belastingjaar: inputs.year`. Beslissing over jaren buiten `FISCAAL`'s dekking doorvoeren (vraag 3). | Middel: vraagt eerst een Hendrik-beslissing |
| **4. `pensionCalc.ts`** | Grootste bestand: `HuishoudInvoer`, alle in sectie 3 genoemde functies, `calculatePension`'s `opts`. 51 testaanroepen bijwerken. | Hoog: meeste code, meeste golden tests |
| **5. `monteCarlo.ts`** | `runMonteCarlo`'s `opts`. Leunt vrijwel volledig op fase 1 en 4. 15 testaanroepen bijwerken. | Laag: kleine, afgeleide wijziging |
| **6. Opruimen** | Pas als alles gemigreerd is: platte exports (`BOX1_PRE_AOW`, `HEFFINGSKORTING_*`, `ZVW`, `LIJFRENTE`, `AOW_*`, het platte `BOX3`) uit `fiscaleParameters.ts`/`genereer.mjs` verwijderen, bevestigd met een grep dat niemand ze meer importeert. | Laag, maar pas ná bewezen werking: zie vraag 6 |
| **7. UI (optioneel, apart)** | Zie hieronder. Alleen na expliciet akkoord. | N.v.t., geen verplicht onderdeel |

**Effect op UI**, per component:
- **`Box3/index.tsx`**: heeft al een jaarselector (`useState<Box3Jaar>(2026)`, `:118`).
  Niets verplicht te doen. Kleine, niet-blokkerende smell: de initiële waarde is
  hardgecodeerd `2026` in plaats van afgeleid van `PARAMETER_JAAR` of het laatste jaar in
  `BOX3_JAREN_IN_TOOL`, gratis mee te nemen als iemand toch in dit bestand zit.
- **`BrutoNetto/index.tsx`**: toont `P.jaar` letterlijk op het scherm (`:38`, `:226-255`).
  Fase 2 dwingt af dat dit label minstens meebeweegt met `PARAMETER_JAAR`. Een echte
  jaarselector zoals Box3 die heeft, is een aparte, optionele vervolgstap.
- **FO-planner (`PensionPlanner`)**: geen jaarconcept in de UI vandaag. WP9 vereist hier
  geen wijziging: de planner blijft stilzwijgend op `PARAMETER_JAAR` rekenen, precies
  zoals hij nu stilzwijgend op "vandaag" rekent voor `currentYear`.
- **Opslag**: `BerekeningsSet` (FO-planner-export) is al in orde (zie 1.8).
  `SavedJaarruimte` niet: aanbevolen een `parameterJaarBijBerekening?: number` (en evt.
  `modelVersie?: string`) veld toevoegen, gevuld bij `handleSave()`
  (`Jaarruimte/index.tsx:563-572`), met een `??`-fallback bij het laden, bouwt voort op
  het migratiepatroon dat al in dit bestand staat (`:511-543`).

---

## 7. Realistische inschatting van omvang

Dit raakt:
- **5 TS-bestanden in deze repo**: `brutoNetto.ts`, `box3.ts`, `jaarruimte.ts`,
  `pensionCalc.ts`, `monteCarlo.ts`, plus één nieuw hulpbestand (`getFiscaalJaar`).
- **1-2 bestanden in de aparte fiscale-bron-repo**: `fiscale-cijfers.json`,
  `genereer.mjs` (buiten deze planningsscope om uit te voeren).
- **Circa 15-18 publieke functiesignaturen** die een nieuwe parameter krijgen (zie
  sectie 3), plus twee interne call-sites in `jaarruimte.ts`.
- **5 testbestanden**, samen ~100+ individuele aanroepen die expliciet
  `belastingjaar: 2026` nodig hebben (exacte aantal hangt af van de opts-vs-`PensionInputs`-
  keuze in vraag 2, bij een veld op `PensionInputs` daalt dit naar één wijziging in
  `fixtures.ts` plus de aparte `brutoNetto`/`box3`-aanroepen).
- **1-2 UI-bestanden verplicht** (`P.jaar` in `BrutoNetto/index.tsx`), **2+ optioneel**
  (jaarselectors, `SavedJaarruimte`-veld).

Dit is, eerlijk gezegd, **geen "paar uurtjes"-klus**. Gegeven de vereiste discipline
(elke fase los groen, geen enkele rekenuitkomst mag verschuiven, Wft-gevoelig gebied
waar `HANDOFF-borging-2026-09.md` zelf al waarschuwt "geen fiscaal cijfer verzinnen"),
schat ik dit op **meerdere sessies**: minimaal één voor fase 0 (grotendeels in de andere
repo) en dan realistisch één sessie per resterende fase, dus in de orde van **5 tot 7
losse bouwmomenten**, eventueel samen te voegen tot 3-4 langere sessies voor iemand die
dit plan al kent. Fase 6 (opruimen) en fase 7 (UI) zijn bewust niet in die telling
meegenomen, want optioneel/later.

---

## 8. Openstaande vragen voor Hendrik

Dit plan start pas met "dan bouwen" nadat op onderstaande vragen antwoord is gegeven:
elke aanbeveling is een voorstel, geen stille aanname.

1. **Doelstructuur**: `FISCAAL` als vierde, aparte per-jaar-structuur naast
   `BOX3_JAREN`/`JAARRUIMTE_PARAMS` (optie B), of alles samenvoegen tot één structuur
   waarbij `box3.ts`/`jaarruimte.ts` ook van import veranderen (optie A)?
   **Aanbeveling: optie B**, kleinste blast radius, nul regressierisico voor de twee
   bestanden die al correct zijn.
2. **Waar hoort `belastingjaar` thuis bij `calculatePension`/`runMonteCarlo`**: in het
   bestaande `opts`-object naast `currentYear` (aanbeveling, symmetrisch met een patroon
   dat al bestaat, geen vergroting van `PensionInputs`), of als nieuw veld op
   `PensionInputs` zelf (dekt alle 66 pensionCalc/monteCarlo-tests met één wijziging in
   `fixtures.ts`, maar vergroot de vorm die ook opgeslagen/geëxporteerd wordt, terwijl er
   nog geen UI is die het veld zou zetten)? **Aanbeveling: `opts`**, met expliciete
   kanttekening in de code dat `currentYear` (kalenderjaar) en `belastingjaar`
   (tarievenjaar) twee verschillende dingen zijn.
3. **Gedrag bij een jaar buiten `FISCAAL`'s dekking**: `jaarruimte.ts` biedt 2021-2026
   aan; `FISCAAL` dekt volgens WP9's eigen tekst alleen 2026/2027. Moet
   `belastingBox1`/`getFiscaalJaar` voor 2021-2025 een Error gooien (breekt de tool voor
   5 van de 6 aangeboden jaren), stilzwijgend terugvallen op het dichtstbijzijnde bekende
   jaar, of moet er historisch cijfermateriaal voor 2021-2025 worden nagezocht en
   toegevoegd (een apart, groter onderzoekswerkje)? **Aanbeveling**: behoud een
   expliciete, versmalde waarschuwing zoals vandaag al bestaat (`jaarruimte.ts:203-208`),
   maar dan alleen voor jaren buiten `FISCAAL`'s daadwerkelijke dekking in plaats van
   voor elk jaar ongelijk aan `PARAMETER_JAAR`. Dat is strikt eerlijker dan de huidige
   tekst, zonder nieuw historisch onderzoek te vereisen.

   **Uitgezocht op 15 september 2026, zodat deze keuze op feiten rust:**

   - In `fiscale-cijfers.json` zijn `box1`, `heffingskortingenPreAow`,
     `heffingskortingenPostAow`, `zvw`, `aow` en `lijfrente` alle zes nog **platte
     blokken met alleen de cijfers van 2026**. Er is dus geen historisch materiaal dat
     alleen maar hoeft te worden omgezet: de derde optie is echt nieuw opzoekwerk.
   - Eén belastingjaar bestaat uit **58 losse getallen** in die zes blokken (box1 10,
     kortingen pre-AOW 13, kortingen post-AOW 18, zvw 3, aow 9, lijfrente 5). Voor
     2021 tot en met 2025 gaat het dus om circa **290 cijfers**, elk met bronvermelding,
     in Wft-gebied. Dat is geen bijzaak van een bouwsessie maar een eigen opdracht.
   - Hoe erg de benadering vandaag is, is deels bekend: het gecombineerde tarief in de
     eerste schijf was 35,82% in 2025 en is 35,75% in 2026, dus 0,07 procentpunt
     verschil tussen twee opeenvolgende jaren
     ([Belastingdienst, voorlopige aanslag 2026](https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen)).
     Voor 2021 t/m 2023 is dat niet nagezocht; die cijfers staan niet in de bron en
     mogen niet geschat worden. Wat de afwijking over vijf jaar oploopt is dus nog
     onbekend, en dat is zelf een argument om de waarschuwing eerlijk te houden.
   - Ter controle meegenomen: het tarief in de config (`schijf1Tarief: 0.3575`, grens
     `38_883`) komt exact overeen met wat de Belastingdienst voor 2026 publiceert.

   Dit verandert de aanbeveling niet, maar maakt wel scherp wat optie 3 kost.
4. **`P` in `brutoNetto.ts` en de Bruto-Netto-tool**: voor WP9 alleen `P.jaar` laten
   meebewegen met `PARAMETER_JAAR`, of bij deze gelegenheid ook een echte jaarselector
   bouwen (zoals Box3 al heeft)? **Aanbeveling**: alleen het label repareren nu; een
   selector is een aparte, optionele vervolgstap.
5. **`SavedJaarruimte` een jaar/versie-veld geven** zodat een heropende opgeslagen
   berekening laat zien met welke cijfers het belastingvoordeel destijds is geschat?
   **Aanbeveling: ja**, klein, goed precedent in hetzelfde bestand, maar of dit in
   dezelfde sessie als de rest van WP9 gebeurt of als eigen stapje is aan Hendrik.
6. **Wanneer de oude platte exports opruimen (fase 6)**: direct na volledige migratie,
   of bewust laten staan tot er een keer écht een jaarwisseling (met echte
   `FISCAAL[2027]`-cijfers) succesvol doorlopen is, als extra vangnet? **Aanbeveling**:
   pas opruimen ná een bewezen jaarwisseling, niet meteen na de refactor zelf.

---

### Kritieke bestanden
- `src/config/fiscaleParameters.ts`
- `src/utils/brutoNetto.ts`
- `src/utils/pensionCalc.ts`
- `src/utils/box3.ts`
- `src/utils/jaarruimte.ts`
- `C:\Users\schak\Documents\Fiscale bron\genereer.mjs` (andere repo)
- `src/utils/__tests__/fixtures.ts`
