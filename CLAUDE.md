# benikfinancieelonafhankelijk.nl — Projectdocumentatie

## Wat is dit?

Een Astro 7-site (SSG, statisch gebouwd) met React-eilanden voor de interactieve rekentools.
Combinatie van een kennisautoriteitssite (uitlegartikelen) en zeven rekentools, gericht op zowel
breed publiek als financieel adviseurs. Staat live op https://benikfinancieelonafhankelijk.nl

**Stack:** Astro 7 + React 18 (eilanden) + TypeScript + Tailwind CSS 3
**Hosting:** Vercel (automatisch deploy bij git push naar **`astro-migratie`**)
**Repo:** https://github.com/hendrik-titolab/financieel-onafhankelijk
**Lokaal:** `C:\Users\schak\financiele-planning`

**Branch, dit is belangrijk:** `astro-migratie` is sinds 10 augustus 2026 de live
productiebranch én de GitHub-default-branch. **`main` is gearchiveerd** (`ARCHIVED.md` erop) en
draait niet meer. Neem bij een nieuwe sessie nooit aan dat `main` de actuele staat is — eerst
`git branch -a` en `git log --oneline` op beide branches checken.

---

## Uitgever en juridisch

Titolab, onderdeel van HendrikSchakel Holding B.V. (KvK 51309963, btw NL823206567B01). Merk
blijft bewust subtiel: alleen de kleinste footerregel + JSON-LD, nergens prominent. **Wft-grens:
alles educatief/indicatief, nooit persoonlijk financieel advies** — geldt voor content én
UI-microcopy, onjuiste financiële informatie is hier een vergunningsrisico, geen stijlfout.

---

## Content & schrijfstijl

Alle geschreven content (uitlegartikelen, tool-teksten, microcopy) volgt **`SCHRIJFGIDS.md`**,
sectie "Websiteteksten / long read (breed publiek)": nuchter en direct, taalniveau B1-B2,
vakwoorden omschreven in gewone taal, rekenvoorbeelden als bewijs, geen harde CTA aan het eind.
**Nooit** gedachtestreepjes (em-dashes) — een komma, dubbele punt of twee losse zinnen. Geen
engagement-vraag als afsluiter, geen verkooptaal, geen "in dit artikel…".

Veertien artikelen in `src/content/uitleg/` (Content Layer API, glob-loader), drie daarvan
pillars. Elk artikel opent met een answer-first box (`samenvatting`-veld) plus een tool-CTA, sluit
af met verder-lezen/FAQ/bronnen. Twee body-formats:
- **Standaard** (`.md`): H2-secties met lopende tekst.
- **Modulair naslag** (`.mdx`): factor-blokken via het `Factor`-accordeon-component
  (`src/components/Factor.astro`), zie `wanneer-ben-je-financieel-onafhankelijk.mdx`.

---

## Vormgeving

Volledig herstijld op 11 augustus 2026 naar een eigen moodboard-palet (inktgroen `#29392E`, warm
wit, ochtendblauw, zand — weg van het generieke Tailwind-blauw). Volledige documentatie in
**`DESIGN_SYSTEM.md`** (kleurtokens, typografie, componentspecs) en **`HANDOFF-herstijling-2026.md`**
(sessiestatus, gemaakte keuzes, openstaande punten). Lees die twee bestanden voordat je iets aan
stijl of componenten wijzigt — deze sectie herhaalt de details niet.

Twee fonts naast DM Sans: **Instrument Serif** voor koppen, **Newsreader** (met tabular figures)
voor alle cijfers/bedragen/KPI-waarden. Alle drie worden **zelf gehost** sinds 8 september 2026
(`@fontsource-variable/dm-sans`, `@fontsource/instrument-serif`, `@fontsource-variable/newsreader`,
geïmporteerd in `BaseLayout.astro`). Let op de familienamen: die pakketten heten `DM Sans Variable`
en `Newsreader Variable`, en `tailwind.config.js` is daarop aangepast. Bewuste afsplitsing: Instrument Serif zelf heeft geen
tabular figures, waardoor live veranderende getallen zichtbaar sprongen — getest en met Hendrik
afgestemd.

