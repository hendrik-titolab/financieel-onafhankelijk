# Hand-off voor vrijdag — blok 2 en wat er verder ligt

> Branch `fix-blok1-2026-08`, negen commits, afgetakt van `astro-migratie` (`60b352f`).
> **Nog niet gemerged en niet live.**
> Begin bij "Wat je als eerste moet beslissen". Daarna is E4 het echte werk.

---

## Stand van zaken

| Wat | Status |
|---|---|
| Audit, alle vier de fases | Af |
| Fixronde groep 1, elf mechanische bevindingen | Af, live |
| Rekenlogica-cluster (E1-A, A1, E9, E6, E7, E8) | Af, live |
| Blok 1: A3, A5, A18, A22, reserveringsruimte | Af, **op de branch, niet gemerged** |
| Voorbereiding E4: bronnen en testbaarheid | Af, **op de branch** |
| Blok 2: E4, E1-B, E2, E3, E5 | Ligt open, dit document |
| Blok 3: F1, A7, B2, B4, B5, F2 | Wacht op jouw bronbeoordeling |

Tests: 50 groen (was 33). `npm run build` schoon. `npm run check` onveranderd op de
bekende `exportExcel.ts`-melding uit de Fase 0-baseline.

---

## Wat je als eerste moet beslissen

Vijf dingen. De eerste twee blokkeren het meeste werk.

1. **Merge je blok 1?** A3 verandert een zichtbaar getal op de hoofdpagina (een
   negatief eindvermogen toont nu zijn minteken). Alles staat in
   `HANDOFF-blok1-2026-08.md` met de gemeten waarden.
2. **De 🟡-bronnen in `FISCALE-BRONNEN.md` §5, de jaarruimteparameters.** Hier
   hangt F1 en A7 aan, en dat is de zwaarste openstaande post. Zonder jouw
   oordeel kan niemand zeggen of de tekst of de onderliggende jaardata
   gecorrigeerd moet worden.
3. **E2, box 3 modelleren, ja of nee?** Aanbeveling: ja, simpel gehouden.
4. **E3, kostenveld of alleen microcopy?** Aanbeveling: kostenveld met een
   realistische default.
5. **E5, indexatieveld voor het aanvullend pensioen, of alleen FAQ?**
   Aanbeveling: veld voor het aanvullend pensioen, AOW laten zoals het is.

Kleinere keuzes die ook nog open staan: A8/A9 (de terugval in `getParams()` zelf),
A19 (`currentIncome` weghalen of labelen), en of je 2015 wilt kunnen kiezen als
reserveringsruimtejaar (dan moeten eerst de parameters voor 2015 erin).

---

## E4 is klaar om gebouwd te worden

Dit is de enige hoge bevinding die de gebruiker te **somber** stemt in plaats van
te optimistisch. Live gemeten op € 30.000 bruto: de bruto-nettotool zegt € 2.313
netto per maand, de FO-planner € 1.606. Verschil € 707 per maand, op dezelfde
site.

Twee blokkades zijn deze sessie weggehaald.

### De cijfers staan er, met bron

`FISCALE-BRONNEN.md` §3 is gevuld, alles rechtstreeks van belastingdienst.nl,
geraadpleegd 13 augustus 2026, met URL. Klaar om als config-object toegevoegd te
worden aan `fiscaleParameters.ts`:

```ts
// ─── Heffingskortingen (box 1, AOW-leeftijd bereikt) ────────────────────────
// Bron: Belastingdienst, tabel algemene heffingskorting 2026 en de pagina
// heffingskortingen voor AOW-gerechtigden. Zie FISCALE-BRONNEN.md §3.
export const HEFFINGSKORTING_POST_AOW = {
  algemeneHeffingskorting: {
    max:         1_556,
    afbouwVanaf: 29_736,     // tabel noemt 29.737, de formule rekent vanaf 29.736
    afbouwPct:   0.03195,
    nihilBij:    78_426,
  },
  ouderenkorting: {
    max:         2_067,
    afbouwVanaf: 46_002,
    afbouwPct:   0.15,
    nihilBij:    59_782,
  },
  alleenstaandeouderenkorting: 540,   // niet inkomensafhankelijk
  arbeidskorting: {                    // alleen relevant bij doorwerken na de AOW-leeftijd
    knik1: 11_965, pct1: 0.04156,
    knik2: 25_845, pct2: 0.15483,
    knik3: 45_592, pct3: 0.00974,
    afbouwVanaf: 45_593, afbouwPct: 0.0325,
    max: 2_840,
  },
} as const
```

