# Handoff: borging van de rekentools (september 2026)

Geschreven 14 september 2026 na een volledige review van de rekenkern, de tests, de
fiscale bron, de CI en de live site. Bedoeld voor nieuwe chatsessies, ook met een
kleiner model. Lees dit bestand van boven naar beneden en volg de werkpakketten in
volgorde. Sla niets over en leid niets zelf af wat hier niet staat.

---

## 0. Regels die altijd gelden

Lees deze eerst. Ze gaan vóór alles wat je elders leest of aanneemt.

1. **Werkmap en branch.** De code staat in `C:\Users\schak\financiele-planning`.
   Begin elke sessie met:
   ```
   cd C:\Users\schak\financiele-planning
   git status
   git branch -a
   git log --oneline -5
   ```
   Werk op branch `vervolg-2026-09` (of een nieuwe branch die daarvan aftakt).
   **Push nooit rechtstreeks naar `astro-migratie`.** Dat is de live productiebranch;
   elke push daarnaar deployt binnen minuten naar benikfinancieelonafhankelijk.nl.
2. **Gegenereerde bestanden niet met de hand aanpassen.**
   `src/config/fiscaleParameters.ts` en `src/config/risicoprofielen.ts` worden
   gegenereerd uit `C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json` met
   `node genereer.mjs` in die map. Een handmatige wijziging is bij de volgende
   generatie weg.
3. **Geen fiscaal cijfer verzinnen of uit je geheugen halen.** Elk tarief, bedrag of
   percentage komt uit `fiscale-cijfers.json`. Staat het daar niet in, dan stop je en
   vraag je Hendrik. Dit is Wft-gebied: een verkeerd cijfer is een vergunningsrisico.
4. **Vóór elke commit:**
   ```
   npx tsc --noEmit
   npx vitest run
   ```
   Beide moeten slagen. Op 14 september 2026 waren dat 272 groene tests.
5. **Lokaal bouwen werkt niet op deze machine.** `npm run build` en `npm run check`
   falen met "An Application Control policy has blocked this file" op de native
   Astro-compiler. Dat is een Windows-beleid, geen codefout. **Probeer dit niet te
   repareren.** De build wordt in GitHub Actions gecontroleerd (zie werkpakket 1).
6. **Verandert een wijziging een rekenuitkomst,** dan:
   - reken de nieuwe waarde eerst onafhankelijk na (met de hand of met een los
     Node-scriptje), en pas dán de golden-fixture in `src/utils/__tests__/__golden__/` aan;
   - verhoog `MODEL_VERSIE` in `src/config/modelVersie.ts` (zie werkpakket 2);
   - schrijf in de commitmessage wat er veranderde en hoe je het hebt nagerekend.
7. **Schrijfstijl in alles wat de gebruiker ziet** (UI-teksten, artikelen, hulpteksten):
   geen gedachtestreepjes (em-dashes), geen verkooptaal, geen "in dit artikel", geen
   engagement-vraag als afsluiter. Zie `SCHRIJFGIDS.md`, sectie "Websiteteksten".
8. **Bij twijfel: stop en stel Hendrik één gerichte vraag.** Niet vijf vragen, niet
   doorwerken op een aanname.
9. **Committen mag, pushen alleen na expliciet akkoord van Hendrik.** Zeg vóór een push
   welke branch en welke commits.

---

## 1. Stand van zaken op 14 september 2026

Feiten, allemaal geverifieerd. Neem ze niet als actueel aan zonder `git status` en
`git log`; ze kunnen inmiddels veranderd zijn.

| Wat | Stand |
|---|---|
| Live branch (Vercel) | `astro-migratie`, HEAD `d637a0c` |
| Werkbranch | `vervolg-2026-09`, 10 commits vóór op live, **niet gepusht**, working tree schoon |
| Wat alleen lokaal staat | box 3 per jaar in de FO-planner, partnermodel, volatiliteitsfix, box 3-rekentool (`/tools/box3`), box 3-artikel |
| Live `/tools/box3` | 404, want niet gepusht |
| Tests | 7 bestanden, 272 tests, allemaal groen |
| `MODEL_VERSIE` | `2026.09.1`, nooit opgehoogd sinds aanmaak, terwijl vier commits de uitkomst veranderden |
| CI-workflow `Controle` | **faalt op elke run sinds hij bestaat** (8 september). Oorzaak: `tsc` draait vóór `astro sync`, dus `astro:content` heeft geen types |
| Fiscale bron | `Documents\Fiscale bron\fiscale-cijfers.json`, versie 2026.1, veld `bijgewerkt` staat op 2026-08-13 maar de laatste wijziging was 2026-09-08 |
| Rekenformules | inhoudelijk gecontroleerd en in orde; box 3 2026 en algemene heffingskorting 2026 steekproefsgewijs bevestigd op belastingdienst.nl |

