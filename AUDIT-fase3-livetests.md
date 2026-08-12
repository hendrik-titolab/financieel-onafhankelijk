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

