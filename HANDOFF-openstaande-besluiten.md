# FO-planner: openstaande besluiten en acties

> Bijgewerkt 13 augustus 2026. **Dit is het startpunt.** Alles wat uit de audit van augustus 2026
> nog openstaat, staat hier op één plek, geordend naar wat jij moet beslissen en wat daarna gebouwd
> kan worden. Bedoeld om in één gesprek door te nemen.
>
> Werkende map `C:\Users\schak\financiele-planning`, branch `astro-migratie` (live productiebranch,
> Vercel deployt automatisch bij elke push).

## Hoe dit document zich verhoudt tot de rest

Er liggen vier auditdocumenten en drie sessie-hand-offs. Je hoeft ze niet allemaal te lezen.

| Document | Waarvoor |
|---|---|
| **Dit document** | Wat er open staat en wat jij moet beslissen |
| `AUDIT-2026-08-bevindingen.md` | De volledige scan-tabel met alle 50+ bevindingen en detailkaarten |
| `FISCALE-BRONNEN.md` | Doorlopend naslagwerk voor alle fiscale cijfers. **Werk je zelf 2x per jaar bij** |
| `HANDOFF-audit-2026-08-rekenlogica.md` | Onderbouwing per punt van blok 2 en 3 |
| `HANDOFF-blok1-2026-08.md`, `HANDOFF-blok2-2026-08.md` | Gemeten waarden en afwegingen per fix |
| `AUDIT-fase0-1-feiten.md`, `AUDIT-fase3-livetests.md` | Codecitaten en live testbewijs |

---

## Wat er al af en live is

| Blok | Wat | Status |
|---|---|---|
| Audit, vier fases | Codeverificatie, externe bronnen, live tests, synthese | Af |
| Groep 1 | Elf mechanische bevindingen plus A10 | Live |
| Testharnas (G1) | Vitest, 50 golden-master-tests, `npm run test` | Live |
| Rekenlogica | E1-A, A1, E9, E6, E7, E8 | Live |
| Blok 1 | A3+E10, A5, A18, A22, reserveringsruimte, A21 | Live |

De twee zichtbaarste veranderingen voor bezoekers, mocht er iets over binnenkomen:

- **E8**: slagingskansen zijn gestegen. De Monte Carlo trok rond het rekenkundige gemiddelde en
  compoundde dat, waardoor de mediaan 34% onder de deterministische lijn in dezelfde grafiek lag.
  Nu ligt hij erop.
- **A3**: een negatief eindvermogen toont nu zijn minteken. Voorheen liet een grotere tegenvaller
  een hóger eindvermogen zien, precies omgekeerd.

Terugdraaipunten: merge-commit `60b352f` (audit) en `01e67eb` (blok 1).

---

# Deel 1 — de besluiten die ik van jou nodig heb

Zeven stuks. De eerste twee blokkeren het meeste vervolgwerk.

## 1. De 🟡-bronnen in `FISCALE-BRONNEN.md` §5, de jaarruimteparameters

**Dit is de zwaarste openstaande post en het enige echte Wft-risico dat nog live staat.**

Op de jaarruimtepagina staan voor belastingjaar 2020 twee tegenstrijdige formules op één scherm
("13,3% − 7,44" tweemaal, "30% − 6,27" eenmaal), en het getoonde resultaat (€ 2.046 bij factor A
€ 1.000) volgt geen van beide teksten als je ze letterlijk narekent. Twee keer fout, niet één keer.
Daarnaast wijken de parameters van de site af van die in je eigen jaarruimte-skill (bevinding F1).

**Wat ik van jou nodig heb:** jouw oordeel over welke kant klopt, de toelichtende tekst of de
onderliggende jaardata. Dat kan niemand anders bepalen: het auditplan schrijft voor dat jij elke
externe bron zelf controleert, en de bronnen voor deze jaren staan nog op geel.

**Wat er daarna gebeurt:** A7 en de jaarruimte-configfixes uit §5 kunnen dan meteen door.

## 2. E2 — box 3 modelleren, ja of nee?

Nu volledig afwezig. Voor jouw doelgroep (groot vrij belegd vermogen) is dit de grootste ontbrekende
kostenpost, groter dan het verschil tussen twee risicoprofielen. De FAQ zegt nu dat box 3 bewust
wordt weggelaten omdat het de uitkomst minder betrouwbaar zou maken.

**Mijn aanbeveling: wel doen, simpel gehouden.** Forfait en tarief uit `fiscaleParameters.ts`, geen
verfijning naar vermogensmix. Het huidige argument houdt geen stand als juist de weglating de
grootste afwijking veroorzaakt.

## 3. E3 — kostenveld, of alleen microcopy?