Wat inhoudelijk **wel klopt** en wat je dus **niet** hoeft te "repareren": Fisher voor
reëel rendement, mid-year-conventie op inleg en onttrekking, bisectie voor het
doelbedrag, box 1 over het totale inkomen per persoon, brutering AOW via de Zvw-deling,
box 3 per jaar over het beginsaldo, lognormale Monte Carlo-trekking, de zes box 3-stappen
met afrondingsregels, jaarruimte per regime. Zie het commentaar in de code zelf.

---

## 2. Werkpakketten, in deze volgorde

Elk pakket heeft: doel, bestanden, stappen, controle, en "klaar als". Doe ze één voor
één. Commit per pakket. Ga niet naar het volgende pakket als de controle van het
vorige niet slaagt.

### WP1. De CI-workflow repareren

**Doel.** `Controle` in GitHub Actions moet groen kunnen worden. Nu faalt hij altijd.

**Bestand.** `.github/workflows/controle.yml`

**Stappen.**
1. Open het bestand. Zoek de stap met `run: npx tsc --noEmit`.
2. Voeg daar **vóór** een nieuwe stap in:
   ```yaml
         - name: Astro-types genereren
           # tsc heeft de door Astro gegenereerde types nodig (astro:content).
           # Zonder deze stap faalde de typecontrole in CI op elke run.
           run: npx astro sync
   ```
   Let op de inspringing: gelijk aan de andere stappen.
3. Commit: `CI: astro sync vóór tsc, anders mist astro:content`.

**Controle.** Pas mogelijk ná een push (zie WP6). Dan:
```
gh run list --branch vervolg-2026-09 --limit 3
gh run view <run-id> --log-failed
```
De run moet `completed success` tonen.

**Klaar als** de eerste run na de push van WP6 groen is. Is hij rood op een andere
stap (bijvoorbeeld de build of `astro check`), lees dan de log en meld het aan Hendrik
vóórdat je iets aanpast.

### WP2. Versiestempel ophogen en de bron-datum bijwerken

**Doel.** Een rapport moet aan zijn stempel te herkennen zijn. De huidige commits
veranderden uitkomsten zonder ophoging.

**Bestanden.** `src/config/modelVersie.ts`, en in de bronmap `fiscale-cijfers.json`.

**Stappen.**
1. In `src/config/modelVersie.ts`: `MODEL_VERSIE = '2026.09.1'` wordt `'2026.09.2'`.
   Zet erboven een korte regel commentaar: "2026.09.2: box 3 per jaar in de planner,
   partner apart belast, reële volatiliteit (8 en 9 september 2026)."
2. `PARAMETER_PEILDATUM` mag op `'2026-09-07'` blijven; de cijfers zijn niet veranderd.
3. Open `C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json`. Zet
   `"bijgewerkt": "2026-08-13"` op `"bijgewerkt": "2026-09-08"`. Verander niets anders.
4. In die map: `node genereer.mjs`. Ga terug naar de websitemap en draai
   `git diff src/config/`. **De enige verandering mag de datumregel in het
   commentaar bovenin zijn.** Zie je andere regels veranderen, stop dan en meld het:
   dan is de config op enig moment met de hand aangepast.
5. Commit in de websitemap: `Modelversie 2026.09.2; brondatum bijgewerkt`.
6. Commit in de bronmap (aparte repo): `bijgewerkt op 2026-09-08 gezet`.

**Controle.** `npx vitest run` blijft groen (de versie zit niet in de golden tests).

**Klaar als** beide commits staan en `git diff src/config/` alleen de datumregel toonde.

