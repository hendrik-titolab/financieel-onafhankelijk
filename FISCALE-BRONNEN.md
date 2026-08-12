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

**Bron:** [Voorlopige aanslag 2026: gebruikte tarieven en heffingskortingen | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen),
geraadpleegd 13 augustus 2026.

| Parameter | Waarde in de site (2026) | Status | Bron |
|---|---|---|---|
| Schijf 1-grens | €38.883 | ✅ | rechtstreeks bevestigd |
| Schijf 2-grens | €78.426 | ✅ | rechtstreeks bevestigd |
| Schijf 1-tarief, jonger dan AOW | 35,75% | ✅ | rechtstreeks bevestigd |
| Schijf 1-tarief, AOW-leeftijd | 17,85% | ✅ | rechtstreeks bevestigd |
| Schijf 2-tarief (beide) | 37,56% | ✅ | rechtstreeks bevestigd |
| Schijf 3-tarief (beide) | 49,50% | ✅ | rechtstreeks bevestigd |

Alle zes waarden komen exact overeen met de bron. Dit blok is daarmee van 🟡 naar ✅ gegaan.

**Eén cohort dat de site niet kent.** Wie geboren is vóór 1 januari 1946 heeft een ruimere eerste
schijf: tot en met €41.123 in plaats van €38.883, tegen hetzelfde tarief van 17,85%. De config kent
maar één post-AOW-tabel. Het gaat om mensen die in 2026 tachtig of ouder zijn, dus voor een
planningstool met een opbouwfase is de kans klein dat het uitmaakt. Genoteerd als bekend gat, niet
als bevinding.

Update-URL voor een volgend jaar: dezelfde pagina, of zoek op belastingdienst.nl naar "tarieven
box 1" voor het betreffende jaar.

---

## 2. Heffingskortingen — jonger dan AOW-leeftijd (`HEFFINGSKORTING_PRE_AOW`)

**Bron:** [Tabel arbeidskorting 2026 | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/tabel-arbeidskorting-2026),
geraadpleegd 12 augustus 2026. Voor de algemene heffingskorting: [Tabel algemene heffingskorting 2026 | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/algemene_heffingskorting/tabel-algemene-heffingskorting-2026)
(URL gevonden, inhoud deze sessie niet apart opgehaald — nog ⬜ voor de algemene heffingskorting
specifiek, wel al intern consistent bevonden).

| Parameter | Waarde in de site | Status |
|---|---|---|
| Algemene heffingskorting, maximum | €3.115 | ✅ (tabel opgehaald 13 augustus 2026) |
| Algemene heffingskorting, afbouw vanaf | €29.736 | ✅ — de tabel zegt "afbouw vanaf €29.737", de formule rekent met `verzamelinkomen − €29.736`. De config gebruikt de formulewaarde en is dus juist. |
| Algemene heffingskorting, afbouwpercentage | 6,398% | ✅ |
| Algemene heffingskorting, nihil bij | €78.426 | ✅ — de tabel zegt "nihil vanaf €78.427". Bij €78.426 komt de formule op €0,19 uit, afgerond nul. Verschil in definitie, niet in uitkomst. |
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

**Bronnen, geraadpleegd 13 augustus 2026:**
[Heffingskortingen voor AOW-gerechtigden | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/heffingskortingen_voor_aow_gerechtigden)
en [Tabel algemene heffingskorting 2026 | Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/algemene_heffingskorting/tabel-algemene-heffingskorting-2026).

| Parameter | Waarde (2026) | Status |
|---|---|---|
| Algemene heffingskorting AOW, maximum | €1.556 | ✅ |
| Algemene heffingskorting AOW, afbouw vanaf | €29.737 (formule rekent vanaf €29.736) | ✅ |
| Algemene heffingskorting AOW, afbouwpercentage | 3,195% | ✅ |
| Algemene heffingskorting AOW, nihil vanaf | €78.427 | ✅ |
| Ouderenkorting, maximum | €2.067 | ✅ |
| Ouderenkorting, afbouw vanaf | €46.002 | ✅ |
| Ouderenkorting, afbouwpercentage | 15% | ✅ |
| Ouderenkorting, nihil vanaf | €59.783 | ✅ |
| Alleenstaandeouderenkorting | €540 (niet-inkomensafhankelijk) | ✅ |
| Arbeidskorting AOW, opbouw 1 | 4,156% tot €11.965 | ✅ |
| Arbeidskorting AOW, opbouw 2 | 15,483% tot €25.845 | ✅ |
| Arbeidskorting AOW, opbouw 3 | 0,974% tot €45.592 | ✅ |
| Arbeidskorting AOW, maximum | €2.840 | ✅ |
| Arbeidskorting AOW, afbouw | 3,250% vanaf €45.593 | ✅ |

**Twee interne controles, allebei kloppend.** De afbouw van de algemene
heffingskorting eindigt precies op nul: `1.556 − 3,195% × (78.426 − 29.736) =
1.556 − 1.555,65 = 0,35`, dus afgerond nul bij €78.426 en nihil vanaf €78.427.
Bij de ouderenkorting: `2.067 / 15% = 13.780`, en `46.002 + 13.780 = 59.782`, dus
nihil vanaf €59.783. Beide sluiten aan op wat de pagina zelf noemt.

