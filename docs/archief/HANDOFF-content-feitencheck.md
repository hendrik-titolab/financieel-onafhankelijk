# Feitencheck contentartikelen

> Afgebakende klus, bedoeld voor een aparte sessie. Raakt geen rekencode.
> Vervolg op de audit van augustus 2026, bevindingen B2, B5 en B7.

---

## Waar dit over gaat

Op benikfinancieelonafhankelijk.nl staan veertien uitlegartikelen in
`src/content/uitleg/`. Daar staan feiten en cijfers in die verouderen of nooit
gecontroleerd zijn. De audit heeft ze gevonden maar niet nagetrokken.

**Wat je hier niet doet:** rekencode, fiscale parameters, of iets in `src/utils/`
of `src/config/`. Die zijn deze week uitgebreid herzien en hebben hun eigen
bronsysteem. Kom je iets tegen dat daar thuishoort, schrijf het op en laat het
staan.

---

## Regels die voor alles gelden

**Bronnen.** Elk cijfer dat je bevestigt of wijzigt krijgt een primaire bron met
URL en de datum waarop je hem hebt bekeken. Dus CBS voor inflatie, DNB voor de
depositogarantie, SVB voor AOW-bedragen, de banken zelf voor spaarrentes. Geen
vergelijkingssites, geen blogs, ook niet als ze het bevestigen.

**Bij twijfel weghalen, niet gokken.** Een claim die je niet hard krijgt, maak je
algemener of haal je weg. Dit is een site in het Wft-domein: een onjuist cijfer is
daar een vergunningsrisico, geen slordigheid. Een zin die niet klopt is erger dan
een zin die er niet staat.

**Schrijfstijl.** Alle content volgt `SCHRIJFGIDS.md`, sectie "Websiteteksten /
long read (breed publiek)". Kort samengevat: nuchter en direct, taalniveau B1-B2,
vakwoorden uitleggen in gewone taal, rekenvoorbeelden als bewijs. **Nooit
gedachtestreepjes** (em-dashes), gebruik een komma, dubbele punt of twee losse
zinnen. Geen verkooptaal, geen engagement-vraag als afsluiter, geen "in dit
artikel...".

**Niets pushen.** Werk op een eigen branch, commit per artikel, en laat het mergen
aan Hendrik. `astro-migratie` is de live branch en elke push daarheen deployt
meteen.

---

## Blok 1: drie tijdsgebonden claims (B2)

Alle drie in `src/content/uitleg/sparen-maakt-mensen-arm.md`.

### 1a. De spaarrenteclaim, regel 35. Hoogste prioriteit.

> "In de zomer van 2026 boden de drie grote Nederlandse banken alle drie exact
> hetzelfde: 1,25% op een vrij opneembare spaarrekening."

Opvallend specifiek, en daarmee het makkelijkst te ontkrachten. Controleer bij ING,
Rabobank en ABN AMRO zelf wat de actuele rente op een vrij opneembare spaarrekening
is.

Klopt het niet meer, dan is dit geen kwestie van het getal aanpassen. Zo'n zin
veroudert elk kwartaal opnieuw. Maak hem robuust: noem een orde van grootte met
een peildatum, of verwijs naar het patroon in plaats van naar drie exacte
gelijke percentages. Let op: 1,25% komt verderop in het artikel nog vier keer terug
(regels 41, 43, 84 en in de tabel), dus een wijziging werkt door in het hele stuk
inclusief de rekentabel.

### 1b. Het CBS-inflatiecijfer, regel 31

> "In januari 2026 kwam ze uit op 2,4%"

Controleer bij CBS StatLine. Ook hier: een maandcijfer veroudert. Overweeg het
recentste cijfer met maand erbij, of een jaargemiddelde.

### 1c. Het tienjaarsgemiddelde, regel 31

> "In Nederland lag de inflatie de afgelopen tien jaar gemiddeld rond de 3% per
> jaar."

Reken dit na met CBS-cijfers over de laatste tien volledige jaren. Noteer welke
periode je hebt gebruikt, want dat bepaalt de uitkomst.