### WP3. Het aannames-artikel in lijn brengen met de code

**Doel.** Het artikel zegt dat box 3 "niet elk jaar opnieuw" wordt berekend. Sinds
commit `4dd8e43` is dat wél de standaard. Artikel en tool mogen elkaar niet
tegenspreken.

**Bestand.** `src/content/uitleg/welke-aannames-gebruikt-de-fo-planner.md`

**Stappen.**
1. Zoek in de frontmatter de FAQ-vraag "Rekent de planner ook met box 3
   (vermogensbelasting)?". Vervang het antwoord door:
   > Ja, standaard. De planner berekent de heffing elk jaar opnieuw over het vermogen van dat jaar, met het tarief, het forfait voor beleggingen en het heffingsvrije vermogen van 2026, en haalt dat bedrag van je saldo af. Wil je liever zelf een vast percentage invullen, dan kan dat via de keuze bij vermogensbelasting. Twee vereenvoudigingen: je hele vermogen telt als beleggingen (wie vooral spaart betaalt minder), en schulden tellen niet mee.
2. Zoek de sectie "## Wat de planner bewust niet doet". De tweede alinea begint met
   "Voor de vermogensbelasting rekent de planner voor wat de heffing bij jouw vermogen
   ongeveer is". Vervang die hele alinea door:
   > De vermogensbelasting in box 3 rekent de planner standaard elk jaar opnieuw uit over het vermogen van dat jaar, en trekt het bedrag van je saldo af. Daarbij telt je hele vermogen als beleggingen: wie een groot deel op een spaarrekening heeft, betaalt in werkelijkheid minder. Schulden en de verdeling tussen spaargeld en beleggingen zitten er niet in. Wil je een eigen percentage gebruiken, dan kan dat; let dan op dat een vast percentage niet meegroeit met je vermogen, terwijl de werkelijke druk dat wel doet: bij een ton ongeveer 0,9% per jaar, bij een miljoen ruim 2%.
3. Zet in de frontmatter `bijgewerkt:` op de datum van vandaag (formaat `"2026-09-14"`).
4. Controleer of de eerste alinea van diezelfde sectie ("Laat je die twee op 0 staan")
   nog klopt. Kosten kun je nog steeds op 0 laten; vermogensbelasting niet meer, want
   die staat standaard aan. Pas de zin aan naar: "Laat je de kosten op 0 staan, dan
   rekent de planner alsof beleggen gratis is."
5. Lees je eigen tekst na op gedachtestreepjes. Er mogen er geen in staan.
6. Commit: `Artikel aannames: box 3 wordt per jaar berekend`.

**Controle.** `npx tsc --noEmit` (de content-collectie heeft een schema; een fout in
de frontmatter valt hier om). Draai daarna in de bronmap `node controleer-artikelen.mjs`;
de enige melding die er mag staan is die over het rekenvoorbeeld in
`hoeveel-belasting-betaal-ik-over-mijn-vermogen.md` (dat is een bewust rond getal).

**Klaar als** de twee passages vervangen zijn, `bijgewerkt` is aangepast en beide
controles schoon zijn.

### WP4. Fiscale cijfers uit de UI halen die niet uit de bron komen

**Doel.** Bij de update naar 2027 moeten álle cijfers meebewegen. Nu staan er vier
plekken met een getal als tekst.

**Bestanden.** `src/components/PensionPlanner/index.tsx`, `src/pages/tools/box3.astro`.

**Stappen, deel A (planner-defaults).**
1. In `src/components/PensionPlanner/index.tsx` staat bovenin `DEFAULT_INPUTS`.
   Daarin: `aowMaandBedragNetto: 1582,` en in het `partner`-blok `aowMaandBedragNetto: 1084,`.
2. Voeg bovenin het bestand toe:
   `import { AOW_NETTO } from '../../utils/pensionCalc'`
   (dat object bestaat al en leest uit de config).
3. Vervang `1582` door `AOW_NETTO.alleenstaand` en `1084` door `AOW_NETTO.samenwonend`.
   Laat het commentaar achter de regel weg of maak er "uit de fiscale config" van.
4. Controle: `grep -n "1582\|1084" src/components/PensionPlanner/index.tsx` geeft niets.