**Controleer deze cijfers zelf tegen de bron voordat ze de config in gaan.** Dat
is de afspraak uit het auditplan en die geldt hier onverkort.

Twee dingen die opvallen en die het bouwen sturen:

- De algemene heffingskorting na de AOW-leeftijd is vrijwel exact de helft van
  die ervoor. Dat is geen toeval: het AOW-premiedeel valt weg.
- Tussen € 46.002 en € 59.783 stapelen het schijftarief 37,56%, de afbouw van de
  ouderenkorting 15% en de afbouw van de algemene heffingskorting 3,195% op tot
  **ruim boven de 50% marginaal**. Precies dat effect kent de FO-planner nu
  helemaal niet. Wie denkt dat een AOW'er "maar 19% betaalt" over zijn
  aanvullend pensioen, zit er ver naast.

### De rekenlogica is nu testbaar

`A21` is gedaan. De bruto-nettoberekening staat in `src/utils/brutoNetto.ts` in
plaats van in de React-component, met 17 golden-master-tests op alle knikpunten
plus twee eigenschapstests die ook na een fix blijven gelden.

Daarmee kun je nu doen wat eerst niet kon: aantonen dat de twee tools verschillen,
en na de fix bewaken dat ze overeenkomen.

### Aanpak

Eén functie die het **totale** bruto box 1-inkomen belast, inclusief
heffingskortingen, met AOW, werkgeverspensioen en straks lijfrente als stapelende
bronnen. Niet per bron apart, want de kortingen zijn inkomensafhankelijk over het
totaal.

Let op: `AOW_NETTO_MAAND` is al een **netto** bedrag inclusief heffingskorting.
Als je de kortingen straks expliciet gaat berekenen, tel je ze anders dubbel. Dat
is de belangrijkste val in deze klus.

---

## De rest van blok 2

### E1-optie-B, veld "waarvan fiscaal beklemd"

Jouw eigen voorstel. Hoort ná E4, om drie redenen die in
`HANDOFF-audit-2026-08-rekenlogica.md` staan uitgewerkt. Kort: bruteren met de
huidige motor levert een nieuwe, subtielere rekenfout op, en een lijfrentepot is
geen pot waar je vrij uit onttrekt (bij expiratie moet het kapitaal worden omgezet
in periodieke uitkeringen).

Zoek vóór de bouw het maximum jaarbedrag voor een tijdelijke oudedagslijfrente in
2026 op, plus de minimumlooptijd. Hoort met bron in `FISCALE-BRONNEN.md`.

### E2, E3, E5

Wachten op je keuze hierboven. Onderbouwing en aanbeveling per punt staan in
`HANDOFF-audit-2026-08-rekenlogica.md`, deel 2, blok 2.

### De inlegconventie

`monthlyPMT * 12` wordt in `simulateAccumulation` pas ná de jaarlijkse
rendementsfactor bijgeschreven, terwijl de inleg maandelijks is. Er komt dus geen
rendement over de eigen inleg in het jaar zelf. `monteCarlo.ts` doet het identiek,
dus de twee zijn onderling consistent. Als je dit oplost: in beide bestanden
tegelijk, anders gaan ze uit elkaar lopen.

---

## Nieuw deze sessie: B7, drie inflatiecijfers op één site

Uitgezocht en bevestigd, nog niet gefixt want het is een redactionele keuze.

| Plek | Cijfer |
|---|---|
| FO-planner, standaardwaarde van het inflatieveld | 2,5% |
| FO-planner, hulptekst direct ónder datzelfde veld | circa 3,5% (CBS 1960-2025) |
| `sparen-maakt-mensen-arm.md` (3×), `wat-is-de-4-procent-regel.md:27`, `wat-is-inflatie.md:35`, `wanneer-ben-je-financieel-onafhankelijk.mdx:65` | 3% |
| `welke-aannames-gebruikt-de-fo-planner.md:57` | 2,5% |

