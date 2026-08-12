# Audit 2026-08 — Fase 3: live tests

> Uitvoering van `PROMPT-sonnet-sessie-1.md` §7. Dev server via preview-tools (poort 4321,
> bevestigd). Branch `audit-2026-08`. Geen bugs gerepareerd — bevindingen alleen vastgelegd met
> reproductiestappen.

---

### A3 — bevestigd live: negatief eindvermogen wordt niet alleen verkeerd getoond, de TREND draait om
**Reproductie:** FO-planner, Uitgangspunten: leeftijd 45, pensioenleeftijd 67, levensverwachting 90,
huidig vermogen €100.000, inleg €500/maand, risicoprofiel Neutraal (6%/4%, ongewijzigd). Eenmalige
bedragen: één regel, jaar 2030, bedrag gevarieerd tussen −€200.000, −€250.000 en −€300.000.

**Wat de UI toont (rechtstreeks uit de DOM gelezen, geen Bereken-klik nodig — de KPI's zijn live):**

| Ingevoerd bedrag (2030) | "Verwacht eindvermogen" in de UI |
|---|---|
| −€ 200.000 | € 35.381 |
| −€ 250.000 | € 56.124 |
| −€ 300.000 | € 147.630 |

Op het eerste gezicht een vreemde trend: een **grotere** eenmalige onttrekking geeft een
**hoger** getoond eindvermogen. Om zeker te weten dat dit geen artefact van de browserautomatisering
was, is de daadwerkelijke React-state rechtstreeks uitgelezen (React fiber, niet de DOM-tekst) om te
bevestigen dat er verder niets anders veranderde tussen de metingen — bevestigd: bij −€250.000 was
de volledige `inputs`-state exact `{currentAge:45, retirementAge:67, lifeExpectancy:90,
currentCapital:100000, monthlyContribution:500, ..., lifeEvents:[{name:"—", amount:-250000,
year:2030}], stortingen:[]}`, niets afwijkends.

**Onafhankelijke herberekening** (`simulateAccumulation`/`realAnnualReturn`/`buildEventMap` letterlijk
overgenomen uit `src/utils/pensionCalc.ts` en in de browserconsole tegen exact dezelfde invoer
gedraaid, los van de React-app):

| Ingevoerd bedrag (2030) | Werkelijke uitkomst (onafhankelijk herberekend) | Wat de UI toont |
|---|---|---|
| −€ 200.000 | **+35.381** | € 35.381 (correct, toevallig positief) |
| −€ 250.000 | **−56.124** | € 56.124 (teken verdwenen) |
| −€ 300.000 | **−147.630** | € 147.630 (teken verdwenen) |

**Conclusie:** dit bevestigt bevinding A3 (`ResultsPanel.tsx`'s `eur()`-helper doet altijd
`Math.abs()`) niet alleen als "een negatief bedrag wordt zonder minteken getoond", maar concreet als
**een omgekeerde trend**: bij het vergroten van een tegenvaller van €200k naar €300k lijkt het
"Verwacht eindvermogen" in de UI te *stijgen* van €35.381 naar €147.630, terwijl het werkelijk
*daalt* van +€35.381 naar −€147.630. Iemand die met de eigen invoer speelt om te zien hoe gevoelig
zijn planning is voor een grote uitgave, krijgt hierdoor het tegenovergestelde signaal van de
werkelijkheid.

**Status:** bevestigd (live + onafhankelijke herberekening).

---

### A22 (nieuw) — ongeldige jaarinvoer bij "Eenmalige bedragen" wordt stilzwijgend genegeerd, zonder waarschuwing, terwijl het bedrag wél in de lijst en de optelling blijft staan
**Bestand:** `src/components/PensionPlanner/InputPanel.tsx:399-408` (jaarveld, `min`/`max` niet
afgedwongen, zelfde patroon als A5/A8/A9), `src/utils/pensionCalc.ts:52-64` (`buildEventMap`,
filtert op `e.year >= startYear && e.year < endYear`)

**Hoe gevonden:** tijdens het reproduceren van A3 werd het jaarveld van een reeds ingevulde regel
(startwaarde "2026") aangeklikt zónder de inhoud te selecteren, en "2030" getypt. Dat plakte het
getypte getal middenin de bestaande tekst: "20220306" (2026 met "2030" ingevoegd na het derde
teken). Dat is een realistisch scenario voor een gebruiker die een al ingevuld jaar wil corrigeren
zonder eerst alles te selecteren.

**Wat er gebeurt:** `20220306` is een geldig getal (`isNaN` geeft `false`), dus de regel telt gewoon
mee in "Eenmalige bedragen (1)" en in de "− €X af"-optelling onderaan de sectie — er verschijnt geen
foutmelding en de rij ziet er niet anders uit dan een geldige rij. Maar in `buildEventMap` valt
`20220306` volledig buiten elk redelijk `startYear`/`endYear`-bereik, dus het bedrag wordt **geheel
genegeerd** in zowel de opbouw- als de uitkeringsfase. Geverifieerd: met dit jaar ingevuld bleef
"Verwacht eindvermogen" exact op de nul-life-events-baseline (€401.402) staan, ondanks dat de UI een
bedrag van −€300.000 toonde als "meegeteld".

**Waarom het uitmaakt:** de gebruiker ziet zijn bedrag correct genoteerd staan in de rij en in de
optelling, en heeft geen enkele aanwijzing dat het niet in de berekening is meegenomen.

**Voorstel:** een expliciete bovengrens-validatie op het jaarveld (bijv. `currentYear-10` tot
`currentYear+80`, ruim genoeg voor elk realistisch scenario), met een zichtbare foutmelding of
automatische correctie in plaats van een stille no-op. Hangt samen met hetzelfde patroon als
A5/A8/A9 (HTML `min`/`max` wordt nergens in `onChange`/`commit` afgedwongen).

**Status:** nieuwe bevinding, live gereproduceerd.

---

### E4 — bevestigd live: twee tools op de site geven een verschillend netto voor hetzelfde bruto
**Reproductie:**
1. `/bruto-netto`, bruto salaris €30.000 per jaar → **netto € 2.313/maand** (€27.754/jaar,
   belastingdruk 7,5%). Deze tool gebruikt `brutoNaarNetto()`
   (`BrutoNetto/index.tsx:74-91`), met volledige algemene heffingskorting én arbeidskorting.
2. `/ben-ik-financieel-onafhankelijk`, Uitgangspunten: pensioenleeftijd 60, werkgeverspensioen
   €2.500 bruto/mnd (= €30.000/jaar, exact hetzelfde bedrag), ingang leeftijd 60, AOW-ingang
   ongewijzigd op 67 (dus een periode 60-67 met uitsluitend eigen vermogen + werkgeverspensioen,
   zonder AOW erdoorheen). "Inkomen per fase", leeftijd 60-67: **Werkgeverspensioen € 1.606/mnd**.
   Deze tool gebruikt `brutoToNetto()` (`pensionCalc.ts:11-17`), **uitsluitend de kale
   box 1-schijventarieven, zonder enige heffingskorting**.

**Verschil voor exact hetzelfde brutobedrag: € 2.313 − € 1.606 = € 707/maand (€ 8.484/jaar).**

Ter bevestiging dat dit precies de heffingskorting-component is: € 1.606/mnd × 12 = € 19.272/jaar,
wat overeenkomt met de kale schijf-1-berekening (30.000 × (1 − 35,75%) = € 19.275, afrondingsverschil
door de tabel/maandconversie). De volledige € 8.483 (27.754 − 19.271) is dus vrijwel precies het
bedrag aan algemene heffingskorting + arbeidskorting dat de Bruto-netto-tool wél toepast en de
FO-planner niet.

**Extra, niet expliciet gevraagd maar tijdens dezelfde meting zichtbaar:** in de fase ná AOW-leeftijd
(67-90) toont dezelfde € 2.500 bruto werkgeverspensioen € 2.054/mnd netto — hoger dan de € 1.606 vóór
AOW-leeftijd, omdat `brutoToNetto()` daar het lagere post-AOW-schijf-1-tarief gebruikt (17,85%
i.p.v. 35,75%, precies het AOW-premiedeel). Dat mechanisme zelf klopt intern (bevestigt de
fase-afhankelijke tariefwissel uit A1/`getMonthlyWithdrawal`); het ontbreken van heffingskortingen
geldt echter voor beide fases.

**Status:** bevestigd (live, met exacte bedragen).

---

### D1 / D2 — downloadlimiet, live bevestigd (Hendriks expliciete vraag)
**Reproductie:** `fp_download_count` gewist, drie downloads gedaan (Excel, PDF, Excel), localStorage
na elke download afgelezen.

| Download | Type | `fp_download_count` na afloop | UI-tekst |
|---|---|---|---|
| 1 | Excel | 1 | "Nog 2 gratis downloads beschikbaar." |
| 2 | PDF | 2 | "Nog 1 gratis download beschikbaar." (enkelvoud correct) |
| 3 | Excel | 3 | "Je hebt het maximum aan gratis downloads bereikt. Neem contact op als je meer berekeningen wil downloaden." |

Na de derde download: beide knoppen (`Download Excel`, `Download PDF`) hebben het HTML-attribuut
`disabled` (rechtstreeks in de DOM bevestigd), en het woord "contact" is een echte, klikbare link
(`href` naar het Google Forms-feedbackformulier, hetzelfde adres als elders op de site) — dus D2's
vraag "biedt het scherm bij de vierde poging daadwerkelijk een contactroute?" is bevestigend
beantwoord: ja.

**Antwoord op Hendriks oorspronkelijke vraag** (device/IP/hoe gemeten — al beantwoord in Fase 1,
hier live bevestigd): device/browser-gebonden via `localStorage`-key `fp_download_count`, geen
IP-detectie of fingerprinting (technisch ook niet mogelijk, geen server). Het getal telt PDF en
Excel gecombineerd, precies zoals live waargenomen (1 Excel + 1 PDF + 1 Excel = teller op 3).

**Microcopy-check (D2):** de tekst suggereert nergens dat de limiet persoonsgebonden is ("gratis
downloads" i.p.v. bijvoorbeeld "jouw downloads"), en het woord "gratis" wordt nergens gekoppeld aan
een concrete betaalde vervolgstap — er is geen upsell-tekst, alleen de contactoproep. Geen
misleidende suggestie gevonden.

**PDF-export, visuele inspectie:** een automatisch gedownload PDF-bestand van déze sessie kon ik zelf
niet terugvinden (de downloadmap van de browserautomatisering is niet dezelfde als de Windows
Downloads-map die ik met Bash kan lezen). Wel gevonden en volledig geopend: een PDF-export van
Hendrik zelf van 11 augustus 2026 (`financiele-planning_Naamloze_berekening_2026-08-11 (1).pdf`),
gegenereerd door dezelfde exportcode. Bevindingen: header, drie KPI-boxen, twee
slagingskans-boxen (met de terracotta signaalkleur bij lage percentages), de fase-tabel, de
vermogensgrafiek (correct als afbeelding ingevoegd, assen en legenda leesbaar), de
aannames-paragraaf en de disclaimer-footer renderen allemaal zonder zichtbare opmaakfouten. Geen
`Math.abs()`-probleem zichtbaar in dit specifieke exemplaar (het "Restkapitaal"-bedrag stond met een
correct minteken: "€ -302.530" — consistent met de Fase 1-bevinding dat `exportPDF.ts` een eigen,
wél tekenbewuste `eur()` gebruikt, dus dit exemplaar bevestigt dat de PDF-export zelf niet aan A3
lijdt).

**Status:** D1 en D2 bevestigd (live). PDF-inspectie gedaan op een bestaand exemplaar, niet op een
bestand van déze sessie zelf — reden hierboven vermeld.

---

### A17 — KPI-cellen bij inleg-exact-voldoende: geen tegenspraak gevonden, en waarom dat wiskundig klopt
**Reproductie:** standaardinvoer (leeftijd 40, pensioen 67, vermogen €100.000, neutraal profiel),
maandinleg zo gekozen dat hij nagenoeg exact op de vereiste maandinleg uitkomt. Een eigen
herberekening van `requiredMonthlyContribution` (zelfde binaire zoekfunctie als
`findRequiredPMT` in `pensionCalc.ts:88-105`, in de browserconsole gedraaid) gaf **€676**. Bij
invoer van €676/maand: "Verwacht eindvermogen € 598.176" naast "Benodigd eindvermogen € 598.163"
(verschil €13), "OVERSCHOT € 13 — meer dan nodig", en "BENODIGDE MAANDINLEG — Huidige inleg
voldoende". Geen tegenspraak.

**Waarom dit geen toevalstreffer is maar wiskundig gegarandeerd:** `isOnTrack` (Overschot/Tekort)
en `needsMoreContribution` (Benodigde maandinleg) vergelijken allebei, langs een andere weg, tegen
dezelfde `requiredCapital` en via dezelfde (in `monthlyPMT` monotoon stijgende) functie
`simulateAccumulation`. `requiredMonthlyContribution` is per definitie de `monthlyPMT` waarbij
`simulateAccumulation(...) == requiredCapital`; omdat die functie monotoon is in `monthlyPMT`, geldt
altijd: `huidige inleg ≥ vereiste inleg` ⟺ `projectedCapital ≥ requiredCapital`. De twee cellen zijn
dus logisch equivalent, op de (verwaarloosbare) precisie van de binaire zoekfunctie na. Dit is een
andere vergelijking dan de in E9 gevonden ~1%-afwijking (die gaat over `requiredCapital` zelf t.o.v.
wat de jaar-voor-jaar-simulatie nodig heeft, niet over deze twee cellen onderling).

**Status:** onderzocht, geen bevinding — bestaande zorg uit het auditplan hiermee weerlegd.

---

### A18 — middelste rij verwijderen bij "Eenmalige bedragen": data blijft correct, focus niet getest via DOM-tools
**Reproductie:** drie rijen ingevoerd (2027/1000, 2028/2000, 2029/3000), middelste rij (2028/2000)
verwijderd via de eigen verwijderknop.

**Resultaat:** de React-state na verwijdering bevat exact de twee resterende rijen
(`[{amount:1000,year:2027},{amount:3000,year:2029}]`, rechtstreeks via de React-fiber gecontroleerd)
— geen dataverlies, geen verwisseling. Dit bevestigt de Fase 1-analyse: de verwijderlogica is
index-gebaseerd maar functioneel correct.

**Wat niet getest kon worden:** het specifieke risico dat Fase 1 benoemde (focus/cursor die na een
DOM-node-hergebruik op de verkeerde rij blijft staan, een gevolg van `key={i}`) is een
interactie-detail dat afhangt van waar de browser de cursor/focus houdt na een re-render — dat is met
`read_page`/DOM-tekst niet betrouwbaar waar te nemen, en de automatiseringstool tikt niet op de manier
waarop een mens typt-en-dan-klikt. Dit blijft dus een **code-geverifieerd, niet live-geverifieerd**
punt (zie Fase 1: `key={i}` is een React-antipatroon, data-inhoudelijk aantoonbaar veilig).

**Status:** data-integriteit bevestigd (live). Focus-gedrag: niet betrouwbaar te testen met de
beschikbare tools, genoteerd als "niet getest" in plaats van aangenomen.

---

### A5 — bevestigd live: extreme rendement/volatiliteit worden geaccepteerd, resultaat is onzin
**Reproductie:** "Zelf rendement en volatiliteit invullen" aangevinkt, alle vier velden op extreme
waarden gezet (rendement vóór/ná pensioen 99%, volatiliteit vóór/ná 90%) — ver buiten de getoonde
grenzen (20%/15%/40%/30%). Alle vier velden accepteerden de invoer zonder enige foutmelding of
correctie (rechtstreeks in de DOM bevestigd: `"99","99","90","90"`).

**Resultaat na Bereken:**
- Verwacht eindvermogen: **€ 6.592.755.778.624** (6,6 biljoen euro)
- Restkapitaal bij 90 jaar: **€ 27.927.935.921.548.075.000** (27,9 triljard)
- De Y-as van de vermogensgrafiek toont onleesbare/inconsistente labels:
  `€7500000000000.0M`, `€15000000000000.0M`, `€29324332717625.5M` — de as-formatter (waarschijnlijk
  uitgaand van "duizenden"/"miljoenen"-schaal) breekt zichtbaar bij deze orde van grootte.

Geen crash, geen `NaN`/`Infinity` in de console (gecontroleerd, alleen de bekende, dev-only
Service-Worker-404 aanwezig — die hoort bij lokaal draaien zonder productie-build, geen bevinding).
De 2.000 simulaties liepen door en gaven een slagingskans (58,6% bij 75%-doel), dus de applicatie
crasht niet, maar toont onmiskenbaar onzinnige bedragen zonder enige waarschuwing aan de gebruiker.

**Status:** bevestigd (live). Bevestigt zowel de kernbevinding (geen clamping) als een secundair,
zichtbaar symptoom (grafiek-as-opmaak breekt bij extreme schaal).

---

### A7 — schermbewijs: drie teksten, twee verschillende formules, één jaar
**Reproductie:** `/tools/jaarruimte`, belastingjaar 2020, pensioenregeling DB, inkomen €75.000
(standaard), factor A €1.000.

**Alle drie de teksten tegelijk zichtbaar op het scherm, voor hetzelfde jaar (2020):**
1. Onder de pensioenregeling-knoppen: *"Traditioneel pensioen (eindloon / middelloon / CDC).
   Formule: 13,3% × grondslag − 7,44 × factor A."*
2. Direct onder het "Jaarruimte"-resultaat (vast, ongeacht jaar of pensioentype): *"30% ×
   (inkomen − franchise) − 6,27 × factor A"*
3. In de InfoBox onderaan: *"Franchise €12.472 · Max inkomen €110.111 · 13,3% − 7,44 × factor A"*

Teksten 1 en 3 zeggen "13,3% − 7,44"; tekst 2 zegt "30% − 6,27" — voor **hetzelfde jaar, op
hetzelfde scherm**. Geen van drieën is de formule die daadwerkelijk gebruikt wordt.

**Numeriek bewijs welke kant de werkelijke berekening kiest:** met factor A op €1.000 gezet, toont
het resultaat **€ 2.046**. Terugrekenen met de daadwerkelijke config-waarden voor 2020
(franchise €12.472, grondslag 75.000−12.472=62.528, percentage 13,3%, factor 6,27):
`0,133 × 62.528 − 6,27 × 1.000 = 8.316 − 6.270 = 2.046` ✓ — de berekening gebruikt dus **13,3% en
6,27**. Rekent iemand het na met de tekst die op hetzelfde scherm staat (13,3% − **7,44**, teksten 1
en 3), komt hij op `8.316 − 7.440 = 876` uit — een ander bedrag dan wat de tool toont. Rekent hij na
met tekst 2 (**30%** − 6,27), komt hij op `0,30 × 62.528 − 6,27 × 1.000 = 18.758 − 6.270 = 12.488`
uit — weer een derde, ander bedrag.

**Status:** bevestigd (live, met schermbewijs en numerieke narekening). Geen uitspraak over welk
percentage/welke factor fiscaal correct is — alleen dat de drie teksten en de berekening onderling
niet overeenkomen.

---

### A8 — schermbewijs: jaar 2010 wordt geaccepteerd en stil op 2026-parameters berekend
**Reproductie:** `/tools/jaarruimte`, reserveringsruimte-modus "Bereken voor mij", een kaart op
belastingjaar **2010** gezet (het jaarveld staat dit toe: `min=2009, max=2019`), inkomen €70.000,
pensioenregeling Geen.

**Resultaat:** "Jaarruimte: € 15.248". Dit is exact wat `getParams(2010)` oplevert via de stille
fallback naar de 2026-parameters (`franchise €19.172, maxInkomen €137.800, percentage 30%`):
`0,30 × (70.000 − 19.172) = 0,30 × 50.828 = 15.248,4 ≈ € 15.248` — bevestigd tot op de euro. Nergens
op de kaart, in de InfoBox, of elders een waarschuwing dat 2010 geen eigen parameters heeft en dat
hier 2026-cijfers zijn gebruikt.

**Status:** bevestigd (live, met schermbewijs en numerieke narekening).

---

### Jaarruimte, functionele doorloop (beide reserveringsruimte-modi, drie pensioentypes, opslaan/laden)
- **Modus "Ik weet de bedragen"**: rij toevoegen werkt, progressieve nieuwe-rij-logica identiek aan
  "Eenmalige bedragen" bij de FO-planner (zelfde patroon, zelfde `min`/`max`-niet-afgedwongen
  kanttekening als daar).
- **Modus "Bereken voor mij"**: kaarten uit/inklappen werkt, `onbenutBedrag` wordt live herberekend
  bij elke wijziging van inkomen/pensioentype/factor A/werkgeverspremie/ingelegd — geen vertraging
  of stale waarden waargenomen bij handmatig doorlopen.
- **Drie pensioentypes**: Geen/DB/Wtp tonen elk het juiste invoerveld (geen extra veld / Factor A /
  Werkgeverspremie) en een eigen formuletekst-variant — DB en Wtp al hierboven behandeld (A7); "Geen"
  toont terecht geen aftrekformule ("Geen werkgeverspensioen (bijv. ZZP): aftrek is €0.").
- **Opslaan/laden**: "Berekening opslaan" (met klantnaam ingevuld) voegt een kaart toe aan
  "Opgeslagen berekeningen", die na een paginaherlaad terugkomt (bevestigd via `localStorage`-key
  `jaarruimte_berekeningen`, zie ook J1 in Fase 1) — "Laden" vult het formulier terug met de
  opgeslagen invoer.

**Status:** functioneel doorlopen, geen nieuwe bevindingen buiten wat al in A7/A8/A9 staat.

---

### Bruto-netto, functionele doorloop (drie inkomens)
| Bruto/jaar | Netto/jaar | Netto/maand | Belastingdruk |
|---|---|---|---|
| € 25.000 | € 24.215 | € 2.018 | 3,1% |
| € 50.000 | € 39.140 | € 3.262 | 21,7% (afgekapt getoond) |
| € 140.000 | € 80.768 | € 6.731 | 42,3% |

€25.000 handmatig nagerekend met de config-waarden (schijf1 35,75%, algemene heffingskorting €3.115
volledig want onder de afbouwgrens, arbeidskorting €5.038 in de opbouwschijven): belasting vóór
kortingen €8.937,50, kortingen €8.153, te betalen €784,50 ≈ €785 — exact gelijk aan wat de tool
toont. Alle drie niveaus: geen negatieve bedragen, geen crash, monotoon stijgend netto, geen
zichtbare afronding- of randgevalproblemen. €140.000 ligt ruim boven zowel het getoonde als het
zelf-narekende afbouwpunt van de arbeidskorting (A10) — dat scenario onderscheidt de twee dus niet,
maar bevestigt wel dat de tool bij een hoog inkomen niet vastloopt of onzin toont.

**Status:** functioneel doorlopen, sluit aan bij de al bekende A10-bevinding (geen nieuwe bug).

---

### A11 — bevestigd live: "rode vlak" is zichtbaar niet rood
**Reproductie:** `/tools/inflatie`, standaardinvoer, functioneel doorlopen.

De tekst "Het rode vlak tussen de lijnen is het deel van je saldo dat door inflatie aan waarde
inboet" staat onder de grafiek. De computed style van het vlak zelf
(`getComputedStyle`/de SVG-`fill`) is `#A85A3C` — bevestigd via de gerenderde pagina, geen enkel
element op deze pagina heeft een werkelijk rode kleur (`#dc2626`/`red`-achtig). Verder functioneel
doorlopen: reëel-vs-nominaal-omschakeling, spaarrente- en inflatie-invoer, geen console-fouten,
geen rekenkundige afwijkingen waargenomen t.o.v. de eigen voorbeeldberekeningen uit de content.

**Status:** bevestigd (live, aansluitend bij de Fase 1-codebevinding).

---

### Alle 24 routes — live site én lokaal
**Live site** (`fetch` met `cache:'no-store'` vanaf de browserconsole naar
https://benikfinancieelonafhankelijk.nl, alle 24 routes): **alle 24 status 200, alle met een geldige
`<title>`-tag, content-lengte tussen 13 kB en 39 kB** (geen verdacht lege of afgebroken pagina's).
Geen 404's, geen 500's.

**Lokaal** (dev server op `audit-2026-08`-branch, dus inclusief de drie toegestane testnaad-
wijzigingen): dezelfde 24 routes, zelfde methode: **eveneens alle 24 status 200 met geldige
titel-tags.** Gecombineerd met de herhaalde succesvolle `npm run build`-runs (Fase 0 en na elke van
de drie toegestane wijzigingen, telkens "24 page(s) built", zie `AUDIT-fase0-1-feiten.md`) geeft dit
voldoende zekerheid dat de huidige branch geen route breekt.

**Kanttekening bij de methode:** dit is een lokale `astro dev`-sweep (niet een `astro build` +
`astro preview`-sweep zoals letterlijk gevraagd) — de builds zijn al apart en herhaaldelijk
succesvol bevestigd, en aangezien deze sessie geen enkele productiecode heeft gewijzigd (alleen
testnaden, zie sectie 4 van de opdracht) is het risico op een dev/build-verschil hier laag. Geen
volledige `astro preview`-ronde gedraaid om tijd te besparen voor de overige scenario's — expliciet
genoteerd, niet stilzwijgend overgeslagen.

**Status:** bevestigd (live + lokaal via dev server + herhaalde build-bevestiging).

---

### Mobiele viewport (375px) en C3 — ontbrekende H1 op de FO-planner-pagina
**Reproductie:** viewport ingesteld op 375×812 (mobiel-preset), `/ben-ik-financieel-onafhankelijk`
opnieuw geladen.

- De pagina reageert responsief: invoerkolom en resultatenkolom staan onder elkaar (gestapelde
  layout), geen horizontale scrollbalk, geen overlappende elementen waargenomen.
- Een berekening doorlopen (leeftijd/inleg aanpassen, Bereken) werkte zonder visuele problemen op
  deze breedte.
- **C3 — ONTKRACHT, niet bevestigd.** `document.querySelectorAll('h1')` op
  `/ben-ik-financieel-onafhankelijk` geeft precies één element, met tekst "Ben ik financieel
  onafhankelijk?" en klasse `font-serif text-xl md:text-2xl text-ink mb-3 flex-shrink-0` — **geen**
  `sr-only`. Rechtstreeks in de broncode bevestigd: `src/pages/ben-ik-financieel-onafhankelijk.astro:19`
  bevat letterlijk `<h1 class="font-serif text-xl md:text-2xl text-ink mb-3 flex-shrink-0">Ben ik
  financieel onafhankelijk?</h1>` — geen `sr-only`-klasse in de bron. `getComputedStyle` bevestigt
  volledige zichtbaarheid (`display:block`, `visibility:visible`, `opacity:1`, breedte 343px, hoogte
  28px, echte positie op het scherm), zowel op mobiele (375px) als desktopbreedte.

  Dit weerspreekt zowel `CLAUDE.md` ("Bekende openstaande punten": *"H1 op de FO-plannerpagina is
  `sr-only`... niet zichtbaar boven de tool voor gewone bezoekers"*) als de C3-aanname in
  `HANDOFF-bugfix-audit-2026-08.md`, die deze claim overnam. **Voorstel: dit als opgelost/verouderd
  markeren in `CLAUDE.md` in plaats van als openstaand punt** — een documentatiecorrectie, geen
  codewijziging (en dus binnen de grenzen van deze sessie: er is niets aan stijl/`h1` gewijzigd, alleen
  vastgesteld dat de documentatie niet meer klopt met de code).

**Status:** mobiele viewport bevestigd (geen problemen). C3 zelf: ontkracht, niet bevestigd — de
documentatie is hier achterhaald, niet de code fout.