---

## De zeven rekentools

### 1. FO-planner (hoofdtool) — `/ben-ik-financieel-onafhankelijk`
React-eiland (`client:only="react"`), component `src/components/PensionPlanner/`.
- Linkerkolom, twee tabs: **Uitgangspunten** (18 velden: leeftijd, vermogen, inkomen,
  pensioenuitkeringen, risicoprofiel) en **Eenmalige bedragen** (één samengevoegde lijst — life
  events en stortingen rekenden altijd al identiek en zijn sinds de herstijling ook in de UI
  samengevoegd, zie `HANDOFF-herstijling-2026.md` §2).
- Rechterkolom: KPI-haarlijnraster, fasenlijst, vermogensgrafiek (Monte Carlo-bandbreedte,
  Recharts), twee slagingskans-meters.
- Monte Carlo: 2.000 simulaties, draait alleen op knopdruk (niet live), Box-Muller
  normaalverdeling.
- Resultaat blijft zichtbaar bij een invoerwijziging (met een "verouderd"-badge), verdwijnt niet
  meer zoals vóór de herstijling.
- Export: PDF (`jsPDF` + `html2canvas`) en Excel (`exceljs`), max 3 gratis downloads samen
  (`localStorage`, `src/utils/downloadLimit.ts`).
- Berekeningsnaam (niet "klantnaam") bovenaan, werkt zowel voor eigen gebruik als een
  adviseursdossier.

### 2. Bruto-netto — `/bruto-netto`
React-component `src/components/BrutoNetto/`. Belastingschijven en heffingskortingen uit
`src/config/fiscaleParameters.ts`.

### 3. Jaarruimte — `/tools/jaarruimte`
React-component `src/components/Jaarruimte/`. Pensioentype-keuze (Geen/DB/Wtp), twee
reserveringsruimte-modi, berekeningen opslaan in `localStorage`.
- Correcte formule per jaar: pre-2023 13,3% × grondslag − 6,27 × factor A; 2023+ 30% × grondslag
  − 6,27 × factor A (DB) of − werkgeverspremie (Wtp). De factor is 6,27 sinds 2019 (daarvoor 6,50);
  er is geen jaar waarin hij 7,44 was, zie `jaarruimte.ts`.

### 4. Inflatie & spaargeld — `/tools/inflatie`
React-component `src/components/Inflatie/`. Reëel vs. nominaal rendement, negeert bewust box 3.
De noot onderaan verwijst sinds 8 september 2026 door naar de box 3-tool.

### 5. Box 3 — `/tools/box3`
React-component `src/components/Box3/`, rekenlogica in `src/utils/box3.ts` en niet in het
component, anders dan bij Inflatie: deze berekening moet getoetst worden en moet later door de
FO-planner te gebruiken zijn. Belastingjaren 2025 en 2026, per jaar gevoed door `BOX3_JAREN` uit
de gegenereerde config.
- Rekent het forfait en het tegenbewijs allebei uit en toont welke van de twee geldt. Alleen het
  forfait rekenen geeft iedereen met een tegenvallend rendement een te hoog bedrag.
- Twee afrondingsregels. Bij de aangifte mag elk veld op een hele euro worden afgerond in het
  voordeel van de belastingplichtige (Hendrik, 8 september 2026); welke kant dat per veld op valt
  volgt uit de vijf rekenvoorbeelden van de Belastingdienst. Bezittingen naar beneden, het
  schuldrendement naar boven omdat het van het totaal af gaat, voordeel en belasting naar beneden.
  Het aandeel bij stap 4 valt daarbuiten, dat is geen euro maar een percentage: dat wordt afgekapt
  op twee decimalen en niet afgerond. `box3.test.ts` legt alle vijf voorbeelden vast, plus de drie
  rekenvoorbeelden uit het uitlegartikel, zodat tool en artikel niet uit elkaar kunnen lopen.
