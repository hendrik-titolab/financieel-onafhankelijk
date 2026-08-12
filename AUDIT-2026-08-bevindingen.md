# Audit 2026-08 — bevindingenrapport

> Synthese van `HANDOFF-bugfix-audit-2026-08.md` (auditplan) + `AUDIT-fase0-1-feiten.md` (Fase 1,
> codeverificatie) + `AUDIT-fase3-livetests.md` (Fase 3, live tests). Branch `audit-2026-08`. Voor
> volledige citaten, code-fragmenten en reproductiestappen: zie die drie bronnen. Dit document is de
> beslislaag erboven, geen herhaling.
>
> **Niets is gefixt.** Fase 2 (externe fiscale bronverificatie) is niet gedaan — expliciet verboden
> deze sessie, moet met Hendriks eigen controle van elke bron.

## Samenvatting

49 punten nagelopen. **7 hoog-risico Wft/rekenfouten bevestigd** (waarvan 4 live met exacte cijfers
aangetoond), **3 eerder al door Hendrik besliste punten** (A12/E8-richting, D2, G1) zijn uitgevoerd
of klaar voor implementatie, **2 punten uit het auditplan bleken bij toetsing geen bug** (A17,
D1/D2), en **1 document-bevinding (C3) bleek zelf achterhaald** — de code was al beter dan de
documentatie zei. 8 punten kunnen niet verder zonder externe bronverificatie (F1, A10, B2, B4, B5) —
dat is Fase 2, met opzet nog niet gedaan.

---

## Scan-tabel

