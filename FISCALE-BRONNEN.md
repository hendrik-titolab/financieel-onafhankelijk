# Fiscale bronnen — referentiedocument

**Doel:** één plek met alle fiscale grondslagen die de rekentools gebruiken, elk met bron en
status, zodat jij zelf kunt controleren en minimaal twee keer per jaar kunt bijwerken zonder
opnieuw alles te hoeven opzoeken.

**Dit is geen vervanging van `src/config/fiscaleParameters.ts`** (dat blijft de bron die de code
daadwerkelijk gebruikt) **maar een controlelaag ernaast.** Bij een update: eerst dit document
bijwerken met de nieuwe bron-cijfers, dan pas `fiscaleParameters.ts` aanpassen zodat beide synchroon
blijven. Zie ook de bestaande instructie bovenin `fiscaleParameters.ts` zelf ("Volgende check:
oktober 2026... laat de kwartaalagent dit bijwerken") — dat verwijst naar hetzelfde soort update,
nu dus met dit document als achterliggende controle.

**Ontstaan:** audit 2026-08 (`AUDIT-fase0-1-feiten.md`, `AUDIT-fase2-externe-bronnen.md`). Dit
document vat die twee samen tot één doorlopend te onderhouden overzicht, niet als eenmalig
auditverslag maar als iets om steeds opnieuw te openen bij een update.

## Legenda

| Teken | Betekenis |
|---|---|
| ✅ | Rechtstreeks bevestigd op een primaire bron (belastingdienst.nl, cbs.nl) |
| 🟡 | Bevestigd via een bron die op belastingdienst.nl gehost staat maar door een derde partij is opgesteld (met wetsartikel per regel, dus zelf natrekbaar) — **behandel als voorlopig, nog niet als vaststaand** |
| ⚠️ | Site en bron wijken van elkaar af — concrete actie nodig |
| ⬜ | Nog niet gecontroleerd deze ronde |

---

## 1. Box 1-tarieven (`BOX1_PRE_AOW`, `BOX1_POST_AOW`)

| Parameter | Waarde in de site (2026) | Status | Bron |
|---|---|---|---|
| Schijf 1-grens | €38.883 | 🟡 | Niet apart dit jaar herbevestigd, wel intern consistent met alle geverifieerde jaren |
| Schijf 2-grens | €78.426 | 🟡 | idem |
| Schijf 1-tarief, jonger dan AOW | 35,75% | 🟡 | idem |
| Schijf 1-tarief, AOW-leeftijd | 17,85% | 🟡 | idem |
| Schijf 2-tarief (beide) | 37,56% | 🟡 | idem |
| Schijf 3-tarief (beide) | 49,50% | 🟡 | idem |

Niet apart extern herbevestigd deze sessie (buiten de arbeidskorting/AHK-tabel om, die deze
grenzen impliciet bevestigen — zie hieronder). Update-URL voor een volgend jaar: zoek op
belastingdienst.nl naar "tarieven box 1" voor het betreffende jaar.

---

## 2. Heffingskortingen — jonger dan AOW-leeftijd (`HEFFINGSKORTING_PRE_AOW`)

**Bron:** [Tabel arbeidskorting 2026 | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/tabel-arbeidskorting-2026),
geraadpleegd 12 augustus 2026. Voor de algemene heffingskorting: [Tabel algemene heffingskorting 2026 | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/algemene_heffingskorting/tabel-algemene-heffingskorting-2026)
(URL gevonden, inhoud deze sessie niet apart opgehaald — nog ⬜ voor de algemene heffingskorting
specifiek, wel al intern consistent bevonden).

| Parameter | Waarde in de site | Status |
|---|---|---|
| Algemene heffingskorting, maximum | €3.115 | ⬜ (URL bekend, niet opgehaald) |
| Algemene heffingskorting, afbouw vanaf | €29.736 | ⬜ |
| Algemene heffingskorting, afbouwpercentage | 6,398% | ⬜ |
| Algemene heffingskorting, nihil bij | €78.426 | ⬜ |
| Arbeidskorting, opbouw 1 | 8,324% tot €11.965 | ✅ |
| Arbeidskorting, opbouw 2 | 31,009% tot €25.845 | ✅ |
| Arbeidskorting, opbouw 3 | 1,95% tot €45.592 | ✅ |
| Arbeidskorting, maximum | €5.685 | ✅ |
| Arbeidskorting, afbouw | 6,510% vanaf €45.593 | ✅ |
| **Arbeidskorting, nihil vanaf** | (niet apart opgeslagen, berekend) | ✅ **€132.920** — zie A10 |

---

## 3. Heffingskortingen — AOW-leeftijd bereikt: **ontbreekt volledig in de config**

Dit is geen bijwerk-taak maar een gat: `fiscaleParameters.ts` heeft geen `HEFFINGSKORTING_POST_AOW`.
De FO-planner en de Bruto-netto-tool gebruiken hierdoor voor iedereen boven de AOW-leeftijd impliciet
de kortingen van vóór de AOW-leeftijd (of, bij de FO-planner, helemaal geen kortingen — zie E4 in
`AUDIT-2026-08-bevindingen.md`). Cijfers hieronder zijn al wel gevonden, klaar om een keer als
config-object te worden toegevoegd:

| Parameter | Waarde (2026) | Status |
|---|---|---|
| Arbeidskorting AOW, opbouw 1 | 4,156% tot €11.965 | ✅ |
| Arbeidskorting AOW, opbouw 2 | 15,483% tot €25.845 | ✅ |
| Arbeidskorting AOW, opbouw 3 | 0,974% tot €45.592 | ✅ |
| Arbeidskorting AOW, maximum | €2.840 | ✅ |
| Arbeidskorting AOW, afbouw | 3,250% vanaf €45.593 | ✅ |
| Ouderenkorting | (bedrag niet gevonden deze sessie) | ⬜ |
| Alleenstaande ouderenkorting | €540 (niet-inkomensafhankelijk) | 🟡 — gevonden via zoeken, niet rechtstreeks op een belastingdienst.nl-pagina bevestigd |

---

## 4. AOW-bedragen (`AOW_NETTO_MAAND`)

| Parameter | Waarde (2026) | Status |
|---|---|---|
| Alleenstaand, netto/mnd | €1.558 | ⬜ — niet apart extern gecheckt deze sessie (wel intern consistent overal gebruikt) |
| Samenwonend, netto/mnd per persoon | €1.068 | ⬜ |

Update-bron: SVB (svb.nl) publiceert de nieuwe bedragen doorgaans eind december voor het volgende
kalenderjaar (en een tussentijdse update per 1 juli).

---

## 5. Jaarruimteparameters per jaar (`JAARRUIMTE_PARAMS`)

Bronnen: zie `AUDIT-fase2-externe-bronnen.md` §1 voor de volledige toelichting en URL's per jaar.
2026 rechtstreeks van belastingdienst.nl (✅). 2016/2020/2021/2022 van een derde-partijbron gehost
op belastingdienst.nl, wetsartikel per regel (🟡, **behandel als voorlopig**). 2017-2019 en
2023-2025: niet gecheckt deze sessie (⬜).

| Jaar | Franchise (site) | Max inkomen (site) | % (site) | % (bron) | Factor A (site) | Factor A (bron) | Reserveringsruimte (site) | Reserveringsruimte (bron) |
|---|---|---|---|---|---|---|---|---|
| 2016 | €11.996 🟡 | €101.519 🟡 | 13,3% | **13,8%** ⚠️ | 6,50 🟡 | 6,5 🟡 | €28.000 flat | **leeftijdsafhankelijk: €7.088 / €13.997** ⚠️ |
| 2017 | €12.032 ⬜ | €103.317 ⬜ | 13,8% | niet gecheckt — **verdacht**, zie hieronder | 6,50 ⬜ | niet gecheckt | €28.000 flat | niet gecheckt |
| 2018 | €12.129 ⬜ | €105.075 ⬜ | 13,3% ⬜ | niet gecheckt | 6,50 ⬜ | niet gecheckt | €28.000 flat | niet gecheckt |
| 2019 | €12.275 ⬜ | €107.593 ⬜ | 13,3% ⬜ | niet gecheckt | 6,27 ⬜ | niet gecheckt | €28.000 flat | niet gecheckt |
| 2020 | €12.472 🟡 | €110.111 🟡 | 13,3% | 13,3% ✓ 🟡 | 6,27 | 6,27 ✓ 🟡 | €28.000 flat | **leeftijdsafhankelijk: €7.371 / €14.552** ⚠️ |
| 2021 | €12.672 🟡 | €112.189 🟡 | 13,3% | 13,3% ✓ 🟡 | 6,27 | 6,27 ✓ 🟡 | €28.000 flat | **leeftijdsafhankelijk: €7.489 / €14.785** ⚠️ |
| 2022 | €12.837 🟡 | €114.866 🟡 | 13,3% | 13,3% ✓ 🟡 | 7,44 | **6,27** ⚠️ | €28.000 flat | **leeftijdsafhankelijk: €7.587 / €14.978** ⚠️ |
| 2023 | €13.646 ⬜ | €128.810 ⬜ | 30% ⬜ | niet gecheckt | 6,27 ⬜ | niet gecheckt | €32.000 flat ⬜ | niet gecheckt |
| 2024 | €17.545 ⬜ | €137.800 ⬜ | 30% ⬜ | niet gecheckt | 6,27 ⬜ | niet gecheckt | €38.000 ⬜ | niet gecheckt |
| 2025 | €18.475 ⬜ | €137.800 ⬜ | 30% ⬜ | niet gecheckt | 6,27 ⬜ | niet gecheckt | €38.000 ⬜ | niet gecheckt |
| 2026 | €19.172 | €137.800 | 30% | 30% ✅ | 6,27 | 6,27 ✅ | €42.753 | €42.753 ✅ |

**2016/2017-vermoeden, expliciet zo geformuleerd om het niet als vaststaand te lezen:** de bron
voor 2016 zegt 13,8%, terwijl de site dat percentage bij 2017 heeft staan. Dat kán betekenen dat de
twee jaren verwisseld zijn, maar dat is nog niet bevestigd doordat 2017 zelf niet apart is
opgehaald — het zou ook een andere fout kunnen zijn. **Pas hier niets aan zonder 2017 zelf te
hebben gezien.**

**Reserveringsruimte vóór 2023 — dit is geen bijwerk-taak maar een ontwerpvraag.** In alle vier
gecontroleerde jaren was het geen vast bedrag maar twee leeftijdstarieven, met als omslagpunt
steevast **AOW-leeftijd van dat jaar minus 10 jaar** (2016: AOW 65j6m → omslag 55j6m; 2020/2021: AOW
66j4m → omslag 56j4m; 2022: AOW 66j7m → omslag 56j7m — het patroon "min 10 jaar" is consistent over
alle vier). `jaarruimte.ts` kent dit onderscheid nergens. Los van elk jaarcijfer bijwerken, moet
hier een keuze gemaakt worden: dit onderscheid alsnog bouwen voor pre-2023 jaren, of expliciet
vermelden dat de tool voor reserveringsruimte vóór 2023 een vereenvoudiging hanteert.

**Toevoeging oudedagsreserve (FOR)** — ontbreekt volledig, bevestigd als apart mechanisme in de
bron: 9,44% van de winst, met een eigen maximum (varieert per jaar, bijv. €9.632 in 2022, €9.395 in
2021, €9.218 in 2020). Relevant voor elke ondernemer die een jaarruimteberekening over een jaar
vóór 2023 laat doen.

---

## 6. Box 3 (niet gebruikt in de tools — referentie voor het geval E2 wordt opgepakt)

**Bron:** [Hoe is het box 3-inkomen op mijn voorlopige aanslag 2026 berekend? | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/berekening-box-3-inkomen-2026),
geraadpleegd 12 augustus 2026. ✅

| Parameter | Waarde 2026 |
|---|---|
| Tarief | 36% |
| Heffingsvrij vermogen, alleenstaand | €59.357 |
| Heffingsvrij vermogen, fiscaal partners samen | €118.714 |
| Forfaitair rendement, spaargeld | 1,28% (voorlopig) |
| Forfaitair rendement, beleggingen | 6,00% (definitief) |
| Forfaitair rendement, schulden | 2,70% (voorlopig) |

---

## Hoe bij te werken (minimaal twee keer per jaar)

1. **Begin bij de tabellen die de Belastingdienst zelf jaarlijks publiceert** (stap 2/3/4
   hieronder) — die zijn het snelst te controleren en het meest gezaghebbend.
2. **Box 1, heffingskortingen, AOW:** zoek "tabel arbeidskorting [jaar]" en "tabel algemene
   heffingskorting [jaar]" op belastingdienst.nl — de URL-opbouw uit dit document
   (`.../arbeidskorting/tabel-arbeidskorting-2026`) verandert vermoedelijk alleen in het jaartal.
   AOW-bedragen: svb.nl, gepubliceerd eind december en een update per 1 juli.
3. **Jaarruimte:** zoek naar het meest recente "Overzicht cijfers levensverzekeringen" — voor 2026
   stond dat rechtstreeks op belastingdienst.nl (`odb.belastingdienst.nl`); check of dat elk jaar zo
   blijft, anders terugvallen op wetten.overheid.nl, art. 3.127 Wet IB 2001.
4. **Box 3:** belastingdienst.nl, zoek "hoe is het box 3-inkomen berekend [jaar]".
5. **Bij elke update:** eerst de status-kolom in dit document aanpassen (nieuwe waarde, nieuwe
   bron-URL, datum), dán pas `fiscaleParameters.ts` wijzigen. Nooit andersom — anders raakt dit
   document zelf ook verouderd, precies het probleem dat dit document moet voorkomen.
6. **Elke 🟡 in dit document is een uitnodiging, geen afgehandeld punt** — bevestig 'm zodra je een
   directe belastingdienst.nl-bron tegenkomt, en verander dan het teken naar ✅.

## Open voor een volgende check
2017, 2018, 2019, 2023, 2024, 2025 (jaarruimte), algemene heffingskorting 2026 (URL al bekend),
box 1-tarieven apart bevestigen, ouderenkorting-bedrag, terugkijktermijn/leeftijdsgrens-formule
voor jaren vóór 2020.
