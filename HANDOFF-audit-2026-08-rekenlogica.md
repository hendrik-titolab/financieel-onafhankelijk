# Hand-off — audit 2026-08, vervolg: rekenlogica-fixes

> Overdracht: 12 augustus 2026. Vorige sessie liep tegen de context-limiet aan. Branch
> `audit-2026-08`, niet gemerged naar `astro-migratie`, niet gepusht. Werkende map:
> `C:\Users\schak\financiele-planning`.

## Wat er al ligt (lees dit niet allemaal opnieuw, alleen ter oriëntatie)

Vier documenten in de projectroot, chronologisch:
1. `AUDIT-fase0-1-feiten.md` — codeverificatie met citaten
2. `AUDIT-fase3-livetests.md` — live tests, met schermbewijs en herberekeningen
3. `AUDIT-2026-08-bevindingen.md` — synthese: scan-tabel, detailkaarten, drie beslisgroepen
4. `AUDIT-fase2-externe-bronnen.md` en `FISCALE-BRONNEN.md` — externe fiscale bronverificatie;
   `FISCALE-BRONNEN.md` is het **doorlopende naslagdocument** dat Hendrik minimaal 2x/jaar zelf
   bijwerkt, niet alleen een auditverslag

**Al gecommit op `audit-2026-08`:**
- Elf mechanische fixes (groep 1: A4, A11, A16, A14, B1, B3, C1, C2, C3, A12) — commit `284194b`
- A10 (Bruto-netto-toelichting verwijst nu naar de config i.p.v. losse literals) — commit `9c990e0`
- G1: golden-master-testharnas (vitest, 33 tests, `npm run test`) — commit `4c01400`, plus drie
  losse testnaad-commits (`f3fdc71`, `9dcb64e`, `12157f1`): injecteerbare RNG (`src/utils/rng.ts`,
  `makeRng(seed)`) en injecteerbaar basisjaar (`opts?.currentYear`) in zowel `calculatePension` als
  `runMonteCarlo`. **Gebruik deze bij elke test die je aan de golden-master-fixtures toevoegt.**
- Volledige externe verificatie van de jaarruimteparameters 2016-2026 (zie `FISCALE-BRONNEN.md` §5)

**E1 is besloten: optie A.** Voeg een disclosure toe (UI + FAQ) dat het model uitgaat van vrij
belegd vermogen (box 3), niet van lijfrente/bankspaarproduct. Dit staat nog open (niet gedaan in
de vorige sessie door tijdgebrek) — pak dit als eerste stap.

## Wat je in déze sessie doet: de rekenlogica-cluster

Hendrik: "nu de logica-bugs, de rest (E2/E3/E4/E5/E1-B) hoort bij een aparte her-ijkingssessie
over bruto-netto pensioeninkomen." **Blijf dus strikt binnen onderstaande vijf punten.** Ze zijn
code-/rekenlogicafouten, los van welke fiscale behandeling later gekozen wordt.

Volgorde (afhankelijkheid: A1 eerst, de rest kan daarna in willekeurige volgorde, maar doe ze
apart met een eigen commit per punt):

### 0. E1-optie-A (klein, doe dit eerst)
Voeg in `src/components/PensionPlanner/ResultsPanel.tsx` en/of de FAQ-content een duidelijke regel
toe: dit model gaat uit van vrij belegd vermogen (box 3), niet van lijfrente- of
bankspaarproduct-opnames (die zijn belast als box 1-inkomen). Kort, geen nieuwe berekening.

### 1. A1 — drievoudige duplicatie opheffen
**Bestand:** `src/utils/pensionCalc.ts`. Drie bijna-identieke blokken: `getMonthlyWithdrawal()`
(losse functie), een inline kopie in de retirement-phase yearData-lus, en een inline kopie in
`buildIncomePhases()`. **Subtiel verschil dat je moet behouden of bewust opheffen:** alleen de
yearData-lus-kopie klemt het weergegeven bedrag op 0 zodra `capital <= 0`
(`actualFromCapital = capital > 0 ? fromCapital : 0`); de andere twee doen dat niet.
Consolideer naar één functie-aanroep. **Beslispunt om zelf te beargumenteren (geen vaststaand
antwoord vanuit de vorige sessie):** moet dat klem-gedrag overal gaan gelden, of blijft het
specifiek voor de yearData-weergave? Leg je keuze vast in de commit message.

### 2. E6 — slagingskans op het verkeerde moment gemeten
**Bestand:** `src/utils/monteCarlo.ts`. Nu: `if (capital >= 0) successCount++` kijkt alleen naar
het laatste jaar. Een pad dat halverwege de uitkeringsfase onder nul duikt en daarna (door het
perverse effect van negatief kapitaal × rendement) weer "herstelt", telt nu ten onrechte als
geslaagd. Fix: houd per simulatie bij of het kapitaal ooit negatief is geweest (in de
uitkeringsfase; de opbouwfase kan in de praktijk niet negatief worden onder normale invoer), en
gebruik dat i.p.v. alleen de eindstand.