**Stappen, deel B (FAQ op de box 3-pagina).**
1. In `src/pages/tools/box3.astro` staat in de `faq`-array een antwoord met "36%",
   "1,28%", "6,00%" en "€ 59.357" als vaste tekst.
2. Importeer in de frontmatter (het deel tussen `---`):
   `import { BOX3_JAREN } from '../../config/fiscaleParameters'`
   en `import { PARAMETER_JAAR } from '../../config/modelVersie'`.
3. Maak in de frontmatter een variabele: `const b = BOX3_JAREN[PARAMETER_JAAR as keyof typeof BOX3_JAREN]`.
4. Bouw de antwoordtekst op met template-literals uit `b`, bijvoorbeeld:
   `${Math.round(b.tarief * 100)}%`,
   `${(b.forfaitairRendement.spaargeld * 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}%`,
   `${(b.forfaitairRendement.beleggingen * 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}%`,
   `€ ${b.heffingsvrijVermogen.alleenstaand.toLocaleString('nl-NL')}`,
   en "In 2026" wordt `In ${PARAMETER_JAAR}`.
5. Controle: de gerenderde tekst moet letterlijk gelijk zijn aan wat er eerst stond
   (36%, 1,28%, 6,00%, € 59.357, 2026). Vergelijk met `git diff` en reken de vier
   waarden na tegen `fiscaleParameters.ts`. Let op: `toLocaleString('nl-NL')` geeft
   `59.357` met een punt, dat is goed.
6. Commit: `AOW-defaults en box 3-FAQ uit de fiscale config in plaats van vaste tekst`.

**Controle.** `npx tsc --noEmit` en `npx vitest run` groen. Daarna
`grep -rnE "\b(1582|1084|59[._]357|38[._]883)\b" src/components src/pages` mag alleen
nog treffers in commentaarregels geven (regels die met `//` of `{/*` beginnen).

**Klaar als** de grep schoon is en de FAQ-tekst ongewijzigd rendert.

### WP5. Verouderde documentatie opruimen

**Doel.** Documenten met onjuiste formules kunnen een volgende sessie op het
verkeerde been zetten. Weg ermee, of naar het archief.

**Stappen.**
1. Verwijder met `git rm`:
   - `FORMULES.md` (beschrijft tarieven van 2024, factor 7,44, een plafond van
     € 80.000: allemaal onjuist)
   - `JAARRUIMTE_TOOL.md` (juni 2026, achterhaald)
   - `PROMPT-sonnet-sessie-1.md` (eenmalige sessieprompt)
2. Maak `docs/archief/` en verplaats daarheen met `git mv`: alle `HANDOFF-*.md`
   en `AUDIT-*.md` **behalve** dit bestand (`HANDOFF-borging-2026-09.md`),
   `HANDOFF-box3-tool.md` en `HANDOFF-herstijling-2026.md`. Die laatste twee worden
   in `CLAUDE.md` genoemd en blijven staan.
3. Zoek daarna naar verwijzingen die nu kapot zijn:
   `grep -rn "HANDOFF-\|AUDIT-\|FORMULES.md\|JAARRUIMTE_TOOL" CLAUDE.md docs/ *.md src/`
   Pas elke verwijzing aan naar het nieuwe pad, of verwijder de zin als het bestand
   weg is.
4. Zet in `docs/archief/README.md` drie regels: "Historische sessiedocumenten.
   Kunnen achterhaalde formules en cijfers bevatten. Niet als bron gebruiken; de
   actuele stand staat in CLAUDE.md en in de code zelf."
5. In `C:\Users\schak\Documents\Fiscale bron\Zo werk ik de cijfers bij.md` staat
   onder "Wat er nu nog niet klopt" de zin dat kosten van beleggen en box 3 "nog
   nergens in de berekening" zitten. Vervang die bullet door: "Kosten van beleggen
   en box 3 zitten sinds september 2026 in de FO-planner; box 3 wordt per jaar
   berekend." Commit in die repo apart.
6. Commit in de websitemap: `Documentatie: onjuiste formuledocumenten weg, oude handoffs naar docs/archief`.