- **Aan de tegenbewijskant gelden andere regels dan aan de forfaitkant**, en dat is geen slordigheid
  maar artikel 5.26, derde lid, Wet IB 2001: de schuldendrempel (artikel 5.3, derde lid, onderdeel f)
  en de vrijstelling groene beleggingen (artikel 5.13) zijn daar niet van toepassing. Pas dus nooit
  "voor de consistentie" de drempel aan beide kanten toe; er staat een toets op.
- Bewust niet meegerekend, en in de UI ook zo benoemd: de vrijstelling voor groene beleggingen en
  de bijtelling voor eigen gebruik van een tweede woning (vanaf 2026 5,06% van de WOZ-waarde).

### 6 en 7. Rente op rente — `/tools/rente-op-rente` en `/tools/maandelijks-beleggen`
Twee losse pagina's, één gedeeld React-component `src/components/RenteOpRente/`. Ze verschillen
alleen in de formule en de labels: een `VariantConfig` per tool voedt dezelfde `RenteOpRenteTool`.
Rekenlogica in `src/utils/renteOpRente.ts` en niet in het component, want twee tools delen de
formules en de uitkomsten moeten toetsbaar zijn. Zelfde criterium als bij `box3.ts`.

- Bovenaan een matrix van 5 rendementen (2, 4, 6, 8, 10%) × 8 looptijden (5 tot 50 jaar), met één
  gedeeld inlegveld dat zowel de matrix als de rekentool eronder voedt. Daaronder drie velden:
  jaren, inleg en verwacht rendement.
- **Deze twee pagina's zijn breder dan de andere vijf** (`max-w-5xl` in plaats van `max-w-2xl`).
  Anders past de matrix van negen kolommen niet en scrollt hij ook op desktop. Op mobiel scrollt
  hij wél, met de rendementskolom vastgezet.
- Hydratie met `client:load` en niet `client:only="react"`: de matrix draagt de boodschap en moet
  in de gebouwde HTML staan voor indexering. Dat kan veilig, want er zit geen `Date`,
  `localStorage` of `Math.random` in dit component.
- **Alles nominaal**, dus vóór inflatie, kosten en belasting. Dat is de enige plek op de site waar
  dat zo is; de rest rekent in reële koopkracht. Beide pagina's benoemen het in de UI.
- De maandinleg wordt exact per maand gerekend, storting aan het begin van de maand, met een
  maandrendement uit (1 + r)^(1/12) − 1. Dat wijkt **0,3013%** af van de mid-year-benadering
  × √(1+r) in `simulateAccumulation()` (`pensionCalc.ts`). Bewust: dat is een exacte berekening
  naast een gedocumenteerde benadering (auditbevinding 14), en de keuze wanneer in de maand je
  stort weegt zwaarder (0,56%) dan het verschil met de planner. `renteOpRente.test.ts` pint die
  0,3013% vast, dus het valt om zodra iemand aan een van beide kanten draait.
- De test pint ook de negen cellen van de rendementstabel uit
  `wanneer-ben-je-financieel-onafhankelijk.mdx` vast, zodat tool en artikel niet uit elkaar lopen.

### Technische details, alle tools
- Bedragen in reële koopkracht (na inflatie) tenzij expliciet "nominaal" vermeld.
- Geen server, geen database — alles client-side, hooguit `localStorage` voor
  downloadteller/opgeslagen jaarruimteberekeningen/PWA-installatiebanner-status.
- PWA geconfigureerd (`src/integrations/pwa.mjs`, eigen minimale integratie, zie het
  uitgebreide commentaar daar voor waarom niet `@vite-pwa/astro`).

---

## Deployment

### Live URL
https://benikfinancieelonafhankelijk.nl (domein via TransIP, DNS A-record → Vercel)