### 3. E7 — Monte Carlo negeert eenmalige bedragen ná de pensioendatum
**Bestand:** `src/utils/monteCarlo.ts`. De accumulatiefase gebruikt `lumpSumMap` (gefilterd op
`year < retirementYear`), maar de uitkeringsfase-lus past helemaal geen life events toe.
`pensionCalc.ts` doet dit wel (`retEventMap`, regel ~224-225) — bouw hetzelfde patroon na in
`runMonteCarlo`. **Let op:** `monteCarlo.golden.test.ts` bevat een test die *bevestigt* dat dit nu
niets doet ("bevestigt E7: een eenmalig bedrag na pensioendatum verandert de simulatie niet",
met `toEqual`). Die test moet na deze fix juist gaan **falen** op de oude aanname — pas 'm aan
naar een test die bevestigt dat het resultaat nu wél verschilt, en werk de bijbehorende
`__golden__/monteCarlo.golden.json`-fixture bij met de nieuwe, inhoudelijk gecontroleerde waarden.

### 4. E9 — disconteringsconventies gelijktrekken
**Bestand:** `src/utils/pensionCalc.ts`. `requiredCapital` (regel ~150-161) disconteert met
`Math.pow(rPostAnnual, yr + 0.5)` (halfjaar-conventie). De daadwerkelijke jaar-voor-jaar-simulatie
(regel ~223-225) rekent met volledig-jaar-rendement, dan pas de onttrekking (eind-jaar-conventie).
Verschil ordegrootte 1% (zie het uitgewerkte rekenvoorbeeld in `AUDIT-fase0-1-feiten.md`, E9).
**Aanbeveling, geen vaststaand besluit:** pas `requiredCapital` aan naar de eind-jaar-conventie
(verwijder de `+ 0.5`), zodat de *doel*-berekening exact aansluit bij wat de simulatie *echt* doet
— dat lijkt kleiner en veiliger dan andersom de simulatie ombouwen. `findRequiredPMT` targeting
`requiredCapital` blijft vanzelf consistent. Bespreek/motiveer deze keuze expliciet in de commit,
en overweeg ook de spiegelbeeldige opbouwkant (`monthlyPMT * 12` na i.p.v. tijdens het jaar
bijgeschreven) — dat hoeft niet per se in dezelfde commit, maar noem het als je het bewust laat
liggen.

### 5. E8/A12 — uitvoering van het al genomen besluit
**Besluit staat al vast** (12 augustus, herbevestigd in `src/config/risicoprofielen.ts`'s
brontekst): de rendementen in `risicoprofielen.ts` zijn meetkundig (samengesteld) bedoeld.
`monteCarlo.ts` trekt nu rond het rekenkundige gemiddelde en compoundt dat, waardoor de mediaan van
de simulatie structureel onder het ingevulde percentage uitkomt (live gemeten: ~34% lager bij het
offensieve profiel, zie `AUDIT-fase3-livetests.md`, E8). Twee technische opties, allebei genoemd in
het auditplan:
- **Optie a**: `sampleNormal` vervangen door een lognormale trekking.
- **Optie b**: het gemiddelde dat aan `sampleNormal` wordt doorgegeven ophogen met `½σ²` vóór het
  trekken (kleinere wijziging, blijft de bestaande Box-Muller-aanpak gebruiken). Let bij het
  omrekenen op eenheden: `volatilityPre`/`volatilityPost` staan in hele procentpunten, niet als
  decimale fractie.

Geen van beide is hier voorgeschreven — kies er één, beargumenteer waarom in de commit, en toets of
de mediaan van de simulatie na de fix inderdaad rond het ingevulde percentage uitkomt (zelfde
soort seeded herberekening als in `AUDIT-fase3-livetests.md`, E8, is een goede manier om dat te
bevestigen vóór je commit). Werk `monteCarlo.golden.test.ts`'s fixtures bij — de
`successRate`/`percentileData`-waarden veranderen door deze fix.

## Wat je niet aanraakt in deze sessie
E2 (box 3), E3 (kosten), E4 (bruto-netto-inconsistentie), E5 (indexatie), E1-optie-B (apart
lijfrente/bankspaar-veld) — allemaal voor de aparte her-ijkingssessie. Ook niet: F1/A7's definitieve
fix (welke kant van de jaarruimte-formule correct is — de externe bronnen zijn nog 🟡, geen
vaststaande bron), de jaarruimte-configfixes uit `FISCALE-BRONNEN.md` §5, en de B-serie
content-fixes (B2/B4/B5). Die wachten op Hendriks eigen beoordeling van de 🟡-bronnen.

## Werkwijze
- Laat Hendrik elke voorgestelde wijziging **eerst zien** (precies zoals bij groep 1 en A10 in de
  vorige sessie: concreet voorstel, dan pas toepassen na akkoord) — dit zijn rekenkernwijzigingen,
  het auditplan zelf is daar expliciet voorzichtig mee.
- Vóór elke commit: `npm run build`, `npm run test`, `npm run check` groen (of exact dezelfde
  vooraf bestaande afwijkingen als de Fase 0-baseline: 1 bekende `astro check`-fout in
  `exportExcel.ts`, verder niets nieuws).
- Live controleren in de browser (preview-tools, niet Bash) waar een wijziging zichtbaar is.
- Elke fix in een eigen commit, Nederlandse commit message, zelfde stijl als de bestaande commits
  op deze branch (`git log --oneline` voor voorbeelden).
- Nog steeds: niet pushen naar `astro-migratie`, dat is de live productiebranch.
- Werk dit hand-off-document (of een nieuw slotbericht) aan het eind bij met wat er wel/niet is
  gelukt, zodat een volgende sessie niet in het duister tast.