---

## Blok 2: stabiele feiten, steekproefsgewijs (B5)

Laag risico, veranderen zelden. Bundel dit, besteed er niet meer dan een uur aan.

| Claim | Waar | Bron |
|---|---|---|
| AOW-bedragen en AOW-leeftijd | `hoeveel-aow-krijg-ik.md` | svb.nl |
| Trinity-studie, 1998 | `wat-is-de-4-procent-regel.md` | oorspronkelijke publicatie |
| Cagan, 1956 | `hoe-hoog-kan-inflatie-worden.md` | oorspronkelijke publicatie |
| Depositogarantie € 100.000 | `sparen-maakt-mensen-arm.md` | dnb.nl |
| ECB-inflatiedoel 2% | meerdere artikelen | ecb.europa.eu |
| Hanke & Krus, 2012 | `hoe-hoog-kan-inflatie-worden.md` | oorspronkelijke publicatie |

De AOW-bedragen kun je ook tegen de bron van de site leggen: in
`C:\Users\schak\Documents\Fiscale bron\fiscale-cijfers.json`, sectie `aow`, staan
€ 1.558 alleenstaand en € 1.068 samenwonend per maand netto. Wijken de artikelen
daarvan af, dan is dat een bevinding.

---

## Blok 3: drie inflatiecijfers op één site (B7)

**Dit is een redactionele keuze van Hendrik, niet iets om zelf op te lossen.**
Leg het voor met een voorstel.

| Plek | Cijfer |
|---|---|
| FO-planner, standaardwaarde inflatieveld | 2,5% |
| FO-planner, hulptekst direct onder datzelfde veld | circa 3,5% (CBS 1960-2025) |
| `sparen-maakt-mensen-arm.md` (3×), `wat-is-de-4-procent-regel.md:27`, `wat-is-inflatie.md:35`, `wanneer-ben-je-financieel-onafhankelijk.mdx:65` | 3% |
| `welke-aannames-gebruikt-de-fo-planner.md:57` | 2,5% |

De vervelendste zijn de eerste twee samen: het veld staat standaard op 2,5% terwijl
de regel eronder zegt dat het langjarig gemiddelde circa 3,5% is. Eén scherm, twee
getallen, geen uitleg.

Drie mogelijke richtingen: de default omhoog, de hulptekst aanpassen, of één zin
die het verschil uitlegt (2,5% ligt dichter bij het ECB-doel van 2%, 3,5% is het
historische Nederlandse gemiddelde). Hendrik kiest.

---

## Hulpmiddel: de artikelcontrole

In `C:\Users\schak\Documents\Fiscale bron`:

```bash
node controleer-artikelen.mjs
```

Dat script vergelijkt bedragen in de artikelen met de fiscale bron en meldt waar ze
niet overeenkomen. Nu meldt het niets, dus het is vooral bedoeld om ná je
wijzigingen te draaien: heb je per ongeluk een bewaakt bedrag veranderd, dan zie je
dat meteen.

---

## Wat al gedaan is, dus niet opnieuw

- **B1**, de "100 biljoen"-rekenfout in `hoe-hoog-kan-inflatie-worden.md`. Staat er
  nu correct: "een 1 met veertien nullen erachter, oftewel 100.000 miljard".
- **B3**, de "na zeven jaar"-claim over koopkrachtverlies. Herschreven.
- **B6**, de interne rekenvoorbeelden. Die zijn allemaal nagerekend en kloppen. De
  drie bedragen in `wanneer-ben-je-financieel-onafhankelijk.mdx` (€ 446.000,
  € 588.000 en € 693.000 bij 3% reëel) zijn tot op de euro juist.

---

## Oplevering

Per gecontroleerde claim: wat er stond, wat je hebt gevonden, met welke bron en op
welke datum, en wat je hebt gewijzigd. Claims die je niet hard kreeg meld je als
zodanig, dat is een prima uitkomst.

Verwacht resultaat: één branch met een commit per artikel, plus een kort overzicht
voor Hendrik met de punten die een keuze van hem vragen.