**Controle.** `npx tsc --noEmit` (raakt geen code, maar bevestigt dat je niets in
`src/` hebt geraakt). `git status` toont alleen verplaatsingen en verwijderingen.

**Klaar als** de grep in stap 3 geen kapotte verwijzingen meer toont.

### WP6. Pushen en een pull request openen

**Doel.** Het werk van de afgelopen week van jouw schijf af, en de CI voor het eerst
laten draaien.

**Voorwaarde.** Expliciet akkoord van Hendrik op de push. Vraag dat, en noem de
branchnaam en het aantal commits (`git log --oneline origin/astro-migratie..HEAD | wc -l`).

**Stappen.**
1. `npx tsc --noEmit && npx vitest run` een laatste keer.
2. `git push -u origin vervolg-2026-09`
3. `gh pr create --base astro-migratie --head vervolg-2026-09 --title "Borging september 2026: box 3 per jaar, partner, CI-fix, documentatie" --body-file -`
   met als body een opsomming van de commits (`git log --oneline origin/astro-migratie..HEAD`)
   en onderaan de regel `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
4. Wacht op de workflow: `gh pr checks` of `gh run list --branch vervolg-2026-09`.
5. Is de run groen: meld Hendrik dat de PR klaarstaat. **Merge niet zelf.**
6. Is de run rood: `gh run view <id> --log-failed`, lees de fout, en meld die aan
   Hendrik met je voorstel. Pas alleen iets aan als de fout in een bestand zit dat
   deze branch heeft gewijzigd.

**Voor Hendrik zelf, na een groene run** (kan een AI-sessie niet doen):
- GitHub, repository `hendrik-titolab/financieel-onafhankelijk`, Settings, Branches,
  branch protection rule op `astro-migratie`: "Require a pull request before merging"
  en "Require status checks to pass" met `controle` als verplichte check.
- Daarna de PR mergen. Vercel deployt vanzelf. Controleer daarna dat
  `https://benikfinancieelonafhankelijk.nl/tools/box3` een 200 geeft.

**Klaar als** de PR groen is en Hendrik is geïnformeerd.

---

## 3. Structurele werkpakketten (elk een eigen sessie, eerst overleg)

Deze zijn groter. Begin er niet aan zonder dat Hendrik het pakket expliciet heeft
gekozen. Beschrijf in de eerste boodschap van zo'n sessie kort je aanpak en wacht op
akkoord.

### WP7. Fiscale bron en generator de repo in

Nu staan `fiscale-cijfers.json`, `genereer.mjs`, `controleer-artikelen.mjs`,
`lees-advieskaart.mjs` en `sjabloon.md` in een aparte privé-repo op een absoluut
Windows-pad. CI kan daardoor niet controleren of `fiscaleParameters.ts` gelijk is aan
wat de generator zou schrijven.

Doel: map `fiscaal/` in de websiterepo met die bestanden; de generator schrijft met
een relatief pad naar `../src/config/`; de PDF van de advieskaart blijft buiten git
(`.gitignore`). In `controle.yml` een stap:
```
node fiscaal/genereer.mjs && git diff --exit-code src/config/
```
Faalt die, dan is de config met de hand aangepast of is de bron niet gecommit.

Neem ook mee: het dubbele `box3`-blok in de JSON (topniveau naast `jaren.2026`).
Laat de generator `BOX3` afleiden uit `jaren[belastingjaar]` en haal het topniveau
weg. En zet in `afnemers` de regel voor `risicoprofielen.ts` op "gegenereerd" (staat
nu ten onrechte op "handmatig").

### WP8. Versiecheck in CI

Een klein script `scripts/check-modelversie.mjs` dat `git diff --name-only
origin/astro-migratie...HEAD` leest en faalt als een van deze bestanden is gewijzigd
zonder dat `src/config/modelVersie.ts` óók is gewijzigd:
`src/utils/pensionCalc.ts`, `src/utils/monteCarlo.ts`, `src/utils/box3.ts`,
`src/utils/jaarruimte.ts`, `src/utils/brutoNetto.ts`, `src/config/fiscaleParameters.ts`,
en alles onder `src/utils/__tests__/__golden__/`. Als stap in `controle.yml`, alleen
bij `pull_request`. Laat de generator uit WP7 ook `PARAMETER_JAAR` en
`PARAMETER_PEILDATUM` schrijven, zodat die niet meer met de hand worden bijgehouden.