**Waard om te weten bij E4.** De algemene heffingskorting na de AOW-leeftijd is
vrijwel exact de helft van die ervoor (€1.556 tegen €3.115, 3,195% tegen 6,398%).
Dat is geen toeval: het AOW-premiedeel valt weg. Het effectieve marginale tarief
op aanvullend pensioen loopt door de gestapelde afbouw van de algemene
heffingskorting (3,195%) en de ouderenkorting (15%) fors op boven het
schijventarief. Tussen €46.002 en €59.783 komt daar bovenop het schijftarief
37,56% plus 15% plus 3,195%, dus ruim boven de 50%. Dat is precies het effect dat
de FO-planner nu helemaal niet kent.

**De arbeidskorting is voor de FO-planner niet relevant**, want een
werkgeverspensioen is geen arbeidsinkomen. Voor de Bruto-netto-tool wel, als
iemand doorwerkt na de AOW-leeftijd.

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
2026 rechtstreeks van belastingdienst.nl (✅). Alle overige jaren (2016-2025) van een
derde-partijbron gehost op belastingdienst.nl, wetsartikel per regel (🟡, **behandel als
voorlopig, wel compleet voor alle elf jaren**).

| Jaar | Franchise | Max inkomen | % (site → bron) | Factor A (site → bron) | Reserveringsruimte (site → bron) |
|---|---|---|---|---|---|
| 2016 | €11.996 🟡 | €101.519 🟡 | 13,3% → **13,8%** ⚠️ | 6,50 → 6,5 ✓ | €28.000 flat → **leeftijdsafh. €7.088/€13.997** ⚠️ |
| 2017 | €12.032 🟡 | €103.317 🟡 | 13,8% → 13,8% ✓ | 6,50 → 6,5 ✓ | €28.000 flat → **leeftijdsafh. €7.110/€14.039** ⚠️ |
| 2018 | €12.129 🟡 | €105.075 🟡 | 13,3% → 13,3% ✓ | 6,50 → **6,27** ⚠️ | €28.000 flat → **leeftijdsafh. €7.167/€14.152** ⚠️ |
| 2019 | €12.275 🟡 | €107.593 🟡 | 13,3% → 13,3% ✓ | 6,27 → 6,27 ✓ | €28.000 flat → **leeftijdsafh. €7.254/€14.322** ⚠️ |
| 2020 | €12.472 🟡 | €110.111 🟡 | 13,3% → 13,3% ✓ | 6,27 → 6,27 ✓ | €28.000 flat → **leeftijdsafh. €7.371/€14.552** ⚠️ |
| 2021 | €12.672 🟡 | €112.189 🟡 | 13,3% → 13,3% ✓ | 6,27 → 6,27 ✓ | €28.000 flat → **leeftijdsafh. €7.489/€14.785** ⚠️ |
| 2022 | €12.837 🟡 | €114.866 🟡 | 13,3% → 13,3% ✓ | 7,44 → **6,27** ⚠️ | €28.000 flat → **leeftijdsafh. €7.587/€14.978** ⚠️ |
| 2023 | €13.646 🟡 | €128.810 🟡 | 30% → 30% ✓ | 6,27 → 6,27 ✓ | €32.000 → **€38.000** ⚠️ |
| 2024 | €17.545 🟡 | €137.800 🟡 | 30% → 30% ✓ | 6,27 → 6,27 ✓ | €38.000 → **€41.608** ⚠️ |
| 2025 | €18.475 🟡 | €137.800 🟡 | 30% → 30% ✓ | 6,27 → 6,27 ✓ | €38.000 → **€42.108** ⚠️ |
| 2026 | €19.172 ✅ | €137.800 ✅ | 30% → 30% ✅ | 6,27 → 6,27 ✅ | €42.753 → €42.753 ✅ |

**Franchise en max inkomen kwamen voor alle elf jaren tot op de euro overeen — dat deel van de
config is betrouwbaar gebleken, ook al staat het door de bronstatus nog op 🟡.**

**Wat er precies mis lijkt, samengevat:**
- **Percentage**: alleen 2016 fout (moet 13,8% zijn, niet 13,3% — de daling naar 13,3% ging pas in
  bij 2018, niet bij 2017 zoals eerder vermoed).
- **Factor A**: twee jaren fout, niet één — 2018 (moet 6,27 zijn, niet 6,50: de overstap gebeurde
  dus een jaar eerder dan de config aangeeft) én 2022 (moet 6,27 zijn, niet 7,44).
- **Reserveringsruimte**: fout in **alle** jaren behalve 2026. Vóór 2023 ontbreekt het hele
  leeftijdsafhankelijke systeem (zie §5b). Ná 2023 is het geen leeftijdskwestie meer, maar kloppen
  de bedragen zelf niet — de site lijkt één jaar achter te lopen (2024's site-cijfer is exact
  2023's echte cijfer) en 2025 herhaalt gewoon 2024's foute cijfer.

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
Jaarruimte 2016-2025 van 🟡 (voorlopig) naar ✅ (primair bevestigd) krijgen — zoek een directe
belastingdienst.nl-pagina of wetten.overheid.nl art. 3.127 per jaar, in plaats van de
derde-partijbron. Verder: algemene heffingskorting 2026 (URL al bekend, inhoud nog niet
opgehaald), box 1-tarieven apart bevestigen, ouderenkorting-bedrag, en de exacte
terugkijktermijn/leeftijdsgrens-formule voor jaren vóór 2020 (patroon "AOW-leeftijd min 10 jaar"
is consistent in alle zeven gecontroleerde pre-2023-jaren, maar niet expliciet zo benoemd in de
bron).