Het ingevulde rendement wordt behandeld als wat de gebruiker netto overhoudt. 0,5% kosten per jaar
over 30 jaar scheelt circa 14% eindvermogen (1,005³⁰ = 1,161).

**Mijn aanbeveling: een kostenveld met een realistische default.** Microcopy die om "rendement ná
kosten" vraagt is goedkoper, maar verschuift het rekenwerk naar de gebruiker en die doet het niet.

## 4. E5 — indexatieveld, of alleen FAQ?

Het model houdt AOW en aanvullend pensioen constant in reële euro's, en neemt dus aan dat beide exact
met de inflatie meestijgen. Voor AOW verdedigbaar, voor aanvullend pensioen niet: indexatie is
voorwaardelijk. 1%-punt achterstand per jaar over 30 jaar geeft een 26% lagere reële uitkering dan
het model toont.

**Mijn aanbeveling: een indexatieveld voor het aanvullend pensioen, AOW laten zoals het is.** Een
FAQ-vermelding dekt een afwijking van deze omvang niet af.

## 5. B7 — drie verschillende inflatiecijfers op één site

Uitgezocht en bevestigd, niet gefixt want het is een redactionele keuze.

| Plek | Cijfer |
|---|---|
| FO-planner, default van het inflatieveld | 2,5% |
| FO-planner, hulptekst direct ónder datzelfde veld | circa 3,5% (CBS 1960-2025) |
| Vier artikelen | 3% |
| `welke-aannames-gebruikt-de-fo-planner.md` | 2,5% |

De vervelendste is de eerste twee samen: één scherm, twee getallen, geen uitleg. **Kiezen:** default
omhoog, hulptekst aanpassen, of één zin die het verschil verklaart (2,5% ligt dichter bij het
ECB-doel, 3,5% is het historische Nederlandse gemiddelde).

## 6. A8/A9 — stille terugval op 2026-cijfers

Bij een jaar waarvoor geen parameters bestaan valt `getParams()` stil terug op 2026 in plaats van te
melden dat het jaar ontbreekt. Geen melding, wel een verkeerd bedrag.

**Mijn aanbeveling: falen met een duidelijke melding.** In het Wft-domein is een zichtbare fout beter
dan een onzichtbaar verkeerd cijfer. Ik zie hier eerlijk gezegd maar één verdedigbaar antwoord.

Bijvraag: wil je 2015 kunnen kiezen als reserveringsruimtejaar? Dan moeten eerst de parameters voor
2015 erin.

## 7. A19 — `currentIncome` weghalen of labelen?

Het veld wordt ingevuld maar nergens in de berekening gebruikt, alleen in de Excel-export. Kiezen:
weghalen, of labelen als "alleen voor je eigen dossier".

---

# Deel 2 — wat er gebouwd wordt zodra de besluiten er zijn

## E4 — begin hier. Geen besluit nodig, wel het meeste werk.

**De enige hoge bevinding die de gebruiker te somber stemt in plaats van te optimistisch.** Live
gemeten op € 30.000 bruto: de Bruto-nettotool zegt € 2.313 netto per maand, de FO-planner € 1.606.
**Verschil € 707 per maand, op dezelfde site.** Oorzaak: `pensionCalc.ts`'s `brutoToNetto()` kent
geen heffingskortingen.

Twee blokkades zijn al weggehaald:

- **De cijfers staan er, met bron.** `FISCALE-BRONNEN.md` §3 bevat de post-AOW heffingskortingen
  (algemene heffingskorting, ouderenkorting, alleenstaandeouderenkorting, arbeidskorting),
  rechtstreeks van belastingdienst.nl, met URL en raadpleegdatum, klaar als config-object.
  **Controleer ze zelf tegen de bron voordat ze de config in gaan.**
- **De rekenlogica is testbaar.** De bruto-nettoberekening staat nu in `src/utils/brutoNetto.ts`
  met 17 golden-master-tests op alle knikpunten (A21).

**Aanpak:** één functie die het *totale* bruto box 1-inkomen belast, inclusief heffingskortingen, met
AOW, werkgeverspensioen en straks lijfrente als stapelende bronnen. Niet per bron apart, want de
kortingen zijn inkomensafhankelijk over het totaal.

**De val in deze klus:** `AOW_NETTO_MAAND` is al een nettobedrag inclusief heffingskorting. Ga je de
kortingen expliciet berekenen, dan tel je ze dubbel.

**Wat de bouw stuurt:** tussen € 46.002 en € 59.783 stapelen het schijftarief 37,56%, de afbouw van
de ouderenkorting 15% en de afbouw van de algemene heffingskorting 3,195% op tot ruim boven 50%
marginaal. Dat effect kent de FO-planner nu helemaal niet. Wie denkt dat een AOW'er "maar 19%
betaalt" over zijn aanvullend pensioen, zit er ver naast.