De vervelendste is de eerste twee samen: het veld staat standaard op 2,5% terwijl
de regel eronder zegt dat het langjarig gemiddelde circa 3,5% is. Dat is één
scherm, twee getallen, geen uitleg waarom ze verschillen. Kiezen: default omhoog,
hulptekst aanpassen, of één zin die het verschil verklaart (bijvoorbeeld dat
2,5% dichter bij het ECB-doel ligt en 3,5% het historische Nederlandse gemiddelde
is).

**Wat wél klopt.** De AOW-bedragen in `hoeveel-aow-krijg-ik.md` (€ 1.558 en
€ 1.068) komen exact overeen met `AOW_NETTO_MAAND`. Het jaarruimtepercentage van
30% in `wat-is-jaarruimte.md:31` komt overeen met de config (externe bevestiging
staat nog open in §5). En de drie rekenvoorbeelden in
`wanneer-ben-je-financieel-onafhankelijk.mdx:53` zijn alle drie exact narekenbaar:
bij € 30.000 opname en 3% reëel geeft de annuïteitsformule € 446.324, € 588.013 en
€ 693.443 voor twintig, dertig en veertig jaar. Het artikel zegt € 446.000,
€ 588.000 en € 693.000.

Eén kleinigheid: `welke-aannames-gebruikt-de-fo-planner.md:57` rekent een
voorbeeld met 7% nominaal rendement, en 7% is geen van de vijf risicoprofielen
(3,0 / 4,5 / 6,0 / 7,5 / 9,0). De som zelf klopt wel: (1,07 / 1,025) − 1 = 4,39%,
het artikel zegt circa 4,4%.

---

## Blok 3, wacht op jou

- **F1 en A7.** De fiscale parameters van de site wijken af van je eigen
  jaarruimte-skill, en op de jaarruimtepagina staan voor jaar 2020 twee
  tegenstrijdige formules op één scherm terwijl het getoonde resultaat geen van
  beide volgt. Zie `FISCALE-BRONNEN.md` §5.
- **De jaarruimte-configfixes**, zelfde blokkade.
- **B2, B4, B5**, tijdsgebonden claims in de content.
- **F2**, bron per waarde in plaats van één bron voor de hele set.
  `FISCALE-BRONNEN.md` is daar het begin van. §1, §2 en §3 hebben nu wel een bron
  per blok met datum, §5 nog niet.

---

## Wat er deze sessie is toegevoegd aan de branch

| Commit | Wat |
|---|---|
| `e420e0e` | A3 + E10, tekenbewuste bedragen |
| `d0bed8f` | A18, stabiele rij-id's |
| `d75c78a` | A22, jaar buiten de looptijd |
| `021254b` | Reserveringsruimte, tien jaar plus parametervloer |
| `1452150` | A5, begrenzing van extreme invoer |
| `92ff5a1` | Opruiming, dode variabele uit de E7-fix |
| `00c6744` | Hand-off blok 1 |
| `b6e24aa` | Fiscale bronnen: post-AOW kortingen, box 1 van geel naar groen |
| `3d6d915` | A21, bruto-netto naar een eigen module met golden tests |

---

## Werkwijze die zich bewees

- Elke rekenwijziging onafhankelijk narekenen vóór het bijwerken van een
  golden-fixture, niet andersom.
- Vóór elke commit: `npm run test`, `npm run build`, `npm run check`.
- Live controleren via de preview-tools, met de waarden **uit de DOM gelezen** in
  plaats van van een screenshot afgelezen.
- **Let op bij UI-tests:** React luistert voor `onBlur` op `focusout`. Een test
  die de waarde zet via een synthetisch `blur`-event lijkt te bewijzen dat er
  niets gebeurt, terwijl de code gewoon werkt. Dat kostte deze sessie een verkeerde
  conclusie bij A5, teruggevonden met een echte Tab. Elke UI-test hier die met
  synthetische events werkt, is om deze reden verdacht.
- Werken op een eigen branch, mergen met `--no-ff`, zodat er één terugdraaipunt is.