### Vercel
- Project: `financieel-onafhankelijk`, account `titolab`
- **Automatische deploy bij elke `git push` naar `astro-migratie`** (niet `main`)
- Web Analytics moet in het Vercel-dashboard aan staan (Project → Analytics → Enable) — code
  alleen is niet genoeg, dat is Hendriks eigen handeling
- Ik heb geen Vercel-dashboardtoegang — verifieer een deploy via een `fetch` met
  `cache: 'no-store'` op de live URL en check of de verwachte wijziging in de HTML zit (bijv.
  een nieuwe font-link), niet via het dashboard

### Lokale dev server starten
```
cd C:\Users\schak\financiele-planning
npm run dev
```
Opent op **http://localhost:4321** (of de eerstvolgende vrije poort als 4321 bezet is — check de
daadwerkelijke `astro dev`-output, ga niet blind uit van 4321). `.claude/launch.json` staat hierop
ingesteld.

### Releasepoort

`.github/workflows/controle.yml` draait bij elke push en pull request: `tsc --noEmit`,
`astro check`, `vitest run` en een productiebuild, op een vastgelegde Node-versie. Astro
compileert met esbuild en meldt typefouten niet, dus die losse `tsc`-stap is de enige die dat
wel doet. `npm audit` draait niet-blokkerend.

De workflow houdt een kapotte push niet tegen, hij maakt hem zichtbaar. Wil je dat hard maken:
zet branch protection op `astro-migratie` met deze workflow als verplichte check. Dat is een
handeling in GitHub die ik niet voor je kan doen.

`vercel.json` zet twee dingen. Ten eerste de beveiligingsheaders (CSP, X-Content-Type-Options,
Referrer-Policy, X-Frame-Options, Permissions-Policy). Ten tweede een cacheregel voor
`/_astro/*`: `public, max-age=31536000, immutable`.

Die cacheregel geldt **alleen** voor `/_astro/`, en dat is bewust. Astro geeft alles daar een
content-hash in de bestandsnaam (`dm-sans-latin-opsz-normal.Bf69Tn_J.woff2`), dus zo'n bestand
kan per definitie niet veranderen: wijzigt de inhoud, dan wijzigt de naam. Zonder deze regel
kregen die bestanden Vercels standaard `max-age=0, must-revalidate` en deed elke bezoeker bij
elk bezoek een controleronde langs alle assets, inclusief circa 211 kB aan lettertypen.

Wat er bewust buiten valt: de HTML-pagina's, `sw.js`, `manifest.webmanifest`, `robots.txt` en de
sitemaps. Die staan in de root, hebben géén hash in hun naam en moeten wél elke keer
gecontroleerd worden. Vooral `sw.js`: een permanent gecachete service worker betekent dat een
update nooit meer aankomt. Zet deze regel dus nooit op `/(.*)`. De CSP is lokaal getest tegen de productiebuild met een
testserver die die headers meestuurt: fonts, React-eiland, Monte Carlo en beide exports werken
zonder één CSP-melding. Wijzig je de CSP, test hem dan opnieuw op die manier en niet alleen op
`astro dev`, want daar gelden deze headers niet.

### Update deployen
```
cd C:\Users\schak\financiele-planning
git checkout astro-migratie
git add .
git commit -m "Omschrijving van wijziging"
git push origin astro-migratie
```
Vercel deployt automatisch. Werk bij grotere wijzigingen liever eerst op een eigen branch en merge
daarna naar `astro-migratie`, in plaats van rechtstreeks te committen — zie hoe de herstijling van
11 augustus is aangepakt (branch `herstijling-2026`) als voorbeeld.

---

## Fiscale cijfers: `fiscaleParameters.ts` is een gegenereerd bestand

**Pas `src/config/fiscaleParameters.ts` niet met de hand aan.** Het wordt gegenereerd uit
`C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json`. Een handmatige wijziging is bij de
eerstvolgende generatie weg.

Een fiscaal cijfer bijwerken gaat zo: waarde aanpassen in die json, `node genereer.mjs` draaien in
die map, en de gewijzigde config hier committen. Vercel bouwt uit deze repo en niet uit die map,
dus zonder commit verandert er live niets. Draai daarna `node controleer-artikelen.mjs` om te zien
of er bedragen in de uitlegartikelen achterlopen.