## E1-optie-B — jouw veld "waarvan fiscaal beklemd", ná E4

Drie redenen waarom het niet eerder kan:

1. **Het hangt vast aan E4.** `brutoToNetto`/`nettoToBruto` rekenen vanaf schijf 1, terwijl een
   lijfrente-uitkering marginaal bovenop AOW en werkgeverspensioen belast wordt. Bruteren met de
   huidige motor levert een nieuwe, subtielere rekenfout op: minder zichtbaar dan de fout die je
   ermee repareert.
2. **Een lijfrentepot is geen pot waar je vrij uit onttrekt.** Bij expiratie moet het kapitaal worden
   omgezet in periodieke uitkeringen (art. 3.125 Wet IB 2001). Modelleer je het als vermogen waar de
   tool naar behoefte uit put, dan modelleer je iets wat wettelijk niet mag.
3. **Aanbevolen ontwerp:** invoerveld onder vermogen (dat is wat de gebruiker op zijn overzicht
   ziet), intern omgezet naar een bruto periodieke uitkering vanaf de pensioendatum, behandeld als
   derde inkomensbron naast AOW en werkgeverspensioen. Het bedrag moet uit `currentCapital` gehaald
   worden vóór de vrije-onttrekkingslogica én vóór de Monte Carlo, anders telt het dubbel.
   `nettoToBruto` (nu dode code, bevinding A20) wordt daarmee alsnog nuttig.

**Actie voor jou vooraf:** het maximum jaarbedrag voor een tijdelijke oudedagslijfrente in 2026 en de
minimumlooptijd opzoeken, met bron, in `FISCALE-BRONNEN.md`. Zonder die twee cijfers kan dit niet
gebouwd worden.

## De inlegconventie in `simulateAccumulation`

`monthlyPMT * 12` wordt pas ná de jaarlijkse rendementsfactor bijgeschreven, terwijl de inleg
maandelijks is: geen rendement over de eigen inleg in het jaar zelf. Bewust blijven laten liggen bij
E9 omdat `monteCarlo.ts` het identiek doet en de twee onderling consistent blijven. **Los je het op,
doe het in beide bestanden tegelijk**, anders lopen ze uit elkaar.

---

# Deel 3 — kleinere posten, geen haast

- **B2, B4, B5** — tijdsgebonden claims in de content (spaarrente, CBS-cijfers, het
  30%-jaarruimtepercentage, AOW/Trinity/Cagan/DNB). Wacht op bronverificatie, laag tot midden risico.
- **F2** — bron per waarde in plaats van één bron voor de hele set. `FISCALE-BRONNEN.md` is daar het
  begin van: §1, §2 en §3 hebben nu een bron per blok met datum, §5 nog niet.
- **J2** — welke aannames in de FAQ zouden moeten staan. Deels ingelost met de E1-A-toevoeging, niet
  systematisch nagelopen.
- **Cosmetisch:** de UI toont `−€ 483.631` terwijl de PDF- en Excel-export `€ -483.631` maken.
  Inconsistent, geen rekenfout.
- **A6** — Box-Muller zonder epsilon-guard. Kans verwaarloosbaar, bewust niet gefixt.

---

# Werkwijze die zich over drie sessies bewees

- **Elke rekenwijziging onafhankelijk narekenen vóór het bijwerken van een golden-fixture, niet
  andersom.** Dit haalde een fout in een eerder hand-off-document boven water (E9: "verwijder de
  `+ 0.5`" was verkeerd, het moest `+ 1` zijn) en liet zien dat de E6-fix geen numeriek effect heeft.
  Beide waren onzichtbaar geweest bij klakkeloos regenereren.
- **Let op bij UI-tests:** React luistert voor `onBlur` op `focusout`. Een test die de waarde zet via
  een synthetisch `blur`-event lijkt te bewijzen dat er niets gebeurt, terwijl de code gewoon werkt.
  Dat kostte een sessie een verkeerde conclusie bij A5. Elke UI-test hier die met synthetische events
  werkt, is om deze reden verdacht.
- Live controleren via de preview-tools, met de waarden **uit de DOM gelezen** in plaats van van een
  screenshot afgelezen.
- Vóór elke commit: `npm run test`, `npm run build`, `npm run check`. De laatste heeft één bekende
  fout (`ts(7016)` in `exportExcel.ts`) uit de Fase 0-baseline; alles daarboven is een regressie.
- Werken op een eigen branch, mergen met `--no-ff`, zodat er één terugdraaipunt per blok is.
