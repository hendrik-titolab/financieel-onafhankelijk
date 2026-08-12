# Audit 2026-08 — Fase 2: externe fiscale bronverificatie

> Uitvoering van `HANDOFF-bugfix-audit-2026-08.md`, Fase 2. Uitsluitend primaire bronnen:
> belastingdienst.nl, wetten.overheid.nl, CBS StatLine, SVB. Geen vergelijkingssites of
> adviseursblogs, ook niet als ze "bevestigen". Elk cijfer krijgt een bron-URL en de datum van
> raadpleging — een cijfer zonder klikbare bron gaat niet in dit document. **Dit is géén
> vaststelling dat een cijfer klopt — dat is aan Hendrik.** Dit is het verzamelen van kandidaat-
> cijfers met bron, zodat hij ze kan controleren in plaats van zelf te hoeven zoeken.

## 1. Jaarruimteparameters (lost F1, F2, A7, B4 in samenhang op)

**Bronnen geraadpleegd, 12 augustus 2026:**
- Officiële 2026-cijfers rechtstreeks van belastingdienst.nl:
  [Uitgaven voor inkomensvoorzieningen (fisin2026)](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2026/uitgaven_voor_inkomensvoorzieningen)
  en [Aftrekken lijfrentepremies](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/lijfrente/aftrekken-lijfrentepremies/aftrekken-lijfrentepremies)
  (10-jaar terugkijktermijn, letterlijk bevestigd).