| ID | Titel | Risico | Type | Status |
|---|---|---|---|---|
| E1 | Onttrekking niet fiscaal onderscheiden (box 1/3) | **Hoog** | Wft-risico | Bevestigd (code) — besluit nodig |
| E2 | Box 3 niet gemodelleerd | **Hoog** | Modelaanname | Besluit nodig |
| E3 | Geen kosten in het rendement | **Hoog** | Modelaanname | Besluit nodig |
| E4 | Bruto-netto inconsistent tussen twee tools | **Hoog** | Rekenfout | **Bevestigd live**, exacte cijfers |
| E5 | AOW/pensioen impliciet volledig geïndexeerd | **Hoog** | Modelaanname | Besluit nodig |
| E6 | Slagingskans gemeten op verkeerd moment | **Hoog** | Rekenfout | Bevestigd (code), niet live |
| E7 | Monte Carlo negeert life events na pensioen | **Hoog** | Rekenfout | **Bevestigd**, golden-master |
| E8 | Verwacht eindvermogen ligt boven mediaan | Midden | Modelaanname | **Bevestigd live**, richting al besloten |
| E9 | Disconteringsconventies ~1% uiteen | Midden | Rekenfout | Bevestigd, handmatig rekenvoorbeeld |
| E10 | Benodigde inleg kan negatief uitkomen | Laag | Codekwaliteit | Bevestigd, meenemen in A3 |
| E11 | Systeemdatum in rekenkern | Laag | Codekwaliteit | Testbaarheid opgelost (G1) |
| E12 | Laatste uitkeringsrij is presentatierij | Cosmetisch | — | Bevestigd, geen actie |
| F1 | Site vs. Hendriks skill: fiscale parameters wijken af | **Hoog** | Wft-risico | Niet extern geverifieerd |
| F2 | Eén bron voor alle cijfers, geen bron per waarde | Midden | Proces | Niet apart onderzocht |
| A1 | Drievoudige duplicatie onttrekkingslogica | Midden | Codekwaliteit | Bevestigd, subtiel verschil gevonden |
| A3 | `Math.abs()` verbergt negatief eindvermogen | **Hoog** | Rekenfout | **Bevestigd live** — trend draait om |
| A4 | Dode filtervoorwaarde | Cosmetisch | Codekwaliteit | Bevestigd |
| A5 | Extreme rendement/volatiliteit niet geclamped | Midden | Codekwaliteit | **Bevestigd live** — 6,6 biljoen euro |
| A7 | Jaarruimte-formuletekst klopt niet met eigen data | **Hoog** | Wft-risico | **Bevestigd live**, schermbewijs |
| A8/A9 | Stille terugval op 2026-cijfers, jaren ontbreken | Midden | Wft-risico | **Bevestigd live**, schermbewijs |
| A10 | BrutoNetto-toelichting wijkt €630 af van eigen config | **Hoog** | Wft-risico | Bevestigd (intern), extern nodig |
| A11 | "Rode vlak" is signaalkleur, niet rood | Cosmetisch | Content | **Bevestigd live** |
| A12 | Geen bronvermelding risicoprofielen | Midden | — | **Al besloten** (12 aug) |
| A14 | Dode `stortingen`-array | Cosmetisch | Codekwaliteit | Bevestigd, geen bereikbaar pad |
| A16 | Hardcoded `'2000'` i.p.v. `N_SIMULATIONS` (2 bestanden) | Cosmetisch | Codekwaliteit | Bevestigd |
| A17 | KPI-cellen zouden elkaar kunnen tegenspreken | — | — | **Geen bug** — wiskundig weerlegd |
| A18 | Focus bij verwijderen middelste rij | Laag | Codekwaliteit | Data OK, focus niet testbaar |
| A19 | `currentIncome` ongebruikt, wel in Excel-export | Laag | Codekwaliteit | Bevestigd |
| A20 | `nettoToBruto` dode code | Cosmetisch | Codekwaliteit | Bevestigd, hangt af van E1 |
| A21 | Bruto-netto niet testbaar zonder refactor | Laag | Proces | Nieuw, geen actie mogelijk nu |
| A22 | Jaarveld geen bovengrens, stil genegeerd bedrag | Midden | Codekwaliteit | **Nieuw, bevestigd live** |
| B1 | "100 biljoen" rekenfout in artikeltekst | Midden | Content | Bevestigd |
| B2 | Drie tijdsgebonden claims (spaarrente/CBS) | Midden | Content | Niet extern geverifieerd |
| B3 | "Na zeven jaar" moet "na zes jaar" zijn | Laag | Content | Bevestigd, rekenwerk |
| B4 | "30% in 2026" jaarruimtepercentage | Laag | Content | Intern consistent, extern nodig |
| B5 | Overige externe feiten (AOW, Trinity, Cagan, DNB) | Laag | Content | Niet geverifieerd, laag risico |
| B6 | Interne rekenvoorbeelden in content kloppen | — | — | Positief, geen actie |
| B7 | Consistentie tussen content en toolcijfers | Midden | Content | Niet onderzocht |
| C1 | DESIGN_SYSTEM.md/HANDOFF-herstijling verouderd | Cosmetisch | Proces | Bevestigd |
| C2 | 3 hex-kleuren buiten gedocumenteerd tokenpalet | Cosmetisch | Codekwaliteit | Bevestigd |
| C3 | H1 FO-planner zou `sr-only` zijn | — | — | **Ontkracht** — documentatie zelf fout |
| D1 | Downloadlimiet-mechanisme | — | — | Bevestigd live, geen bug |
| D2 | Contactroute bij limiet | — | — | **Al besloten** (12 aug), bevestigd live |
| G1 | Geen tests/typecheck in de build | — | Proces | **Opgelost deze sessie** |
| G2 | `dist/` in `.gitignore` | — | — | Al in orde |
| J1 | localStorage vs. privacyverklaring | — | — | Bevestigd, geen probleem |
| J2 | Aannames die in de FAQ zouden moeten staan | Midden | Content | Niet apart opgesteld |

---

## Detailkaarten — hoog risico

### E1 — de zwaarste bevinding van de hele audit
**Wat een bezoeker hierdoor verkeerd concludeert:** "ik ben financieel onafhankelijk", terwijl dat
voor iemand met lijfrente- of banksparen-kapitaal niet klopt — de tool trekt de onttrekking netto van
het kapitaal af, alsof het onbelast vrij vermogen is.
**Bestand:** `pensionCalc.ts:204,225`. **Voorstel A** (klein): expliciete aanname in UI + FAQ ("dit
model gaat uit van vrij belegd vermogen in box 3"). **Voorstel B** (juist): veld "waarvan
lijfrente/banksparen" + bruteren via `nettoToBruto` (nu dode code, A20 — dit zou 'm alsnog nuttig
maken). **Afhankelijkheid:** A1 eerst (anders werk je de duplicatie drie keer bij).

