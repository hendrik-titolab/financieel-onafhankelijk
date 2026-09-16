# Wat er volgende week ligt

> Geschreven 13 augustus 2026, aan het eind van de sessie waarin de fiscale bron,
> de jaarruimtecorrecties en E4 zijn gebouwd. Alles wat hieronder "live" heet staat
> gepusht en is geverifieerd.

---

# Begin hier: de jaarruimte-skill klopt niet meer

`C:\Users\schak\.claude\skills\jaarruimte-berekening\references\parameters.md`

Deze week is de website gecorrigeerd op drie jaarruimtecijfers, met de wettekst en
de advieskaart als bron. **De skill is niet meegegaan en is nu aantoonbaar fout.**

| Jaar | Skill zegt | Juist |
|---|---|---|
| 2020 | factor 7,44 | 6,27 |
| 2021 | factor 7,44 | 6,27 |
| 2022 | factor 7,44 | 6,27 |

Er staat bovendien een zin in dat de factor "van 7,44 naar 6,27" ging bij de
overgang naar het Wtp-regime. Dat klopt niet: 6,27 gold al vanaf 2019, en daarvoor
gold 6,50. Die 7,44 komt in geen enkele bron voor die we deze week hebben
nagetrokken, en stond ook in de website tot we hem corrigeerden.

**Waarom dit bovenaan staat:** dit is de enige fout van deze week die niet op een
website staat maar in het gereedschap waarmee je adviesgesprekken voert.

Het verschilrapport staat klaar in `Documents\Fiscale bron\verschilrapport-jaarruimte-skill.md`.
De generator overschrijft de skill bewust niet, want overschrijven van advieswerk
hoort een bewuste handeling te zijn.

---

# Beslissingen die klaarliggen

Vier stuks. De motor en de cijfers zijn er, alleen de keuze ontbreekt. Volgorde is
mijn advies, van meeste naar minste effect.

## 1. Box 3 modelleren (E2)

Nu volledig afwezig. Voor jouw doelgroep, mensen met een groot vrij belegd
vermogen, is dit de grootste ontbrekende kostenpost: bij een forfait van 6,00% op
beleggingen en 36% tarief kost het ongeveer **2,16% van het belegde vermogen per
jaar**. Dat is meer dan het verschil tussen twee naast elkaar liggende
risicoprofielen.

Alle parameters staan al in de bron en zijn bevestigd bij de Belastingdienst.
Wat er nog ontbreekt is de toerekeningsformule van forfaitair voordeel naar
belastbaar bedrag; die staat als open punt in `fiscale-cijfers.json` onder
`box3._ontbreekt`.

**Aanbeveling:** doen, en simpel houden. Forfait en tarief uit de bron, geen
verfijning naar vermogensmix.

**Effect:** de uitkomst wordt ongunstiger. Net als E4.

## 2. Kosten van beleggen (E3)

Het ingevulde rendement wordt behandeld als wat je netto overhoudt. In de praktijk
gaan er fonds- en platformkosten af. 0,5% per jaar over dertig jaar kost ongeveer
14% van het eindvermogen.

**Aanbeveling:** een kostenveld met een realistische standaardwaarde. Microcopy die
om "rendement na kosten" vraagt is goedkoper te bouwen, maar verschuift het
rekenwerk naar de gebruiker en die doet het niet.

## 3. Indexatie van het aanvullend pensioen (E5)

Het model houdt AOW en pensioen constant in reële euro's en neemt dus aan dat
beide exact met de inflatie meestijgen. Voor de AOW is dat verdedigbaar, want die
is gekoppeld aan het minimumloon. Voor een aanvullend pensioen niet: indexatie is
voorwaardelijk, ook onder de Wtp. Eén procentpunt achterstand per jaar over dertig
jaar geeft een 26% lagere reële uitkering dan het model toont.

**Aanbeveling:** een indexatieveld voor het aanvullend pensioen, AOW laten zoals
het is.

## 4. Veld "waarvan fiscaal beklemd" (E1-optie-B)

Jouw eigen voorstel. Dit kan nu pas goed, want E4 heeft de belastingmotor gelegd
die ervoor nodig is.

Let op het ontwerp: een lijfrentepot is geen pot waar je vrij uit onttrekt. Bij
expiratie moet het kapitaal worden omgezet in periodieke uitkeringen (art. 3.125
Wet IB 2001). Modelleer het dus als een derde inkomensbron naast AOW en
werkgeverspensioen, niet als vermogen. Het bedrag moet uit `currentCapital` gehaald
worden vóór de vrije-onttrekkingslogica én vóór de Monte Carlo, anders telt het
dubbel.

De grenzen staan al in de bron: maximale jaaruitkering tijdelijke oudedagslijfrente
€ 27.192, overbruggingslijfrente € 63.288.

`nettoToBruto()` in `pensionCalc.ts` is nu dode code en wordt hierbij weer nuttig.

---

# Kleinere punten, geen beslissing nodig

**De inlegconventie.** `monthlyPMT * 12` wordt pas ná de jaarlijkse
rendementsfactor bijgeschreven, terwijl de inleg maandelijks is. Er komt dus geen
rendement over de eigen inleg in het jaar zelf. `monteCarlo.ts` doet het identiek,
dus de twee zijn onderling consistent. Los je dit op, doe het dan in beide
bestanden tegelijk.