- Voor de overige jaren: een jaarlijks "Overzicht cijfers levensverzekeringen", **gehost op
  `odb.belastingdienst.nl`** (dus op het domein van de Belastingdienst zelf) maar **opgesteld door
  een derde partij** (Erik van Toledo, fiscaalleven.eu — dit staat letterlijk onderaan elk overzicht).
  Elke regel citeert het exacte wetsartikel (3.127 Wet IB 2001 e.v.), wat onafhankelijke controle
  mogelijk maakt. **Ik behandel dit daarom als een sterke aanwijzing, geen volledig gelijkwaardige
  bron aan een directe belastingdienst.nl-pagina** — voor de 2026-cijfers heb ik dat kunnen
  kruisverifiëren tegen de directe belastingdienst.nl-pagina (zie hieronder, alles klopte exact);
  voor 2016-2022 kon ik geen directe, even expliciete belastingdienst.nl-pagina vinden om hetzelfde
  te doen. Bekijk dit zelf voordat je één cijfer overneemt:
  - [2026](https://odb.belastingdienst.nl/wp-content/uploads/2026/01/20251218-Overzicht-cijfers-leven-2026-FsL.pdf) (18 december 2025, gepubliceerd op belastingdienst.nl zelf)
  - [2022](https://www.fiscaalleven.eu/CijfersLeven2022-FsL.pdf) (21 december 2021)
  - [2021](https://www.fiscaalleven.eu/CijfersLeven2021-FsL.pdf) (16 december 2020)
  - [2020](https://www.fiscaalleven.eu/CijfersLeven2020-FsL.pdf) (18 december 2019)
  - [2016](https://www.fiscaalleven.eu/CijfersLeven2016-FsL.pdf) (23 december 2015)
  - 2017, 2018, 2019, 2023, 2024, 2025: URL niet gevonden binnen de tijd van deze sessie — zie
    "Nog niet gecheckt" onderaan.

### Wat de bronnen zeggen vs. wat `fiscaleParameters.ts` heeft

| Jaar | Bron: % | Site: % | Bron: factor A | Site: factor A | Bron: reserveringsruimte | Site: reserveringsruimte |
|---|---|---|---|---|---|---|
| 2016 | **13,8%** | 13,3% ❌ | 6,5 ✓ | 6,50 | leeftijdsafhankelijk: €7.088 / €13.997 | €28.000 flat ❌ |
| 2020 | 13,3% ✓ | 13,3% | **6,27** ✓ | 6,27 | leeftijdsafhankelijk: €7.371 / €14.552 | €28.000 flat ❌ |
| 2021 | 13,3% ✓ | 13,3% | **6,27** ✓ | 6,27 | leeftijdsafhankelijk: €7.489 / €14.785 | €28.000 flat ❌ |
| 2022 | 13,3% ✓ | 13,3% | **6,27** ❌ | 7,44 | leeftijdsafhankelijk: €7.587 / €14.978 | €28.000 flat ❌ |
| 2026 | 30% ✓ | 30% | 6,27 ✓ | 6,27 | €42.753 ✓ (geen leeftijdstiers meer) | €42.753 ✓ |

Franchise en aftoppingsgrens/maxInkomen kwamen voor **alle** geverifieerde jaren (2016, 2020, 2021,
2022, 2026) tot op de euro overeen met `fiscaleParameters.ts` — dat deel van de config is dus
betrouwbaar gebleken.

### Conclusies (nog steeds: geen definitieve vaststelling, dat is aan jou)

1. **A7/F1, factor A 2022: de site heeft het waarschijnlijk fout.** Zowel de site als Hendriks skill
   claimen 7,44 voor 2022, maar de bron zegt voor 2020, 2021 én 2022 steeds 6,27 — 7,44 komt in geen
   van de vier geraadpleegde bron-tabellen voor. Sterke aanwijzing dat 7,44 een verkeerd
   overgenomen cijfer is dat ergens de site (én de skill, apart) is binnengeslopen — mogelijk uit een
   ouder jaar waar dit getal wél gold (nog niet gevonden binnen deze sessie).
2. **F1-hypothese 2 bevestigd: 2016 en 2017 lijken verwisseld.** De bron zegt 2016 = 13,8%, de site
   heeft dat percentage bij 2017 staan. Dit raakt rechtstreeks A7's getoonde formuletekst.
3. **F1-hypothese 4 bevestigd, en groter dan gedacht: de reserveringsruimte vóór 2023 was geen vast
   bedrag maar leeftijdsafhankelijk** (twee tarieven, grofweg rond de 55-56 jaar-grens, gekoppeld aan
   de destijds geldende AOW-leeftijd), met bedragen tussen ruwweg €7.000 en €15.000 — niet het platte
   €28.000-plafond dat nu voor alle jaren 2016-2022 in de config staat. Dit is voor élk van de vier
   geverifieerde pre-2023 jaren fout, niet slechts één jaar.
4. **Nieuw, niet eerder genoemd: "Toevoeging oudedagsreserve" (FOR) staat als apart, expliciet
   percentage in de bron** (9,44% van de winst, met een absoluut maximum ~€9.200-9.600 per
   geverifieerd jaar) — bevestigt dat dit een reëel, in de bron kwantificeerbaar mechanisme is dat
   volledig ontbreekt in `jaarruimte.ts`, niet alleen een vage constatering.
5. **B4** ("30% in 2026"): bevestigd, klopt met de bron.
6. **Terugkijktermijn**: voor 2026 expliciet bevestigd als 10 jaar. Of dit ook al zo was in
   bijvoorbeeld 2016-2022 (F1's vraag of het toen 7 jaar was) kon ik niet apart bevestigen — de
   bron-tabellen noemen dit getal niet expliciet per jaar.

### Nog niet gecheckt binnen deze sessie
2017, 2018, 2019, 2023, 2024, 2025 (URL's niet snel genoeg gevonden), de exacte terugkijktermijn
per historisch jaar, en de precieze leeftijdsgrens-formule van de reserveringsruimte-tiers (lijkt
gekoppeld aan de destijds geldende AOW-leeftijd, niet aan een vast getal als "56").

---

## 2. A10 — afbouwpunt arbeidskorting 2026

**Bron:** [Tabel arbeidskorting 2026 | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/tabel-arbeidskorting-2026),
geraadpleegd 12 augustus 2026.

Letterlijke tabel (jonger dan AOW-leeftijd): "€ 45.593 - € 132.920 | € 5.685 - 6,510% x
(arbeidsinkomen - € 45.592)", "vanaf € 132.921 | € 0". **Het afbouwpunt is dus € 132.920** —
exact gelijk aan de eigen navrekening uit Fase 1 (`AUDIT-fase0-1-feiten.md`, A10) op basis van
`fiscaleParameters.ts`. Alle knikpunten en percentages in de bron (8,324% / 31,009% / 1,950% /
afbouw 6,510% vanaf €45.593, max €5.685) kwamen exact overeen met `HEFFINGSKORTING_PRE_AOW.arbeidskorting`.

**Conclusie: de config (`fiscaleParameters.ts`) is voor de arbeidskorting volledig correct. Het
hardcoded getal "±€132.290" in `BrutoNetto/index.tsx` is het enige dat fout is** — €630 te laag,
puur een tekstfout, niet een configfout. Bevestigt de Fase 1-aanbeveling: laat dit blok naar de
config verwijzen in plaats van de eigen literals te herhalen, dan verdwijnt deze fout vanzelf en
kan hij niet meer terugkomen.

De bron geeft ook meteen de **AOW-leeftijd-variant** (nodig voor E4), die nu nergens in de config
staat:

| Schijf | Jonger dan AOW-leeftijd | AOW-leeftijd bereikt |
|---|---|---|
| tot €11.965 | 8,324% | 4,156% |
| €11.966 - €25.845 | €996 + 31,009% × (inkomen − €11.965) | €498 + 15,483% × (inkomen − €11.965) |
| €25.846 - €45.592 | €5.300 + 1,950% × (inkomen − €25.845) | €2.647 + 0,974% × (inkomen − €25.845) |
| €45.593 - €132.920 | €5.685 − 6,510% × (inkomen − €45.592) | €2.840 − 3,250% × (inkomen − €45.592) |
| vanaf €132.921 | €0 | €0 |
| **Maximum** | **€5.685** | **€2.840** |

---

## 3. E2 — box 3, forfaitair rendement en tarief 2026

**Bron:** [Hoe is het box 3-inkomen op mijn voorlopige aanslag 2026 berekend? | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/berekening-box-3-inkomen-2026),
geraadpleegd 12 augustus 2026.

- **Tarief: 36%**
- **Heffingsvrij vermogen: €59.357** per persoon (2026) — komt exact overeen met het cijfer in de
  fiscaalleven.eu-lijfrentetabel voor 2026 (zie sectie 1), twee onafhankelijke bronnen eens.
- **Forfaitaire rendementen 2026**: spaargeld 1,28% (voorlopig), beleggingen/overige bezittingen
  6,00% (definitief), schulden 2,70% (voorlopig). "Voorlopig" omdat de definitieve cijfers pas na
  afloop van het jaar vaststaan (Belastingdienst gebruikt bij de voorlopige aanslag een schatting).

**Voor het besluit over E2** (wel/niet box 3 modelleren): dit is genoeg om een eenvoudige,
eerste-orde schatting te bouwen als je daarvoor kiest — forfaitair rendement × 36% belasting over
het deel boven €59.357 (of €118.714 samen met een fiscaal partner). Geen uitspraak hier over de
ontwerpkeuze zelf, dat is aan jou.

---

## 4. B2 — spaarrente- en CBS-claims in `sparen-maakt-mensen-arm.md`

**CBS-inflatie januari 2026 — bevestigd correct.** [CBS: "Inflatie daalt naar 2,4 procent in
januari"](https://www.cbs.nl/nl-nl/nieuws/2026/07/inflatie-daalt-naar-2-4-procent-in-januari),
gepubliceerd door CBS zelf. De claim in het artikel ("in januari 2026 kwam ze uit op 2,4%") klopt
exact.

**"Drie grote banken boden zomer 2026 alle drie exact 1,25%" — waarschijnlijk niet (meer) juist,
niet volledig primair geverifieerd.** Via vergelijkingssites (dus niet de banken zelf — dat is
buiten de toegestane bronnenlijst van dit Fase 2, die niet voorziet in "bankrente" als categorie):
ABN AMRO en ING rond de 1,25%, maar **Rabobank rond de 1,40%** — dus niet alle drie gelijk. Dit is
een snelle claim om zelf te checken op de drie bank-sites (rabobank.nl, ing.nl, abnamro.nl),
sneller voor jou te doen dan voor mij op een manier die aan de bronregels van dit Fase 2 voldoet.

**Tienjaarsgemiddelde CBS-inflatie — niet gecheckt** binnen de tijd van deze sessie.

---

## Wat nog open staat na deze sessie
- Jaarruimte 2017-2019, 2023-2025 (zie sectie 1).
- Terugkijktermijn en leeftijdsgrens-formule van de historische reserveringsruimte-tiers exact.
- Ouderenkorting/alleenstaande-ouderenkorting 2026 met een directe belastingdienst.nl-citaat (wel
  gevonden via zoeken — alleenstaande ouderenkorting €540, niet-inkomensafhankelijk — maar niet
  rechtstreeks op een belastingdienst.nl-pagina bevestigd binnen deze sessie).
- B2's tienjaarsgemiddelde en de exacte spaarrente-vergelijking (drie bank-sites zelf checken).
- B5 (Trinity-studie, Cagan, DNB-depositogarantie, ECB-inflatiedoel, Hanke & Krus): niet
  opgepakt — laag risico, zoals het auditplan zelf al aangaf, bewust niet apart geverifieerd.

## Belangrijkste bevinding van deze fase
**F1 is voor een belangrijk deel opgelost, in het nadeel van de site:** het 2022-factor-A-cijfer
(7,44) is hoogstwaarschijnlijk fout (moet 6,27 zijn), 2016/2017 se jaarruimtepercentages lijken
verwisseld, en de hele reserveringsruimte-structuur vóór 2023 mist een leeftijdsafhankelijkheid die
in de bron wél bestaat. A10 is opgelost (config klopt, alleen de UI-tekst niet). B4 en de
CBS-claim in B2 zijn bevestigd correct. Niets hiervan is doorgevoerd in code — dat is aan jou om te
beoordelen en pas daarna te laten fixen.