Waarom: dezelfde cijfers stonden op drie plekken en spraken elkaar aantoonbaar tegen (zie
`FISCALE-BRONNEN.md`). Waarden waar de bron van de site afwijkt houden bewust de waarde die
vandaag in gebruik is, zodat genereren nooit stilzwijgend een rekenuitkomst verandert.

## Claude Skill: Jaarruimteberekening

Locatie: `C:\Users\schak\.claude\skills\jaarruimte-berekening\`. Bevat formules voor alle
situaties, jaarlijks updatable parameters in `references/parameters.md`, verificatiestap na elke
berekening.

**Let op:** die parameters wijken af van deze site, en welke kant klopt staat nog open (bevinding
F1). De generator overschrijft ze daarom bewust niet, maar schrijft een
`verschilrapport-jaarruimte-skill.md` in de bronmap. Werk ze pas bij als F1 is beslecht.

---

## Bestandsstructuur (belangrijkste bestanden)

```
src/
├── pages/                       # Astro-routes: /, /uitleg, /tools, elke rekentool, /over, /privacy, /voorwaarden
├── content/uitleg/               # 14 artikelen (.md/.mdx), Content Layer API
├── types/index.ts                # Alle TypeScript types
├── config/
│   ├── site.ts                   # SITE-object, FEEDBACK_URL
│   ├── modelVersie.ts            # Modelversie + peildatum fiscale parameters
│   ├── fiscaleParameters.ts       # GEGENEREERD — Box 1, heffingskortingen, AOW, jaarruimte
│   └── risicoprofielen.ts         # 5 risicoprofielen
├── utils/
│   ├── pensionCalc.ts             # Kernberekeningen FO-planner
│   ├── monteCarlo.ts              # Monte Carlo-simulatie
│   ├── jaarruimte.ts              # Jaarruimteberekeningen
│   ├── bedrag.ts                  # Nederlandse bedragnotatie, één parser voor alle velden
│   ├── box3.ts                    # Kosten/vermogensbelasting op het rendement, vervangpunt
│   ├── renteOpRente.ts            # Rente op rente: eenmalig en maandelijks, plus de matrix
│   ├── exportExcel.ts / exportPDF.ts
│   └── downloadLimit.ts           # Downloadteller (localStorage)
├── components/
│   ├── Header.astro / Footer.astro / Factor.astro
│   ├── PensionPlannerApp.tsx      # Island-wrapper: berekeningsnaam, sessiebeheer
│   ├── PensionPlanner/
│   │   ├── index.tsx              # Hoofdcomponent, state, resultaat-blijft-staan-logica
│   │   ├── InputPanel.tsx         # Uitgangspunten + Eenmalige bedragen
│   │   ├── ResultsPanel.tsx       # KPI-raster, fasenlijst, meters, export
│   │   └── WealthChart.tsx        # Vermogensgrafiek (Recharts)
│   ├── BrutoNetto/index.tsx
│   ├── Inflatie/index.tsx
│   ├── Jaarruimte/index.tsx
│   └── RenteOpRente/              # Matrix + rekentool, gedeeld door beide rente-op-rente-tools
└── index.css                      # Componentklassen (.card, .input-field, .label, sliders)
```

---

## Belangrijke technische beslissingen

| Beslissing | Reden |
|---|---|
| Astro (niet React/Vite-SPA) | Server-side title/description/canonical/OG/JSON-LD per pagina, automatische sitemap — nodig voor SEO/GEO op een contentsite met 14+ artikelen |
| React-eilanden alleen voor de zeven rekentools | Rest van de site is statisch, sneller en beter indexeerbaar |
| Reëel rendement (na inflatie) | Koopkracht blijft behouden: €4.000 vandaag = €4.000 koopkracht bij pensionering |
| localStorage, geen backend | Privacy by design, geen persoonsgegevens op een server |
| Life events en stortingen samengevoegd (11 aug 2026) | Rekenden al identiek, twee gescheiden secties met een niet te raden onderscheid was verwarrend en repareerde een exportbug (stortingen kwamen nooit in Excel terecht) |
| Instrument Serif voor koppen, Newsreader voor cijfers | Instrument Serif heeft geen tabular figures, KPI's sprongen zichtbaar bij live wijzigingen |
| Vercel voor hosting | Gratis, automatische HTTPS, eenvoudig eigen domein |

---

## Externe audit, 7 september 2026

Een externe tester heeft de site doorgelicht op commit `4cc5160` en 28 bevindingen opgeleverd.
23 daarvan zijn in de code bevestigd en hersteld op branch `audit-herstel-2026-09`. Zie de
commitberichten daar: elke commit noemt het bevindingsnummer, wat er mis was en hoe de nieuwe
waarde is nagerekend.

De grootste correcties, kort:
- Het gewenste bruto pensioeninkomen ging als **maandbedrag door de jaarschijven** en kende geen
  heffingskortingen en geen Zvw. € 5.000/mnd gaf € 4.107,50 netto in plaats van € 3.612,24; het
  netto doel lag circa 14% te hoog. Er stonden twee belastingmotoren naast elkaar.
- Het benodigd vermogen was een **eindwaardeberekening**: een erfenis over vijf jaar verlaagde
  het doelbedrag vandaag zonder die vijf jaar te overbruggen. Nu een bisectie op het kleinste
  startvermogen waarbij het saldo nooit negatief wordt.
- Monte Carlo toetste **negatief vermogen alleen in de uitkeringsfase**.
- De jaartabel toonde het volle gewenste bedrag ook als de pot leeg was.
- Export kon **nieuwe invoer met een oude simulatie** mengen, en meldde 0,0% slagingskans zonder
  dat er ooit gesimuleerd was.
- De kansmeter wees 90° verkeerd.
- Reserveringsruimte telde verlopen en dubbele jaren mee; een getypt jaartal maakte het
  jaarruimtetabblad wit.

Twee bewuste afwijkingen van het auditadvies, met Hendrik afgestemd:
- **Geen maandelijkse kasstroommotor.** De inleg had al een mid-year-correctie; alleen de
  onttrekking niet. Eén wortelfactor daarop neemt 91,2% van het verschil weg (€ 211.614 tegen
  € 211.282 exact maandelijks, bij € 207.504 jaarultimo). Een maandmotor is de duurste ingreep
  met de kleinste opbrengst.
- **Geen volledig box 3-model.** Het stelsel beweegt richting heffing over werkelijk rendement.
  In plaats daarvan invoervelden voor kosten en vermogensbelasting; dat laatste veld start op een
  schatting uit de gepubliceerde parameters en beweegt mee met het opgegeven vermogen.
  `src/utils/box3.ts` benoemt zichzelf als vervangpunt; het volledige model staat op de agenda.

Bevinding 18 (Wtp-premie) is op 8 september 2026 door Hendrik beslecht: het gaat om de **totale**
premie in de werkgeversregeling, dus werkgeversdeel én eigen bijdrage. Het veld heette
`werkgeverspremie` en vroeg ook alleen daarnaar; dat gaf een te hoge jaarruimte. Hernoemd naar
`pensioenpremie`, met een migratie voor opgeslagen berekeningen.

## Bekende openstaande punten (niet opgelost, alleen genoteerd)

- Geen custom analytics-events, alleen kale paginabezoeken (Vercel Web Analytics). Onbekend
  hoeveel mensen op "Bereken" drukken of waar ze afhaken.
- `currentIncome`-veld in de FO-planner wordt ingevuld maar nergens in de berekening gebruikt,
  alleen in de Excel-export.
- De vijf datatokens uit de herstijling (`data-100/300/500/700`, `sand-deep`, zie
  `DESIGN_SYSTEM.md`) zijn zelf afgeleid en nog niet beoordeeld door Hendriks grafisch ontwerper.
- ~~**Volledig box 3-model** (auditbevinding 10).~~ Grotendeels opgelost op 9 september 2026. De
  planner rekent de heffing nu per jaar uit over het dán actuele vermogen, in beide rekenkernen en
  in beide Monte Carlo-paden. `vermogensbelastingHandmatig` schakelt tussen "reken het uit" en "ik
  vul zelf een percentage in"; het percentage doet niets zodra de heffing aanstaat.

  Wat bewust niet meegaat, en in de UI ook zo benoemd staat: het vermogen telt volledig als
  beleggingen (de planner kent geen vermogensmix, wie vooral spaart betaalt minder), en er zijn
  geen schulden. Fiscaal partnerschap gaat wél mee, via `woonsituatie`.

  Twee dingen om te weten bij een volgende wijziging. De heffing gaat over het saldo aan het begin
  van het jaar, want box 3 kent één peildatum. En de contante-waardeopbouw van het doelbedrag op
  het scherm (`requiredCapitalEindwaarde`) kent de heffing niet, dus die sluit niet meer tot op de
  euro aan op `requiredCapital`; dat laatste komt uit de simulatie en klopt wel.
- **Inflatie is deterministisch.** Eén vast percentage voor de hele looptijd, dus de
  bandbreedte in de grafiek toont niet het risico dat de inflatie zelf tegenvalt, en evenmin de
  correlatie tussen inflatie en rendement. Dat is het deel dat blijft liggen.

  Wat op 8 september 2026 wél is opgelost: `monteCarlo.ts` plakte een nominale
  standaardafwijking op een reëel rendement. Dat is nu `reeleVolatiliteit()`, met
  σ_reëel = σ_nominaal / (1 + inflatie): bij 12% en 3% inflatie 11,65%, en de log-sigma van de
  trekking daalt van 0,11621 naar 0,11285.

  Let op bij het beoordelen daarvan: die te hoge volatiliteit compenseerde de ontbrekende
  inflatieonzekerheid per ongeluk een beetje. De correctie maakt het model intern kloppend, niet
  automatisch realistischer. De slagingskans van het basisscenario ging er dan ook ómlaag van
  8,80% naar 8,25%, want bij een plan dat mediaan niet haalt komt succes uit de bovenstaart en
  die wordt dunner bij minder spreiding.
- **Huishoudmodel is er half.** Sinds 8 september 2026 kan een partner meegerekend worden als
  tweede, apart belaste persoon (`PartnerGegevens` in `types/index.ts`, `persoonNettoInkomen()` in
  `pensionCalc.ts`). Box 1 is individueel, dus dat is de enige juiste behandeling: twee partners
  met elk € 1.084 AOW en € 1.500 pensioen komen apart belast op € 4.673,81 netto per maand uit,
  tegen € 3.718,73 als je alles in één veld optelt.

  Wat nog ontbreekt: een aparte beleggingspot per persoon, een eigen lijfrente voor de partner,
  een aparte planningshorizon, en nabestaandenscenario's (wat er gebeurt als één van beiden eerder
  overlijdt). Het vermogen en het gewenste inkomen gelden voor het huishouden samen.
- ~~Lettertypen niet zelf gehost.~~ Opgelost op 8 september 2026. De site laadt geen enkel
  bestand meer van een derde partij; `font-src` en `style-src` in de CSP staan nu op `'self'`.
  Nagetrokken tegen de productiebuild: alle drie de families laden vanaf het eigen domein en de
  tabular figures van Newsreader werken nog ("0" en "1" allebei 22,83px bij 40px).

(Audit 2026-08 heeft nagelopen of de H1 op de FO-planner-pagina nog `sr-only` was, zoals hier
eerder stond — dat bleek niet meer zo: de H1 is zichtbaar. Dit punt is daarom verwijderd, zie
`docs/archief/AUDIT-2026-08-bevindingen.md`, C3.)
