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