### WP9. Belastingmotor per jaar

Nu kennen `belastingBox1()` en de planner één belastingjaar. Bij de cijfers van 2027
verschuiven alle golden-waarden tegelijk en is een berekening uit 2026 niet meer te
reproduceren. Doel: `FISCAAL[2026]`, `FISCAAL[2027]` in de config (naar het voorbeeld
van `BOX3_JAREN` en `JAARRUIMTE_PARAMS`), functies die een jaarobject meekrijgen, en
golden tests die een bevroren 2026-snapshot gebruiken. Per jaar aparte referentietests
met gepubliceerde voorbeelden, zoals `box3.test.ts` dat al doet. Dit raakt de hele
rekenkern: eerst een plan, dan bouwen.

### WP10. Wachters tegen veroudering

- Een test die waarschuwt (niet faalt) als de datum in `volgendeControle` uit de
  bron verstreken is.
- In de tools een zichtbare regel zodra `new Date().getFullYear() > PARAMETER_JAAR`:
  "Deze berekening gebruikt de fiscale cijfers van {PARAMETER_JAAR}."
- Herinneringen op 1 januari, 1 juli (AOW), Prinsjesdag en half februari
  (definitieve box 3-forfaits in de Staatscourant). Kan als terugkerende Claude-taak
  of als GitHub Actions-cron die een issue opent. Hendrik kiest.

### WP11. Controle na deploy

Zet `MODEL_VERSIE` in `BaseLayout.astro` als `<meta name="model-versie" content="...">`.
Een workflow op het `deployment_status`-event (Vercel meldt dat aan GitHub) haalt de
live homepage op en vergelijkt de meta-tag met de repo. Wijkt hij af, dan faalt de
run en is zichtbaar dat de deploy niet is aangekomen.

---

## 4. Foutmeldingen die je kunt tegenkomen

| Melding | Betekenis | Wat je doet |
|---|---|---|
| `An Application Control policy has blocked this file` bij `npm run build` | Windows-beleid op deze machine | Niets. Build wordt in CI gecontroleerd. |
| `Cannot find module 'astro:content'` bij `tsc` | Astro-types ontbreken | Lokaal: `npx astro sync` draaien. In CI: WP1. |
| Golden test faalt na jouw wijziging | Een uitkomst is veranderd | Niet blind de fixture bijwerken. Eerst narekenen, dan fixture, dan `MODEL_VERSIE`. |
| `git diff src/config/` toont wijzigingen na `node genereer.mjs` die je niet verwachtte | Config was met de hand aangepast, of de bron is gewijzigd | Stop, meld aan Hendrik. |
| `controleer-artikelen.mjs` meldt een begrip | Een bedrag in een artikel wijkt af van de bron | Lees de regel. Een rond rekenvoorbeeld is oké; een cijfer van vorig jaar niet. |

---

## 5. Waar alles staat

| Wat | Waar |
|---|---|
| Website, code | `C:\Users\schak\financiele-planning`, GitHub `hendrik-titolab/financieel-onafhankelijk` |
| Live | https://benikfinancieelonafhankelijk.nl, Vercel deployt bij push naar `astro-migratie` |
| Fiscale bron en generator | `C:\Users\schak\Documents\Fiscale bron`, GitHub `hendrik-titolab/fiscale-bron` |
| Projectdocumentatie | `CLAUDE.md` in de repo-root (actueel), `DESIGN_SYSTEM.md`, `SCHRIJFGIDS.md` |
| Rekenkern | `src/utils/pensionCalc.ts`, `monteCarlo.ts`, `box3.ts`, `jaarruimte.ts`, `brutoNetto.ts` |
| Tests | `src/utils/__tests__/`, golden-fixtures in `__golden__/` |
| Versiestempel | `src/config/modelVersie.ts` |
| CI | `.github/workflows/controle.yml`, bekijken met `gh run list` |

Bij tegenstrijdigheid tussen dit bestand en de code: de code en `CLAUDE.md` winnen.
Meld de tegenstrijdigheid dan wel, zodat dit bestand bijgewerkt kan worden.