### E2 — box 3 volledig afwezig
**Wat een bezoeker verkeerd concludeert:** zijn vermogen is voldoende, terwijl de forfaitaire
vermogensheffing — voor deze doelgroep (groot vrij belegd vermogen) de grootste ontbrekende
kostenpost — nergens wordt afgetrokken. Groter effect dan het verschil tussen twee risicoprofielen.
**Besluit nodig:** wel/niet modelleren, en hoe uitgebreid. Forfait/tarief 2026 zijn Fase 2-cijfers.

### E3 — geen kosten
**Wat een bezoeker verkeerd concludeert:** het ingevulde rendement is wat hij netto overhoudt. 0,5%
kosten/jaar over 30 jaar scheelt ~14% eindvermogen (1,005³⁰ = 1,161). **Voorstel:** kostenveld met
realistische default, of microcopy die om "rendement ná kosten" vraagt.

### E4 — bevestigd live, exacte cijfers
€30.000/jaar bruto: Bruto-netto-tool → €2.313/mnd netto. FO-planner (als werkgeverspensioen) →
€1.606/mnd. **Verschil €707/maand**, want `pensionCalc.ts`'s `brutoToNetto()` kent geen
heffingskortingen. **Wat een bezoeker verkeerd concludeert:** zijn werkgeverspensioen levert
substantieel minder netto op dan werkelijk het geval is (dit is de enige hoge E-bevinding die de
gebruiker te *somber* stemt, niet te optimistisch). **Afhankelijkheid:** A1 eerst.

### E5 — impliciete volledige indexatie
Model houdt AOW/werkgeverspensioen constant in reële euro's, dus neemt aan dat beide exact met de
inflatie meestijgen. Voor AOW verdedigbaar, voor aanvullend pensioen niet — indexatie is
voorwaardelijk. 1%-punt achterstand/jaar over 30 jaar = 26% lagere reële uitkering dan het model
toont. **Wat een bezoeker verkeerd concludeert:** zijn aanvullend pensioen houdt gegarandeerd gelijke
tred met de kosten van levensonderhoud. **Besluit nodig:** indexatieveld per bron, of FAQ-vermelding.

### E6 — slagingskans op verkeerd moment gemeten
`monteCarlo.ts:105-106` telt een pad als geslaagd bij `capital >= 0` **aan het eind**, niet of het
onderweg ooit negatief was. **Wat een bezoeker verkeerd concludeert:** zijn kans op slagen is hoger
dan de werkelijke robuustheid van zijn planning. Code-bevestigd, dit sessie niet live met een cijfer
onderbouwd (tijdgebrek).

### E7 — bevestigd, golden-master-bewijs
Een leeftijd-75-uitgave van −€100.000 verandert de deterministische lijn wél, de slagingskans en
bandbreedte **niet** (`monteCarlo.golden.test.ts` toont identieke uitkomst met/zonder het bedrag,
reproduceerbaar met een vaste seed). **Wat een bezoeker verkeerd concludeert:** dat zijn ingevoerde
uitgave is meegenomen in de kanspercentages — dat is niet zo.

### A3 — bevestigd live, trend draait om
Bij een tegenvaller van −€200k toont de tool €35.381 (correct); bij −€300k toont de tool €147.630
— **hoger**, terwijl de werkelijke uitkomst (onafhankelijk herberekend) daalt naar **−€147.630**.
**Wat een bezoeker verkeerd concludeert:** een grotere tegenvaller is gunstiger voor zijn
eindvermogen — het omgekeerde van de waarheid. **Voorstel:** één tekenbewuste `eur()`-helper i.p.v.
de huidige unconditionele `Math.abs()`, plus de resterende `eur()`-aanroepen (zie
`AUDIT-fase0-1-feiten.md`, "A3 uitgebreid") in dezelfde slag meenemen. Neemt ook E10 mee (negatieve
benodigde inleg).