**`currentIncome` (A19).** Wordt ingevuld, telt nergens mee, staat wel in de
Excel-export. Weghalen of labelen als "alleen voor je eigen dossier".

**`getParams()` (A8/A9).** Valt voor een onbekend jaar stil terug op 2026. Het
bereikbare pad ernaartoe is dicht, maar de functie zelf niet. Mijn advies blijft:
falen met een melding in plaats van raden.

**Cohort geboren vóór 1946.** Heeft een ruimere eerste schijf (€ 41.123 in plaats
van € 38.883). De config kent maar één post-AOW-tabel. Gaat om tachtigplussers, dus
klein risico, maar het staat nu genoteerd.

**Hypotheekcijfers.** De sectie in de bron staat klaar maar is leeg. Zodra de
hypotheektak start is dit de eerste klus, en de advieskaart bevat al het
eigenwoningforfait. Let op: de skill `hypotheekberekenen` bevat mogelijk al
getallen, en dan heb je meteen weer twee plekken.

---

# Ideeën om de site te verbeteren

Geen bevindingen uit de audit, maar dingen die me deze week opvielen.

## De downloadlimiet doet niet wat jij ermee wilt

Jouw doel is dat mensen contact opnemen als ze meer willen. De limiet blokkeert de
vierde download, maar biedt geen zichtbare route om contact op te nemen. Wie
tegen de grens loopt, gaat weg in plaats van mailen. Eén zin met een mailtolink op
dat moment zou het verschil zijn tussen een drempel en een uitnodiging.

## Je weet niet waar mensen afhaken

Er zijn alleen kale paginabezoeken via Vercel Web Analytics. Je weet niet hoeveel
bezoekers op "Bereken" drukken, hoeveel er doorklikken naar de tweede tab, of
hoeveel er afhaken bij het invullen. Voor een tool met achttien invoervelden is dat
de belangrijkste vraag die je nu niet kunt beantwoorden. Een handvol events zou al
genoeg zijn.

## De tool vraagt om een uitkomst die je nog niet toont

De planner rekent nu netjes de belasting over AOW en pensioen. Wat hij niet laat
zien is wat iemand daar concreet aan heeft: bijvoorbeeld dat het marginale tarief
tussen € 46.002 en € 59.783 boven de 55% ligt, en dat het dus loont om een
lijfrente-uitkering over meer jaren te spreiden. Dat is precies het soort inzicht
waar een adviseur voor betaald wordt, en het valt nu uit de berekening af te leiden
zonder dat de gebruiker het ziet.

## Testdekking stopt bij de rekenkern

98 tests, allemaal op `src/utils/`. De React-componenten zijn niet getest. Dat is
een bewuste en verdedigbare grens, maar het betekent dat een fout in de UI (zoals
de formuleteksten die 30% zeiden terwijl er 13,3% werd gerekend) alleen door
handmatig kijken gevonden wordt. Als er ooit één componenttest komt, maak het dan
die: klopt de getoonde formule met de berekende uitkomst.

---

# Hoe deze week gewerkt is, en waarom dat hielp

- **Elke rekenwijziging onafhankelijk narekenen vóór het bijwerken van een
  golden-fixture.** Dat haalde deze week drie fouten boven water die anders waren
  doorgeschoten, waaronder een fout in mijn eigen handberekening.
- **De golden master toont wat er verandert, niet of het goed is.** Toen de
  correctie van 2022 geen enkele fixture veranderde, bleek het testscenario de
  factor helemaal niet te raken. Dat is opgelost met een tweede scenarioreeks.
- **Vóór elke commit:** `npm run test`, `npm run build`, `npm run check`.
- **Live controleren met de waarden uit de DOM gelezen**, niet van een screenshot
  afgelezen.
- **Let op bij UI-tests:** React luistert voor `onBlur` op `focusout`. Een test die
  de waarde via een synthetisch `blur`-event zet, lijkt te bewijzen dat er niets
  gebeurt terwijl de code werkt.
- **Werken op een eigen branch, mergen met `--no-ff`**, en pushen pas na akkoord.
  Elke push naar `astro-migratie` deployt binnen minuten naar de live site.

---

# Waar alles staat

| Wat | Waar |
|---|---|
| Fiscale bron, generator, handleiding | `C:\Users\schak\Documents\Fiscale bron` (privé GitHub-repo `fiscale-bron`) |
| Snelkoppelingen | Bureaublad: "Fiscale bron" en "Zo werk ik de fiscale cijfers bij" |
| Website | `C:\Users\schak\financiele-planning`, branch `astro-migratie` |
| Auditrapport | `AUDIT-2026-08-bevindingen.md` |
| Contentklus, uitbesteed | `HANDOFF-content-feitencheck.md` |
| Openstaande punten, automatisch | draai `node genereer.mjs`, nu 10 punten |

Cijfers bijwerken gaat via `fiscale-cijfers.json` en dan `node genereer.mjs`. Nooit
rechtstreeks in `fiscaleParameters.ts` of `risicoprofielen.ts`: die zijn gegenereerd
en een handmatige wijziging is bij de volgende generatie weg.