### A7 — bevestigd live, schermbewijs
Voor jaar 2020 staan op één scherm twee tegenstrijdige formules ("13,3% − 7,44" tweemaal, "30% −
6,27" eenmaal); het getoonde resultaat (€2.046 bij factor A €1.000) matcht geen van beide teksten als
je ze letterlijk narekent. **Wat een bezoeker verkeerd concludeert:** als hij de formule zelf
narekent (bijv. voor een ander jaar of ter controle), komt hij op een ander bedrag dan de tool
toont — twee keer fout, niet één keer. **Geblokkeerd op F1**: welke kant (tekst of onderliggende
jaardata) gecorrigeerd moet worden, is pas te zeggen na externe verificatie.

### A10 — €630 afwijking, intern bevestigd
Navekend uit de eigen config-waarden: arbeidskorting-afbouwpunt €132.920. Tekst in de UI: €132.290.
**Geblokkeerd op externe verificatie** van het echte 2026-cijfer.

### F1 — cross-project afwijking, nog open
`fiscaleParameters.ts` en Hendriks eigen Claude Skill wijken op meerdere jaren af (franchise, max
toetsingsinkomen, factor A voor 2020/2021 zelfs tegenovergesteld: site 6,27, skill 7,44). Vier
concrete, toetsbare hypotheses staan al klaar in `HANDOFF-bugfix-audit-2026-08.md` (F1). **Dit raakt
niet alleen de site maar mogelijk ook je eigen advieswerk met de skill** — apart van de site-fix te
behandelen als de skill zelf moet worden aangepast (staat buiten de projectmap).

---

## Al besloten (geen nieuwe vraag, alleen ter bevestiging)

- **A12/E8** (12 aug): rendementen zijn meetkundig bedoeld → `monteCarlo.ts` moet worden aangepast
  (lognormaal trekken, of gemiddelde met ½σ² ophogen). Live dit sessie bevestigd: bij het offensieve
  profiel ligt "Verwacht eindvermogen" (€361.813) ~34% boven de simulatie-mediaan (€270.891) —
  dezelfde orde van grootte als de theoretische voorspelling. **Nog open:** Fase 2-check of AFM/DNB
  een verplichte methodiek voorschrijft, en welke van de twee implementaties (lognormaal vs.
  ½σ²-ophoging) de voorkeur heeft.
- **D2** (12 aug): doel van de downloadlimiet is contact. Live bevestigd: bij de vierde poging
  verschijnt een echte, klikbare contactlink. Geen actie nodig.
- **G1** (12 aug): testmechanisme goedgekeurd. Uitgevoerd deze sessie — 33 golden-master-tests,
  3 apart gelabelde testnaad-commits (`f3fdc71`, `9dcb64e`, `12157f1`).

## Ontkracht — bleek bij toetsing geen bug (of documentatie zelf fout)

- **A17**: KPI-cellen "Overschot" en "Benodigde maandinleg" kunnen elkaar wiskundig niet
  tegenspreken (beide zijn logisch equivalent, bewezen in `AUDIT-fase3-livetests.md`).
- **D1**: downloadlimiet werkt exact zoals bedoeld — device-gebonden via localStorage, gecombineerde
  teller, geen fingerprinting.
- **C3**: de H1 op de FO-plannerpagina is **niet** `sr-only` — gewoon zichtbaar, bevestigd in bron en
  in de browser. `CLAUDE.md` en het auditplan zeggen hierover iets dat niet meer klopt.
- **J1**: alle drie localStorage-keys die de site gebruikt, staan ook expliciet in `privacy.astro`.
- **B6**: interne rekenvoorbeelden in de content kloppen vrijwel overal exact.

---

## Drie beslisgroepen

### Groep 1 — ✅ uitgevoerd, commit `284194b` op `audit-2026-08`
Hendriks eigen classificatie (12 aug) plus een paar vergelijkbare items uit deze sessie. B3 is op
Hendriks verzoek anders gedaan dan hieronder oorspronkelijk voorgesteld: de hele zin verwijderd
i.p.v. herformuleren. `npm run test`/`build`/`check` groen, live gecontroleerd.

| ID | Fix |
|---|---|
| A4 | Dode filtervoorwaarde in `monteCarlo.ts` verwijderen |
| A11 | "Het rode vlak" → tekst die bij signaalkleur past |
| A16 | Beide exportbestanden laten verwijzen naar `N_SIMULATIONS` i.p.v. hardcoded `'2000'` |
| A14 | Dode `stortingen`-array opruimen (type, destructuring, merge-logica) |
| B1 | "100 biljoen" rekenfout in `hoe-hoog-kan-inflatie-worden.md:65` corrigeren |
| B3 | "Na zeven jaar" → preciezer (omslagpunt ligt op 6,15 jaar) |
| C1 | `DESIGN_SYSTEM.md`/`HANDOFF-herstijling-2026.md` bijwerken: al gemerged, niet "nog niet" |
| C2 | Drie hex-kleuren als eigen token vastleggen in `DESIGN_SYSTEM.md` |
| C3 | `CLAUDE.md` bijwerken: H1 is niet meer `sr-only`, verwijderen als openstaand punt |
| A12 | Bronregel toevoegen aan `risicoprofielen.ts` met Hendriks eigen 12-augustus-onderbouwing |
| E11/G2/E12 | Geen actie nodig — al opgelost of bewust geen bug |

### Groep 2 — jouw besluit nodig

**Grote ontwerpkeuzes (Wft-gewicht, elk met A/B-opties hierboven):**
1. E1 — disclosure (A) of apart lijfrente/banksparen-veld (B)?
2. E2 — box 3 modelleren, en hoe uitgebreid?
3. E3 — kostenveld, of alleen microcopy?
4. E5 — indexatieveld, of alleen FAQ?

**Rekenkernwijzigingen — stel ik voor als één blok op te pakken, ná onderlinge afhankelijkheid
(A1 eerst), met golden-master-tests als vangnet (G1 staat al klaar):**
5. A1 (dedupliceren) → E4 (heffingskortingen toevoegen, incl. POST_AOW-tegenhanger in
   `fiscaleParameters.ts`) → E5 → E9 (disconteringsconventies gelijktrekken) → E6 (slagingskans op
   piek i.p.v. eindstand) → E7 (life events ook in Monte Carlo-uitkeringsfase) → E8/A12
   (lognormaal/½σ²-implementatiekeuze). Akkoord om dit zo te clusteren?

**Fase 2, externe verificatie — het auditplan schrijft voor dat jij zelf elke bron controleert:**
6. Wil je dat ik in een volgende sessie kandidaat-cijfers + primaire bron-URL's verzamel voor F1,
   A10, B2, B4, B5 (zodat jij ze hoeft te *controleren*, niet zelf te *zoeken*), of doe je Fase 2
   liever helemaal zelf?

**Kleinere keuzes:**
7. A8/A9 — akkoord met "falen met duidelijke melding" i.p.v. de huidige stille terugval op
   2026-cijfers?
8. A19 — `currentIncome`-veld verwijderen, of labelen als "alleen voor je eigen dossier"?
9. A18 — focus-risico bij het verwijderen van een middelste rij: een stabiel `id` toevoegen
   (kleine, veilige verandering) of laten zoals het is (data blijft sowieso correct)?
10. B7/J2 — wil je dat ik deze twee losse consistentiechecks (content vs. toolcijfers; welke
    aannames horen in de FAQ) alsnog uitvoer?

### Groep 3 — bewust niet fixen
- **A21**: Bruto-netto-berekening niet testbaar zonder de rekenlogica naar een eigen module te
  extraheren — refactor, buiten scope tenzij je dat expliciet wilt.
- **A6**: Box-Muller zonder epsilon-guard, kans verwaarloosbaar.
- **A20**: blijft dode code tenzij E1-optie-B gekozen wordt (dan is het juist nodig).
- **A17, D1, J1, B6**: geen bug, zie hierboven.

---

## Kritieke bestanden voor de fixronde
`src/utils/pensionCalc.ts`, `src/utils/monteCarlo.ts`, `src/utils/jaarruimte.ts`,
`src/config/fiscaleParameters.ts`, `src/config/risicoprofielen.ts`,
`src/components/PensionPlanner/{index,InputPanel,ResultsPanel}.tsx`,
`src/components/BrutoNetto/index.tsx`, `src/components/Jaarruimte/index.tsx`,
`src/components/Inflatie/index.tsx`, `src/content/uitleg/hoe-hoog-kan-inflatie-worden.md`,
`src/content/uitleg/sparen-maakt-mensen-arm.md`, `CLAUDE.md`, `DESIGN_SYSTEM.md`,
`HANDOFF-herstijling-2026.md`. Test: `npm run test` (33 golden-master-tests) en `npm run check` vóór
elke commit in de rekenkern.
